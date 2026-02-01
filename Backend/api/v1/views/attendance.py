#!/usr/bin/python3
""" objects that handle all default RestFul API actions for Users """
from models.university import University
from models.attendance import Attendance
from models import storage
import random
from models.user import User
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

@app_views.route('/register-faces', methods=["POST"], strict_slashes=False)
def register_faces():
    files = request.files.getlist('images')
    user_id = request.form.get('user_id') 

    if not files:
        return jsonify({"error": "No images provided"}), 400

    face_ids = []
    try:
      
        try:
            rekognition.create_user(CollectionId='Student', UserId=user_id)
        except rekognition.exceptions.InvalidParameterException as e:
            pass 

        # 2. Index all 5 images to get FaceIds
        for file in files:
            response = rekognition.index_faces(
                CollectionId='Student',
                Image={'Bytes': file.read()},
                MaxFaces=1,
                QualityFilter="AUTO"
            )
            if response['FaceRecords']:
                face_ids.append(response['FaceRecords'][0]['Face']['FaceId'])

        # 3. ASSOCIATE: This is the magic step
        if face_ids:
            rekognition.associate_faces(
                CollectionId='Student',
                UserId=user_id,
                FaceIds=face_ids,
                UserMatchThreshold=70 # Minimum confidence to link them
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
               UserMatchThreshold=95
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
    sorted_users= get_user(all_results)
    return jsonify({"data": sorted_users})

@app_views.route('/export-attendance', methods=["POST"], strict_slashes=False)
def export_attendance():

    data = request.get_json()
    
    if not data:
        return jsonify({"error": "No data provided"}), 400


    return export_attendance_to_excel(data)



def get_user(user_dict):

    grouped_users = {}

    for user_entry in user_dict:
        user_id = user_entry.get("user_id")
        user_obj = storage.get_id(User, user_id)
        if not user_obj:
            dept = "Unknown"
        if user_obj.university:
            dept = user_obj.university.department.lower()
        student_info = {
            "name": user_obj.name,
            "matric": user_obj.matric
        }
        if dept not in grouped_users:
            grouped_users[dept] = []
        grouped_users[dept].append(student_info)
    for dept, students in grouped_users.items():
        print(f"\n{dept.upper()}")
        for i, student in enumerate(students, 1):
            print(f"{i}. {student['name']}, {student['matric']}")
            
    return grouped_users



from flask import send_file
import io
import pandas as pd
from openpyxl.styles import Font
from datetime import datetime

def export_attendance_to_excel(grouped_users):
    # Create an in-memory byte stream
    output = io.BytesIO()
    
    # Use the buffer 'output' as the destination instead of a filename
    with pd.ExcelWriter(output, engine='openpyxl') as writer:
        fixed_info = [
            ["LAGOS STATE UNIVERSITY OF SCIENCE AND TECHNOLOGY"],
            ["COURSE CODE: GET 201"],
            ["COURSE NAME: APPLIED ELECTRICITY"],
            [f"SESSION: 2025/2026"],
            [f"DATE: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}"]
        ]
        
        header_df = pd.DataFrame(fixed_info)
        header_df.to_excel(writer, index=False, header=False, sheet_name='Attendance')
        
        workbook = writer.book
        worksheet = writer.sheets['Attendance']
        bold_font = Font(bold=True)

        for row in range(1, 6):
            cell = worksheet.cell(row=row, column=1)
            cell.font = bold_font

        start_row = 7 
        for dept, students in grouped_users.items():
            dept_cell = worksheet.cell(row=start_row + 1, column=1)
            dept_cell.value = dept.upper()
            dept_cell.font = bold_font
            
            df = pd.DataFrame(students)
            df.columns = [col.upper() for col in df.columns]
            df.index = df.index + 1
            df.to_excel(writer, startrow=start_row + 1, sheet_name='Attendance')
            start_row += len(students) + 4

    # Seek to the start of the stream so Flask can read it
    output.seek(0)
    
    # Return the file as a downloadable attachment
    return send_file(
        output,
        as_attachment=True,
        download_name=f"Attendance_GET201_{datetime.now().strftime('%Y%m%d')}.xlsx",
        mimetype="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    )