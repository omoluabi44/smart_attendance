#!/usr/bin/python3
""" objects that handle all default RestFul API actions for Users """
from models.university import University
from models.attendance import Attendance
from models import storage
import random
from models.user import User
from models.attendance import Attendance
from api.v1.views import app_views
from flask import abort, jsonify, make_response, request
from flasgger.utils import swag_from
from flask_mail import Mail, Message
from os import environ
from datetime import datetime, timedelta
from flask_jwt_extended import jwt_required
from os.path import join, dirname
import boto3
import os
from PIL import Image
import io
import pandas as pd
from datetime import datetime
from openpyxl.styles import Font
from itertools import groupby
rekognition = boto3.client('rekognition', 
                           region_name='us-east-1',
                           aws_access_key_id=os.getenv('AWS_ACCESS_KEY_ID'),
                          aws_secret_access_key=os.getenv('AWS_SECRET_ACCESS_KEY'))





    

s3_client = boto3.client('s3', region_name='us-east-1') 
BUCKET_NAME = 'coursepass-file'


@app_views.route('/upload-video', methods=["POST"], strict_slashes=False)
def upload_video():
    if 'video' not in request.files:
        return jsonify({"error": "No video file provided"}), 400
    file = request.files['video']
    
    if file.filename == '':
        return jsonify({"error": "No file selected"}), 400


    try:
        # 2. Upload the file directly to S3
        # upload_fileobj reads the file directly from the request stream
        s3_client.upload_fileobj(file, BUCKET_NAME, file.filename)
        
        response = rekognition.start_face_search(
            Video={
                'S3Object': {
                    'Bucket': BUCKET_NAME,
                    'Name': file.filename
                }
            },
            CollectionId='Student',          # Your existing collection
            FaceMatchThreshold=90  
        )
        
        # 3. Get the Job ID
        job_id = response['JobId']
        
        return jsonify({
            "message": "Video uploaded and face counting started!",
            "job_id": job_id
        }), 200
    except Exception as e:
        # Catch any AWS credential or bucket errors
        return jsonify({"error": str(e)}), 500

@app_views.route('/check-count/<job_id>', methods=['GET'], strict_slashes=False)
@app_views.route('/check-count/<job_id>', methods=['GET'], strict_slashes=False)
def check_count(job_id):
    try:
        response = rekognition.get_face_search(JobId=job_id)
        status = response['JobStatus']
        
        if status == 'IN_PROGRESS':
            return jsonify({"status": "Still processing..."})
            
        elif status == 'SUCCEEDED':
            all_persons = []
            next_token = response.get('NextToken')
            all_persons.extend(response.get('Persons', []))
            
            while next_token:
                page = rekognition.get_face_search(JobId=job_id, NextToken=next_token)
                all_persons.extend(page.get('Persons', []))
                next_token = page.get('NextToken')
            
            # Build list of results, one entry per face detection event
            all_results = []
            for person in all_persons:
                face_matches = person.get('FaceMatches', [])
                if face_matches:
                    # Take the best match (first in list)
                    best_match = face_matches[0]
                    user_id = best_match.get('Face', {}).get('ExternalImageId')
                    confidence = best_match.get('Similarity', 0)
                    if user_id:
                        all_results.append({
                            "user_id": user_id,
                            "confidence": confidence
                        })
                    else:
                        # Matched a face but ExternalImageId missing
                        all_results.append({"identity": "Unknown", "confidence": confidence})
                else:
                    # No match found for this detection
                    all_results.append({"identity": "Unknown", "confidence": 0})
            print(all_results)
            # Use the same attendance logic as the image endpoint
            # update_student_record(all_results)
            sorted_users = get_user(all_results)
            
            return jsonify({
                "status": "Complete",
                "total_faces_detected": len(all_persons),
                "data": sorted_users
            })
        else:
            return jsonify({"status": f"Job Failed: {response.get('StatusMessage', 'Unknown error')}"})
            
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app_views.route('/attendance', methods=["POST"], strict_slashes=False)
@swag_from(join(dirname(__file__), 'documentation/university/post_uni.yml'))

def post_attendance():
    """
       regester university for student
    """
    if not request.get_json():
        abort(400, description="Not a JSON")
    data = request.get_json()
    requiredField = ["session_id", "user_id", "lecturer_id", "status"]
    for i in requiredField:
        if i not in data:
            return make_response(jsonify({"error": f"Missing required field {i}"}), 404)
    
    

    instance = Attendance(**data)
    instance.save()
   

    return make_response(jsonify({"message":"attendance created"}), 201)


@app_views.route('/register-face', methods=["POST"], strict_slashes=False)
def register_face():
    # Receive a single image instead of a list
    file = request.files.get('image')
    user_id = request.form.get('user_id')

    if not file:
        return jsonify({"error": "No image provided"}), 400
    if not user_id:
        return jsonify({"error": "No user_id provided"}), 400

    try:
        # Index the single image
        # We use ExternalImageId to store the user identity directly on the face
        response = rekognition.index_faces(
            CollectionId='Student',
            Image={'Bytes': file.read()},
            ExternalImageId=user_id.strip(),
            MaxFaces=1,
            QualityFilter="AUTO"
        )

        if not response['FaceRecords']:
            return jsonify({"status": "failed", "message": "No face detected"}), 400

        face_id = response['FaceRecords'][0]['Face']['FaceId']

        return jsonify({
            "status": "success",
            "message": f"Face indexed for user: {user_id}",
            "face_id": face_id
        })

    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app_views.route('/register-faces', methods=["POST"],strict_slashes=False)
def register_faces():
    files = request.files.getlist('images')
    user_id = request.form.get('user_id')

    if not files:
        return jsonify({"error": "No images provided"}), 400
    if not user_id:
        return jsonify({"error": "No user_id provided"}), 400

    face_ids = []
    try:
        # 1. Create user in User API (optional but fine)
        try:
            rekognition.create_user(CollectionId='Student', UserId=user_id)
        except rekognition.exceptions.InvalidParameterException:
            pass  # User already exists

        # 2. Index images WITH ExternalImageId for video compatibility
        for file in files:
            response = rekognition.index_faces(
                CollectionId='Student',
                Image={'Bytes': file.read()},
                ExternalImageId=user_id,          # ✅ Critical addition
                MaxFaces=1,
                QualityFilter="AUTO"
            )
            if response['FaceRecords']:
                face_ids.append(response['FaceRecords'][0]['Face']['FaceId'])

        # 3. Associate faces with the User API user (still works)
        if face_ids:
            rekognition.associate_faces(
                CollectionId='Student',
                UserId=user_id,
                FaceIds=face_ids,
                UserMatchThreshold=70
            )

        return jsonify({
            "status": "success",
            "message": f"Associated {len(face_ids)} faces to User: {user_id}",
            "face_ids": face_ids
        })

    except Exception as e:
        return jsonify({"error": str(e)}), 500
@app_views.route('/verify-face', methods=["POST"], strict_slashes=False)
def verify_face():
    if 'image' not in request.files:
        return "No image uploaded", 400
    
    file = request.files['image']
    image_bytes = file.read()

    try:
        # Search the collection for a match
        response = rekognition.search_users_by_image(
            CollectionId='Student',
            Image={'Bytes': image_bytes},
            MaxUsers=1,
            UserMatchThreshold=95  # Strict threshold for security
        )

        matches = response.get('UserMatches', [])
        print(matches)
        if not matches:
            return jsonify({"status": "failed", "message": "No match found"}), 401

        # The result includes the ExternalImageId we set during registration
        user_id = matches[0]['User'].get('UserId')
        similarity = matches[0]['Similarity']

        return jsonify({
            "status": "success",
            "message": f"Welcome back, {user_id}!",
            "confidence": f"{similarity:.2f}%"
        })

    except Exception as e:
        return str(e), 400
    
    


@app_views.route('/verify-group', methods=['POST'])
def verify_group():
    file = request.files['image']
    image_bytes = file.read()
    
    # 1. Detect all faces in the image
    detection_response = rekognition.detect_faces(
        Image={'Bytes': image_bytes},
        Attributes=['DEFAULT']
    )

    all_results = []
    
    
    img = Image.open(io.BytesIO(image_bytes))
    width, height = img.size

    for faceDetail in detection_response['FaceDetails']:
        box = faceDetail['BoundingBox']
        left = width * box['Left']
        top = height * box['Top']
        right = left + (width * box['Width'])
        bottom = top + (height * box['Height'])

        face_crop = img.crop((left, top, right, bottom))
        
 
        stream = io.BytesIO()
        face_crop.save(stream, format="JPEG")
        crop_bytes = stream.getvalue()

        try:
            search_response = rekognition.search_users_by_image(
                CollectionId='Student',
                Image={'Bytes': crop_bytes},
                MaxUsers=1,
            #    UserMatchThreshold=95
        )
        except rekognition.exceptions.InvalidParameterException:
            
            print("No face detected in this specific crop. Skipping...")
            continue
        matches = search_response.get('UserMatches', [])

        if matches:
            all_results.append({
                "user_id":  matches[0]['User'].get('UserId')
            })
            
            
            
        else:
            all_results.append({"identity": "Unknown", "confidence": 0})
    print(all_results)
    update_student_record(all_results)
    sorted_users= get_user(all_results)
    return jsonify({"data": sorted_users})

@app_views.route('/export-attendance', methods=["POST"], strict_slashes=False)
def export_attendance():

    data = request.get_json()
    print(data)
    
    if not data:
        return jsonify({"error": "No data provided"}), 400


    return export_attendance_to_excel(data)



def get_user(user_dict):
    session = storage._DBStorage__session
    CURRENT_SESSION_ID = "afec07ad-1779-4f6a-9a19-92b6a6eb4e06"
    grouped_users = {}

    for user_entry in user_dict:
        user_id = user_entry.get("user_id")
        user_obj = storage.get_id(User, user_id)
        
        if not user_obj:
            continue 
            
        dept = user_obj.university.department.lower() if user_obj.university and user_obj.university.department else "unknown"


        att_record = session.query(Attendance).filter(
            Attendance.user_id == user_id, 
            Attendance.session_id == CURRENT_SESSION_ID
        ).first()

        student_info = {
            "name": user_obj.name,
            "matric": user_obj.matric,
            "days": att_record.days if att_record else 0,
            "percentage": att_record.percentage if att_record else "0.00%",
            "eligibility": att_record.eligibility if att_record else "Ineligible"
        }
        
        if dept not in grouped_users:
            grouped_users[dept] = []
        grouped_users[dept].append(student_info)
            
    return grouped_users



from flask import send_file
import io
import pandas as pd
from openpyxl.styles import Font
from datetime import datetime


def export_attendance_to_excel(grouped_users):
    output = io.BytesIO()
    
    # Check if grouped_users is empty to avoid the IndexError
    if not grouped_users:
        # Create a blank dataframe so the sheet exists
        grouped_users = {"Empty": []}

    with pd.ExcelWriter(output, engine='openpyxl') as writer:
        # We must write SOMETHING to the sheet first to initialize it
        pd.DataFrame().to_excel(writer, sheet_name='Attendance')
        
        workbook = writer.book
        worksheet = writer.sheets['Attendance']
        bold_font = Font(bold=True)

        # Re-add your header info logic here
        fixed_info = [
            ["LAGOS STATE UNIVERSITY OF SCIENCE AND TECHNOLOGY"],
            ["COURSE CODE: GET 201"],
            ["COURSE NAME: APPLIED ELECTRICITY"],
            ["SESSION: 2025/2026"],
            [f"DATE: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}"]
        ]
        for i, row_data in enumerate(fixed_info, 1):
            worksheet.cell(row=i, column=1, value=row_data[0]).font = bold_font

        start_row = 7 
        for dept, students in grouped_users.items():
            # Add Department Header
            dept_cell = worksheet.cell(row=start_row + 1, column=1)
            dept_cell.value = dept.upper()
            dept_cell.font = bold_font
            
            if students:
                df = pd.DataFrame(students)
                # Ensure columns match the keys in get_user's student_info dict
                df.columns = ["NAME", "MATRIC", "DAYS ATTENDED", "PERCENTAGE", "ELIGIBILITY"]
                df.index = df.index + 1
                
                # Write to Excel
                df.to_excel(writer, startrow=start_row + 1, sheet_name='Attendance')
                start_row += len(students) + 4
            else:
                worksheet.cell(row=start_row + 2, column=1, value="No students found")
                start_row += 4

    output.seek(0)
    return send_file(
        output, 
        as_attachment=True, 
        download_name=f"Attendance_Report_{datetime.now().strftime('%Y%m%d')}.xlsx",
        mimetype="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    )
    
    
    
def update_student_record(all_results, session_id=None, lecturer_id=None):
    session = storage._DBStorage__session
    REQUIRED_PERCENTAGE = 75
    
    # Use provided session_id or fall back to default
    active_session_id = session_id or "afec07ad-1779-4f6a-9a19-92b6a6eb4e06"
    
    # Get total lectures from the session object
    from models.session import Sessions
    session_obj = storage.get_id(Sessions, active_session_id)
    TOTAL_LECTURES = session_obj.total_expected_classes if session_obj else 13

    for user_entry in all_results:
        user_id = user_entry.get("user_id")
        if not user_id:
            continue

        # ── Create granular AttendanceLog entry ──
        from models.attendance_log import AttendanceLog
        from datetime import datetime
        log = AttendanceLog(
            session_id=active_session_id,
            user_id=user_id,
            recorded_by=lecturer_id,
            date=datetime.utcnow(),
            status='present'
        )
        log.save()

        # ── Update cached Attendance summary ──
        attendance = session.query(Attendance).filter(
            Attendance.user_id == user_id,
            Attendance.session_id == active_session_id
        ).first() 

        if not attendance:
            attendance = Attendance(
                user_id=user_id,
                session_id=active_session_id,
                days=1,
                lecturer_id=lecturer_id or "system",
                status='present'
            )
        else:
            attendance.days += 1
            attendance.status = 'present'

        calc_percentage = (attendance.days / TOTAL_LECTURES) * 100
        attendance.percentage = f"{calc_percentage:.2f}%"

        if calc_percentage >= REQUIRED_PERCENTAGE:
            attendance.eligibility = "Eligible"
        else:
            attendance.eligibility = "Ineligible"

        attendance.save()

        # ── Trigger notification if student is near 75% threshold ──
        _check_and_notify(user_id, active_session_id, calc_percentage, TOTAL_LECTURES, attendance.days)


def _check_and_notify(user_id, session_id, percentage, total_lectures, days_attended):
    """Send notification to student if their attendance drops into warning zones."""
    from models.notification import Notification
    from models.session import Sessions
    from models.course import Courses
    ses = storage._DBStorage__session

    session_obj = storage.get_id(Sessions, session_id)
    course = ses.query(Courses).filter_by(courseID=session_obj.courseID).first() if session_obj else None
    course_label = f"{course.courseName} ({session_obj.courseID})" if course and session_obj else "your course"

    remaining = total_lectures - days_attended
    
    # Warning zone: 76-80%
    if 76 <= percentage <= 80:
        title = f"⚠️ Attendance Warning — {course_label}"
        message = (
            f"Your attendance is at {percentage:.1f}%. "
            f"You have {remaining} classes left. "
            f"Missing more classes may make you ineligible for exams."
        )
        _create_notification_if_new(user_id, session_id, title, message, "warning")

    # Danger zone: below 75%
    elif percentage < 75:
        title = f"🚨 Attendance Critical — {course_label}"
        message = (
            f"Your attendance has dropped to {percentage:.1f}%, "
            f"below the 75% required for exam eligibility. "
            f"Please attend all remaining classes."
        )
        _create_notification_if_new(user_id, session_id, title, message, "danger")


def _create_notification_if_new(user_id, session_id, title, message, notif_type):
    """Create a notification only if a similar one hasn't been sent today."""
    from models.notification import Notification
    from datetime import datetime, timedelta
    ses = storage._DBStorage__session

    today_start = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
    existing = ses.query(Notification).filter(
        Notification.user_id == user_id,
        Notification.related_session_id == session_id,
        Notification.notification_type == notif_type,
        Notification.created_at >= today_start
    ).first()

    if not existing:
        notification = Notification(
            user_id=user_id,
            title=title,
            message=message,
            notification_type=notif_type,
            related_session_id=session_id,
        )
        notification.save()