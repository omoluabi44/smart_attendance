#!/usr/bin/python3
"""Lecturer API endpoints — session management, dashboard analytics, attendance history"""
from models.user import User
from models.course import Courses
from models.session import Sessions
from models.lecturer_session import LecturerSession
from models.session_enrollment import SessionEnrollment
from models.attendance import Attendance
from models.attendance_log import AttendanceLog
from models import storage
from api.v1.views import app_views
from flask import jsonify, make_response, request, send_file
from flask_jwt_extended import jwt_required, get_jwt_identity
from api.v1.utils.roles import role_required
from datetime import datetime
import io
import pandas as pd
from openpyxl.styles import Font


ses = storage._DBStorage__session


# ─── Course Creation (lecturer-only) ───────────────────────────────────────────

@app_views.route('/lecturer/course', methods=["POST"], strict_slashes=False)
@jwt_required()
@role_required('lecturer', 'admin')
def lecturer_create_course():
    """
    Create a new course. Lecturer must provide courseID, courseName.
    Optionally description.
    """
    data = request.get_json()
    if not data:
        return make_response(jsonify({"error": "Not a JSON"}), 400)

    for field in ["courseID", "courseName"]:
        if field not in data:
            return make_response(jsonify({"error": f"Missing required field: {field}"}), 400)

    # Check if course already exists
    existing = ses.query(Courses).filter_by(courseID=data["courseID"]).first()
    if existing:
        return make_response(jsonify({"error": "Course with this ID already exists"}), 409)

    course = Courses(**data)
    course.save()

    return make_response(jsonify({
        "message": "Course created successfully",
        "course": course.to_dict()
    }), 201)


# ─── Session Creation ──────────────────────────────────────────────────────────

@app_views.route('/lecturer/session', methods=["POST"], strict_slashes=False)
@jwt_required()
@role_required('lecturer', 'admin')
def lecturer_create_session():
    """
    Create a session (course + year). Auto-assigns the creating lecturer.
    Body: { "courseID": "PHY102", "session_name": "2025/2026", "total_expected_classes": 13 }
    """
    data = request.get_json()
    if not data:
        return make_response(jsonify({"error": "Not a JSON"}), 400)

    for field in ["courseID", "session_name", "total_expected_classes"]:
        if field not in data:
            return make_response(jsonify({"error": f"Missing required field: {field}"}), 400)

    # Verify course exists
    course = ses.query(Courses).filter_by(courseID=data["courseID"]).first()
    if not course:
        return make_response(jsonify({"error": "Course not found"}), 404)

    # Create the session
    session_data = {
        "courseID": data["courseID"],
        "session_name": data["session_name"],
        "total_expected_classes": int(data["total_expected_classes"])
    }
    new_session = Sessions(**session_data)
    new_session.save()

    # Auto-assign creating lecturer
    lecturer_id = get_jwt_identity()
    lecturer_link = LecturerSession(session_id=new_session.id, lecturer_id=lecturer_id)
    lecturer_link.save()

    return make_response(jsonify({
        "message": "Session created successfully",
        "session": new_session.to_dict()
    }), 201)


# ─── Co-Lecturer Management ───────────────────────────────────────────────────

@app_views.route('/lecturer/sessions/<session_id>/co-lecturers', methods=["POST"], strict_slashes=False)
@jwt_required()
@role_required('lecturer', 'admin')
def add_co_lecturer(session_id):
    """
    Add a co-lecturer to a session.
    Body: { "lecturer_id": "..." } or { "email": "..." }
    """
    current_user_id = get_jwt_identity()
    data = request.get_json()
    if not data:
        return make_response(jsonify({"error": "Not a JSON"}), 400)

    # Verify session exists and current user is a lecturer on it
    session_obj = storage.get_id(Sessions, session_id)
    if not session_obj:
        return make_response(jsonify({"error": "Session not found"}), 404)

    is_assigned = ses.query(LecturerSession).filter_by(
        session_id=session_id, lecturer_id=current_user_id
    ).first()
    if not is_assigned:
        return make_response(jsonify({"error": "You are not a lecturer on this session"}), 403)

    # Find lecturer by ID or email
    new_lecturer = None
    if "lecturer_id" in data:
        new_lecturer = storage.get_id(User, data["lecturer_id"])
    elif "email" in data:
        new_lecturer = storage.get_email(User, data["email"])

    if not new_lecturer:
        return make_response(jsonify({"error": "Lecturer not found"}), 404)
    if new_lecturer.role != 'lecturer' and new_lecturer.role != 'admin':
        return make_response(jsonify({"error": "User is not a lecturer"}), 400)

    # Check if already assigned
    already = ses.query(LecturerSession).filter_by(
        session_id=session_id, lecturer_id=new_lecturer.id
    ).first()
    if already:
        return make_response(jsonify({"error": "Lecturer already assigned to this session"}), 409)

    link = LecturerSession(session_id=session_id, lecturer_id=new_lecturer.id)
    link.save()

    return make_response(jsonify({
        "message": f"{new_lecturer.name} added as co-lecturer",
        "lecturer": {"id": new_lecturer.id, "name": new_lecturer.name, "email": new_lecturer.email}
    }), 201)


@app_views.route('/lecturer/sessions/<session_id>/co-lecturers', methods=["GET"], strict_slashes=False)
@jwt_required()
@role_required('lecturer', 'admin')
def list_co_lecturers(session_id):
    """List all lecturers assigned to a session."""
    session_obj = storage.get_id(Sessions, session_id)
    if not session_obj:
        return make_response(jsonify({"error": "Session not found"}), 404)

    lecturer_links = ses.query(LecturerSession).filter_by(session_id=session_id).all()
    lecturers = []
    for link in lecturer_links:
        user = storage.get_id(User, link.lecturer_id)
        if user:
            lecturers.append({"id": user.id, "name": user.name, "email": user.email})

    return make_response(jsonify({"data": lecturers}), 200)


# ─── Lecturer's Sessions List ─────────────────────────────────────────────────

@app_views.route('/lecturer/sessions', methods=["GET"], strict_slashes=False)
@jwt_required()
@role_required('lecturer', 'admin')
def lecturer_sessions():
    """Retrieve all sessions assigned to the current lecturer."""
    lecturer_id = get_jwt_identity()

    links = ses.query(LecturerSession).filter_by(lecturer_id=lecturer_id).all()
    sessions_list = []
    for link in links:
        session_obj = storage.get_id(Sessions, link.session_id)
        if not session_obj:
            continue

        enrolled_count = ses.query(SessionEnrollment).filter_by(session_id=session_obj.id).count()
        course = ses.query(Courses).filter_by(courseID=session_obj.courseID).first()

        sessions_list.append({
            "id": session_obj.id,
            "session_name": session_obj.session_name,
            "courseID": session_obj.courseID,
            "course_name": course.courseName if course else "N/A",
            "total_expected_classes": session_obj.total_expected_classes,
            "enrolled_students": enrolled_count,
            "created_at": session_obj.created_at.strftime("%Y-%m-%d %H:%M:%S") if session_obj.created_at else None,
        })

    return make_response(jsonify({"data": sessions_list}), 200)


# ─── Session Dashboard (Analytics) ────────────────────────────────────────────

@app_views.route('/lecturer/sessions/<session_id>/dashboard', methods=["GET"], strict_slashes=False)
@jwt_required()
@role_required('lecturer', 'admin')
def session_dashboard(session_id):
    """
    Returns aggregate analytics for a session:
    - Total enrolled, average attendance %, at-risk count, eligible count
    - Lists of at-risk and eligible students
    """
    session_obj = storage.get_id(Sessions, session_id)
    if not session_obj:
        return make_response(jsonify({"error": "Session not found"}), 404)

    total_classes = session_obj.total_expected_classes or 13
    REQUIRED_PERCENTAGE = 75

    # Get all enrolled students
    enrollments = ses.query(SessionEnrollment).filter_by(session_id=session_id).all()
    enrolled_user_ids = [e.user_id for e in enrollments]

    students_data = []
    total_percentage = 0
    at_risk = []
    eligible = []

    for user_id in enrolled_user_ids:
        user = storage.get_id(User, user_id)
        if not user:
            continue

        # Count attendance logs for this student in this session
        days_attended = ses.query(AttendanceLog).filter_by(
            session_id=session_id, user_id=user_id, status='present'
        ).count()
        excused = ses.query(AttendanceLog).filter_by(
            session_id=session_id, user_id=user_id, status='excused'
        ).count()

        effective_attended = days_attended + excused
        percentage = (effective_attended / total_classes) * 100 if total_classes > 0 else 0

        student_info = {
            "id": user.id,
            "name": user.name,
            "matric": user.matric,
            "days_attended": days_attended,
            "excused": excused,
            "percentage": round(percentage, 2),
            "eligible": percentage >= REQUIRED_PERCENTAGE
        }
        students_data.append(student_info)
        total_percentage += percentage

        if percentage >= REQUIRED_PERCENTAGE:
            eligible.append(student_info)
        elif percentage >= (REQUIRED_PERCENTAGE - 10):  # Within warning zone (65-74%)
            at_risk.append(student_info)
        else:
            at_risk.append(student_info)

    avg_attendance = round(total_percentage / len(enrolled_user_ids), 2) if enrolled_user_ids else 0

    # Get co-lecturers
    lecturer_links = ses.query(LecturerSession).filter_by(session_id=session_id).all()
    lecturers = []
    for link in lecturer_links:
        lec = storage.get_id(User, link.lecturer_id)
        if lec:
            lecturers.append({"id": lec.id, "name": lec.name})

    # Course info
    course = ses.query(Courses).filter_by(courseID=session_obj.courseID).first()

    return make_response(jsonify({
        "session": {
            "id": session_obj.id,
            "session_name": session_obj.session_name,
            "courseID": session_obj.courseID,
            "course_name": course.courseName if course else "N/A",
            "total_expected_classes": total_classes,
        },
        "stats": {
            "total_enrolled": len(enrolled_user_ids),
            "average_attendance": avg_attendance,
            "eligible_count": len(eligible),
            "at_risk_count": len(at_risk),
        },
        "lecturers": lecturers,
        "students": students_data,
        "at_risk_students": at_risk,
        "eligible_students": eligible,
    }), 200)


# ─── Attendance History ────────────────────────────────────────────────────────

@app_views.route('/lecturer/sessions/<session_id>/history', methods=["GET"], strict_slashes=False)
@jwt_required()
@role_required('lecturer', 'admin')
def session_attendance_history(session_id):
    """
    Returns all attendance log entries for a session, grouped by date.
    Each entry includes the student info and which lecturer recorded it.
    """
    session_obj = storage.get_id(Sessions, session_id)
    if not session_obj:
        return make_response(jsonify({"error": "Session not found"}), 404)

    logs = ses.query(AttendanceLog).filter_by(session_id=session_id).order_by(
        AttendanceLog.date.desc()
    ).all()

    # Group by date
    from collections import defaultdict
    grouped = defaultdict(list)
    for log in logs:
        date_key = log.date.strftime("%Y-%m-%d") if log.date else "Unknown"
        student = storage.get_id(User, log.user_id)
        lecturer = storage.get_id(User, log.recorded_by) if log.recorded_by else None

        grouped[date_key].append({
            "log_id": log.id,
            "student_name": student.name if student else "Unknown",
            "student_matric": student.matric if student else "N/A",
            "student_id": log.user_id,
            "status": log.status,
            "recorded_by": lecturer.name if lecturer else "System",
            "time": log.date.strftime("%H:%M:%S") if log.date else None,
        })

    history = []
    for date_str, entries in grouped.items():
        present_count = sum(1 for e in entries if e["status"] == "present")
        history.append({
            "date": date_str,
            "total_present": present_count,
            "total_records": len(entries),
            "entries": entries,
        })

    return make_response(jsonify({"data": history}), 200)


# ─── Manual Override ───────────────────────────────────────────────────────────

@app_views.route('/lecturer/sessions/<session_id>/attendance-log/<log_id>', methods=["PUT"], strict_slashes=False)
@jwt_required()
@role_required('lecturer', 'admin')
def manual_override(session_id, log_id):
    """
    Allow lecturer to manually change a student's attendance status.
    Body: { "status": "present" | "absent" | "excused" }
    """
    data = request.get_json()
    if not data or "status" not in data:
        return make_response(jsonify({"error": "Missing status field"}), 400)

    new_status = data["status"]
    if new_status not in ('present', 'absent', 'excused'):
        return make_response(jsonify({"error": "Invalid status. Must be present, absent, or excused"}), 400)

    log = storage.get_id(AttendanceLog, log_id)
    if not log or log.session_id != session_id:
        return make_response(jsonify({"error": "Attendance log not found"}), 404)

    old_status = log.status
    log.status = new_status
    log.save()

    # Recalculate summary
    _recalculate_attendance_summary(session_id, log.user_id)

    return make_response(jsonify({
        "message": f"Status changed from '{old_status}' to '{new_status}'",
        "log_id": log.id,
    }), 200)


# ─── Export Excel ──────────────────────────────────────────────────────────────

@app_views.route('/lecturer/sessions/<session_id>/export', methods=["GET"], strict_slashes=False)
@jwt_required()
@role_required('lecturer', 'admin')
def export_session_attendance(session_id):
    """Generate and download an Excel attendance report for a session."""
    session_obj = storage.get_id(Sessions, session_id)
    if not session_obj:
        return make_response(jsonify({"error": "Session not found"}), 404)

    course = ses.query(Courses).filter_by(courseID=session_obj.courseID).first()
    total_classes = session_obj.total_expected_classes or 13

    # Gather student data
    enrollments = ses.query(SessionEnrollment).filter_by(session_id=session_id).all()
    rows = []
    for enrollment in enrollments:
        user = storage.get_id(User, enrollment.user_id)
        if not user:
            continue

        days_attended = ses.query(AttendanceLog).filter_by(
            session_id=session_id, user_id=user.id, status='present'
        ).count()
        excused = ses.query(AttendanceLog).filter_by(
            session_id=session_id, user_id=user.id, status='excused'
        ).count()

        effective = days_attended + excused
        percentage = (effective / total_classes) * 100 if total_classes > 0 else 0

        rows.append({
            "NAME": user.name,
            "MATRIC": user.matric or "N/A",
            "DAYS ATTENDED": days_attended,
            "EXCUSED": excused,
            "PERCENTAGE": f"{percentage:.2f}%",
            "ELIGIBILITY": "Eligible" if percentage >= 75 else "Ineligible",
        })

    output = io.BytesIO()
    with pd.ExcelWriter(output, engine='openpyxl') as writer:
        pd.DataFrame().to_excel(writer, sheet_name='Attendance')
        workbook = writer.book
        worksheet = writer.sheets['Attendance']
        bold_font = Font(bold=True)

        header_info = [
            [f"COURSE: {course.courseName if course else 'N/A'} ({session_obj.courseID})"],
            [f"SESSION: {session_obj.session_name}"],
            [f"TOTAL EXPECTED CLASSES: {total_classes}"],
            [f"DATE EXPORTED: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}"],
        ]
        for i, row_data in enumerate(header_info, 1):
            worksheet.cell(row=i, column=1, value=row_data[0]).font = bold_font

        if rows:
            df = pd.DataFrame(rows)
            df.index = df.index + 1
            df.to_excel(writer, startrow=5, sheet_name='Attendance')

    output.seek(0)
    filename = f"Attendance_{session_obj.courseID}_{session_obj.session_name.replace('/', '-')}_{datetime.now().strftime('%Y%m%d')}.xlsx"
    return send_file(
        output,
        as_attachment=True,
        download_name=filename,
        mimetype="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    )


# ─── Update Session Settings ──────────────────────────────────────────────────

@app_views.route('/lecturer/sessions/<session_id>', methods=["PUT"], strict_slashes=False)
@jwt_required()
@role_required('lecturer', 'admin')
def update_session(session_id):
    """
    Update session settings (e.g., total_expected_classes).
    Body: { "total_expected_classes": 15, "session_name": "2025/2026" }
    """
    session_obj = storage.get_id(Sessions, session_id)
    if not session_obj:
        return make_response(jsonify({"error": "Session not found"}), 404)

    data = request.get_json()
    if not data:
        return make_response(jsonify({"error": "Not a JSON"}), 400)

    allowed_fields = ['total_expected_classes', 'session_name']
    for key, value in data.items():
        if key in allowed_fields:
            setattr(session_obj, key, value)

    session_obj.save()
    return make_response(jsonify({"message": "Session updated", "session": session_obj.to_dict()}), 200)


# ─── Helper: Recalculate Attendance Summary ───────────────────────────────────

def _recalculate_attendance_summary(session_id, user_id):
    """Recalculate the cached Attendance summary record from AttendanceLogs."""
    session_obj = storage.get_id(Sessions, session_id)
    total_classes = session_obj.total_expected_classes if session_obj else 13

    days_present = ses.query(AttendanceLog).filter_by(
        session_id=session_id, user_id=user_id, status='present'
    ).count()
    days_excused = ses.query(AttendanceLog).filter_by(
        session_id=session_id, user_id=user_id, status='excused'
    ).count()

    effective = days_present + days_excused
    percentage = (effective / total_classes) * 100 if total_classes > 0 else 0

    # Update or create summary
    attendance = ses.query(Attendance).filter_by(
        session_id=session_id, user_id=user_id
    ).first()

    if attendance:
        attendance.days = days_present
        attendance.percentage = f"{percentage:.2f}%"
        attendance.eligibility = "Eligible" if percentage >= 75 else "Ineligible"
        attendance.status = 'present' if days_present > 0 else 'absent'
        attendance.save()
