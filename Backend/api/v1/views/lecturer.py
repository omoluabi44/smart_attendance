#!/usr/bin/python3
"""Lecturer API endpoints — session management, dashboard analytics, attendance history"""
from models.user import User
from models.university import University
from models.course import Courses
from models.session import Sessions
from models.lecturer_session import LecturerSession
from models.session_enrollment import SessionEnrollment
from models.attendance import Attendance
from models.attendance_log import AttendanceLog
from models.notification import Notification
from models import storage
from api.v1.views import app_views
from flask import jsonify, make_response, request, send_file
from flask_jwt_extended import jwt_required, get_jwt_identity
from api.v1.utils.roles import role_required
from api.v1.utils.webhook_dispatcher import (
    fetch_coursepass_api,
    dispatch_course_config_webhook,
    dispatch_lecture_notification_webhook,
)
from api.v1.views.integrations import sync_session_enrollments_from_coursepass
from datetime import datetime
import uuid
import re
import io
import pandas as pd
from openpyxl.styles import Font


ses = storage._DBStorage__session

VALID_DAYS_OF_WEEK = [
    "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"
]
_DAY_LOOKUP = {d.lower(): d for d in VALID_DAYS_OF_WEEK}
_TIME_REGEX = re.compile(r"^([01]\d|2[0-3]):([0-5]\d)$")


def _normalize_timetable_slots(raw_slots):
    """
    Validate and normalize a list of weekly lecture timetable slots.
    Each slot contains:
      - id: string identifier
      - day: Monday..Sunday
      - start_time: HH:MM (24-hour)
      - end_time: optional HH:MM (24-hour)
      - venue: optional string
      - reminders: ['2h', '1h', '30m']
    """
    if raw_slots is None:
        return []
    if not isinstance(raw_slots, list):
        raise ValueError("`timetable` must be a list of weekly lecture slots.")

    normalized = []
    for idx, item in enumerate(raw_slots):
        if not isinstance(item, dict):
            raise ValueError(f"Timetable slot #{idx + 1} must be an object.")
        raw_day = str(item.get("day", "")).strip().lower()
        day = _DAY_LOOKUP.get(raw_day)
        if not day:
            raise ValueError(f"Slot #{idx + 1}: Invalid day '{item.get('day')}'. Must be Monday-Sunday.")

        start_time = str(item.get("start_time") or item.get("time") or "").strip()
        if not _TIME_REGEX.match(start_time):
            raise ValueError(f"Slot #{idx + 1}: Invalid start_time '{start_time}'. Use HH:MM (24h format, e.g. 09:00 or 14:30).")

        end_time = str(item.get("end_time") or "").strip()
        if end_time and not _TIME_REGEX.match(end_time):
            raise ValueError(f"Slot #{idx + 1}: Invalid end_time '{end_time}'. Use HH:MM (24h format).")

        venue = str(item.get("venue") or "").strip()[:160]
        slot_id = str(item.get("id") or f"slot-{idx + 1}-{uuid.uuid4().hex[:6]}")

        normalized.append({
            "id": slot_id,
            "day": day,
            "start_time": start_time,
            "end_time": end_time or None,
            "venue": venue or None,
            "reminders": ["2h", "1h", "30m"],
        })

    day_order = {d: i for i, d in enumerate(VALID_DAYS_OF_WEEK)}
    normalized.sort(key=lambda s: (day_order.get(s["day"], 99), s["start_time"]))
    return normalized


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



# ─── Lecturer's Courses List ──────────────────────────────────────────────────

@app_views.route('/lecturer/courses', methods=["GET"], strict_slashes=False)
@jwt_required()
@role_required('lecturer', 'admin')
def lecturer_courses():
    """Return all courses available for session creation (fetched from CoursePass API + local catalog)."""
    q = request.args.get('q', '').strip()
    courses_by_code = {}

    # 1. Fetch from CoursePass Central Hub API
    if q:
        remote_courses = fetch_coursepass_api('/api/v1/courses/search', params={'q': q})
    else:
        remote_courses = fetch_coursepass_api('/api/v1/courses', params={'per_page': 2000})

    if isinstance(remote_courses, list):
        for rc in remote_courses:
            code = rc.get("courseID")
            if code:
                courses_by_code[code] = {
                    "id": rc.get("id", code),
                    "courseID": code,
                    "courseName": rc.get("courseName", code),
                    "description": rc.get("description") or "Synced from CoursePass catalog",
                }

    # 2. Merge local courses
    local_courses = ses.query(Courses).order_by(Courses.courseID).all()
    for c in local_courses:
        if c.courseID not in courses_by_code:
            courses_by_code[c.courseID] = {
                "id": c.id,
                "courseID": c.courseID,
                "courseName": c.courseName,
                "description": c.description,
            }

    courses_list = sorted(courses_by_code.values(), key=lambda x: x["courseID"])
    return make_response(jsonify({"data": courses_list}), 200)


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

    target_code = str(data["courseID"]).strip()

    # Verify course exists locally; if not, sync from CoursePass central hub or request payload
    course = ses.query(Courses).filter_by(courseID=target_code).first()
    if not course:
        resolved_name = (data.get("courseName") or "").strip()
        resolved_desc = (data.get("description") or "").strip()

        if not resolved_name:
            catalog = fetch_coursepass_api('/api/v1/courses', params={'per_page': 2000})
            if isinstance(catalog, list):
                matched = next((rc for rc in catalog if rc.get("courseID") == target_code), None)
                if matched:
                    resolved_name = (matched.get("courseName") or target_code).strip()
                    resolved_desc = (matched.get("description") or "Synced from CoursePass").strip()

        if not resolved_name:
            remote_course = fetch_coursepass_api(f'/api/v1/courses/{target_code}')
            if isinstance(remote_course, dict) and remote_course.get("courseID"):
                resolved_name = (remote_course.get("courseName") or target_code).strip()
                resolved_desc = (remote_course.get("description") or "Synced from CoursePass").strip()

        if not resolved_name:
            resolved_name = target_code

        course = Courses(
            courseID=target_code[:120],
            courseName=resolved_name[:120],
            description=(resolved_desc or "Synced from CoursePass")[:500]
        )
        course.save()

    # Optional initial timetable slots
    normalized_timetable = []
    if "timetable" in data and data["timetable"] is not None:
        try:
            normalized_timetable = _normalize_timetable_slots(data["timetable"])
        except ValueError as err:
            return make_response(jsonify({"error": str(err)}), 400)

    # Create the session
    session_data = {
        "courseID": data["courseID"],
        "session_name": data["session_name"],
        "total_expected_classes": int(data["total_expected_classes"]),
        "timetable": normalized_timetable,
    }
    new_session = Sessions(**session_data)
    new_session.save()

    # Auto-assign creating lecturer
    lecturer_id = get_jwt_identity()
    lecturer_link = LecturerSession(session_id=new_session.id, lecturer_id=lecturer_id)
    lecturer_link.save()

    # Sync course configuration with CoursePass
    dispatch_course_config_webhook(
        course.courseID,
        int(data["total_expected_classes"]),
        data["session_name"],
        normalized_timetable,
    )
    try:
        sync_session_enrollments_from_coursepass(new_session)
    except Exception:
        pass

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
    current_user = storage.get_id(User, current_user_id)
    data = request.get_json()
    if not data:
        return make_response(jsonify({"error": "Not a JSON"}), 400)

    # Verify session exists and current user is a lecturer on it (or admin)
    session_obj = storage.get_id(Sessions, session_id)
    if not session_obj:
        return make_response(jsonify({"error": "Session not found"}), 404)

    is_assigned = ses.query(LecturerSession).filter_by(
        session_id=session_id, lecturer_id=current_user_id
    ).first()
    if not is_assigned and (not current_user or current_user.role != 'admin'):
        return make_response(jsonify({"error": "You are not a lecturer on this session"}), 403)

    # Find lecturer by ID or email
    new_lecturer = None
    if "lecturer_id" in data:
        new_lecturer = storage.get_id(User, data["lecturer_id"])
    elif "email" in data:
        new_lecturer = storage.get_email(User, data["email"])

    if not new_lecturer:
        return make_response(jsonify({"error": "Lecturer not found"}), 404)
    if new_lecturer.role not in ('lecturer', 'admin'):
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

        try:
            sync_session_enrollments_from_coursepass(session_obj)
        except Exception:
            pass

        enrolled_count = ses.query(SessionEnrollment).filter_by(session_id=session_obj.id).count()
        course = ses.query(Courses).filter_by(courseID=session_obj.courseID).first()

        sessions_list.append({
            "id": session_obj.id,
            "session_name": session_obj.session_name,
            "courseID": session_obj.courseID,
            "course_name": course.courseName if course else "N/A",
            "total_expected_classes": session_obj.total_expected_classes,
            "timetable": session_obj.timetable or [],
            "enrolled_students": enrolled_count,
            "created_at": session_obj.created_at.strftime("%Y-%m-%d %H:%M:%S") if session_obj.created_at else None,
        })

    return make_response(jsonify({"data": sessions_list}), 200)


# ─── Session Dashboard (Analytics) ────────────────────────────────────────────

@app_views.route('/lecturer/sessions/<session_id>', methods=["GET"], strict_slashes=False)
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

    try:
        sync_session_enrollments_from_coursepass(session_obj)
    except Exception:
        pass

    total_classes = session_obj.total_expected_classes or 13
    REQUIRED_PERCENTAGE = 75

    # Get all enrolled students
    enrollments = ses.query(SessionEnrollment).filter_by(session_id=session_id).all()
    enrolled_user_ids = set(e.user_id for e in enrollments)

    # Also include students who have attendance logs (recognized via face but not enrolled)
    attendance_logs_users = ses.query(AttendanceLog.user_id).filter_by(
        session_id=session_id
    ).distinct().all()
    logged_user_ids = set(uid for (uid,) in attendance_logs_users)

    # Merge both sets
    all_user_ids = enrolled_user_ids | logged_user_ids

    students_data = []
    total_percentage = 0
    at_risk = []
    eligible = []

    for user_id in all_user_ids:
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
        days_missed = total_classes - effective_attended
        if days_missed < 0:
            days_missed = 0
        percentage = (effective_attended / total_classes) * 100 if total_classes > 0 else 0

        # Get department & level from university profile
        department = "N/A"
        level = None
        if user.university:
            if user.university.department:
                department = user.university.department
            if user.university.level:
                level = user.university.level

        pct_rounded = round(percentage, 2)
        is_eligible = percentage >= REQUIRED_PERCENTAGE
        student_info = {
            "id": user.id,
            "name": user.name,
            "email": user.email,
            "matric": user.matric,
            "department": department,
            "level": level,
            "days_attended": days_attended,
            "attended_classes": days_attended,
            "days_missed": days_missed,
            "excused": excused,
            "excused_classes": excused,
            "total_expected_classes": total_classes,
            "percentage": pct_rounded,
            "attendance_percentage": pct_rounded,
            "eligible": is_eligible,
            "eligible_75": is_eligible,
        }
        students_data.append(student_info)
        total_percentage += percentage

        if percentage >= REQUIRED_PERCENTAGE:
            eligible.append(student_info)
        elif percentage >= (REQUIRED_PERCENTAGE - 10):  # Within warning zone (65-74%)
            at_risk.append(student_info)
        else:
            at_risk.append(student_info)

    # Sort students by department for the roster view
    students_data.sort(key=lambda x: (x.get('department', 'ZZZ'), x.get('name', '')))

    avg_attendance = round(total_percentage / len(all_user_ids), 2) if all_user_ids else 0

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
            "timetable": session_obj.timetable or [],
        },
        "stats": {
            "total_enrolled": len(all_user_ids),
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


@app_views.route('/lecturer/sessions/<session_id>/export-date/<date_str>', methods=["GET"], strict_slashes=False)
@jwt_required()
@role_required('lecturer', 'admin')
def export_date_attendance(session_id, date_str):
    """Export attendance records for a specific date as Excel."""
    session_obj = storage.get_id(Sessions, session_id)
    if not session_obj:
        return make_response(jsonify({"error": "Session not found"}), 404)

    course = ses.query(Courses).filter_by(courseID=session_obj.courseID).first()

    try:
        target_date = datetime.strptime(date_str, '%Y-%m-%d')
    except ValueError:
        return make_response(jsonify({"error": "Invalid date format. Use YYYY-MM-DD"}), 400)

    # Get logs for the specific date
    day_start = target_date.replace(hour=0, minute=0, second=0, microsecond=0)
    day_end = target_date.replace(hour=23, minute=59, second=59, microsecond=999999)

    logs = ses.query(AttendanceLog).filter(
        AttendanceLog.session_id == session_id,
        AttendanceLog.date >= day_start,
        AttendanceLog.date <= day_end
    ).order_by(AttendanceLog.date).all()

    rows = []
    for log in logs:
        user = storage.get_id(User, log.user_id)
        if not user:
            continue
        department = "N/A"
        level_str = "N/A"
        if user.university:
            if user.university.department:
                department = user.university.department
            if user.university.level:
                level_str = f"{user.university.level}L"
        lecturer = storage.get_id(User, log.recorded_by) if log.recorded_by else None
        rows.append({
            "NAME": user.name,
            "MATRIC": user.matric or "N/A",
            "DEPARTMENT": department,
            "LEVEL": level_str,
            "STATUS": log.status.upper(),
            "TIME": log.date.strftime("%H:%M:%S") if log.date else "N/A",
            "RECORDED BY": lecturer.name if lecturer else "System",
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
            [f"DATE: {date_str}"],
            [f"TOTAL PRESENT: {sum(1 for r in rows if r['STATUS'] == 'PRESENT')}"],
        ]
        for i, row_data in enumerate(header_info, 1):
            worksheet.cell(row=i, column=1, value=row_data[0]).font = bold_font

        if rows:
            df = pd.DataFrame(rows)
            df.index = df.index + 1
            df.to_excel(writer, startrow=5, sheet_name='Attendance')

    output.seek(0)
    filename = f"Attendance_{session_obj.courseID}_{date_str}.xlsx"
    return send_file(
        output,
        as_attachment=True,
        download_name=filename,
        mimetype="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    )


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
    from api.v1.views.attendance import _recalculate_attendance_summary
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

        department = "N/A"
        level_str = "N/A"
        if user.university:
            if user.university.department:
                department = user.university.department
            if user.university.level:
                level_str = f"{user.university.level}L"

        rows.append({
            "NAME": user.name,
            "MATRIC": user.matric or "N/A",
            "DEPARTMENT": department,
            "LEVEL": level_str,
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

    if 'timetable' in data:
        try:
            session_obj.timetable = _normalize_timetable_slots(data['timetable'])
        except ValueError as err:
            return make_response(jsonify({"error": str(err)}), 400)

    session_obj.save()
    dispatch_course_config_webhook(
        session_obj.courseID,
        int(session_obj.total_expected_classes or 13),
        session_obj.session_name,
        session_obj.timetable or [],
    )
    return make_response(jsonify({"message": "Session updated", "session": session_obj.to_dict()}), 200)


# ─── Course Timetable & Lecture Update Push Notifications ─────────────────────

@app_views.route('/lecturer/sessions/<session_id>/timetable', methods=["GET", "PUT", "POST"], strict_slashes=False)
@jwt_required()
@role_required('lecturer', 'admin')
def session_timetable(session_id):
    """
    GET: Return the configured weekly lecture timetable for this session.
    PUT/POST: Configure the weekly lecture timetable (supports 1, 2, or more weekly slots).
    Body:
      {
        "timetable": [
          { "day": "Monday", "start_time": "09:00", "end_time": "11:00", "venue": "LT 1" },
          { "day": "Thursday", "start_time": "14:00", "end_time": "16:00", "venue": "Room 204" }
        ],
        "notify_students": true
      }
    """
    session_obj = storage.get_id(Sessions, session_id)
    if not session_obj:
        return make_response(jsonify({"error": "Session not found"}), 404)

    course = ses.query(Courses).filter_by(courseID=session_obj.courseID).first()
    course_name = course.courseName if course else session_obj.courseID

    if request.method == "GET":
        return make_response(jsonify({
            "session_id": session_obj.id,
            "courseID": session_obj.courseID,
            "course_name": course_name,
            "timetable": session_obj.timetable or [],
            "auto_reminders": ["2 hours before", "1 hour before", "30 minutes before"],
        }), 200)

    data = request.get_json()
    if not data:
        return make_response(jsonify({"error": "Not a JSON"}), 400)

    raw_slots = data.get("timetable") if "timetable" in data else data.get("slots", [])
    try:
        normalized_slots = _normalize_timetable_slots(raw_slots)
    except ValueError as err:
        return make_response(jsonify({"error": str(err)}), 400)

    session_obj.timetable = normalized_slots
    session_obj.save()

    # Sync timetable to CoursePass
    dispatch_course_config_webhook(
        session_obj.courseID,
        int(session_obj.total_expected_classes or 13),
        session_obj.session_name,
        normalized_slots,
    )

    notify_flag = data.get("notify_students", data.get("notify_mobile", True))
    notify_students = bool(notify_flag)
    if notify_students and normalized_slots:
        try:
            sync_session_enrollments_from_coursepass(session_obj)
        except Exception:
            pass
        enrollments = ses.query(SessionEnrollment).filter_by(session_id=session_id).all()
        enrolled_student_ids = [str(e.user_id) for e in enrollments if e.user_id]

        lecturer_id = get_jwt_identity()
        lecturer = storage.get_id(User, lecturer_id)
        lecturer_name = lecturer.name if lecturer else "Course Lecturer"
        schedule_summary = ", ".join(
            f"{s['day']} at {s['start_time']}" + (f" ({s['venue']})" if s.get("venue") else "")
            for s in normalized_slots
        )
        title = f"📅 {session_obj.courseID} Timetable Updated"
        msg = f"{course_name} ({session_obj.courseID}) weekly lecture schedule: {schedule_summary}. Automatic reminders will be sent 2hrs, 1hr, and 30mins before class."
        for enrollment in enrollments:
            notif = Notification(
                user_id=enrollment.user_id,
                title=title[:255],
                message=msg,
                notification_type="timetable_update",
                related_session_id=session_id,
            )
            notif.save()

        dispatch_lecture_notification_webhook(
            course_id=session_obj.courseID,
            session_id=session_obj.id,
            title=title,
            message=msg,
            notification_type="timetable_update",
            lecturer_name=lecturer_name,
            course_name=course_name,
            enrolled_student_ids=enrolled_student_ids,
        )

    return make_response(jsonify({
        "message": "Course timetable saved and synced to mobile users.",
        "session_id": session_obj.id,
        "courseID": session_obj.courseID,
        "timetable": normalized_slots,
        "auto_reminders": ["2h", "1h", "30m"],
    }), 200)


@app_views.route('/lecturer/sessions/<session_id>/notify', methods=["POST"], strict_slashes=False)
@jwt_required()
@role_required('lecturer', 'admin')
def push_lecture_update_notification(session_id):
    """
    Allow lecturer to push an immediate notification about a lecture update
    (e.g., venue change, time reschedule, class starting now, cancellation, or custom notice)
    to all enrolled mobile users on CoursePass & FacePass.
    Body:
      {
        "title": "Lecture Venue Changed",
        "message": "Today's CSC301 lecture has been moved to ETF Hall at 10:00 AM.",
        "update_type": "lecture_update" | "venue_change" | "rescheduled" | "cancelled" | "starting_soon",
        "slot": { "day": "Monday", "start_time": "10:00", "venue": "ETF Hall" }
      }
    """
    session_obj = storage.get_id(Sessions, session_id)
    if not session_obj:
        return make_response(jsonify({"error": "Session not found"}), 404)

    data = request.get_json()
    if not data:
        return make_response(jsonify({"error": "Not a JSON"}), 400)

    message = str(data.get("message") or "").strip()
    if not message:
        return make_response(jsonify({"error": "Notification message is required"}), 400)

    course = ses.query(Courses).filter_by(courseID=session_obj.courseID).first()
    course_name = course.courseName if course else session_obj.courseID
    lecturer_id = get_jwt_identity()
    lecturer = storage.get_id(User, lecturer_id)
    lecturer_name = lecturer.name if lecturer else "Course Lecturer"

    update_type = str(data.get("update_type") or "lecture_update").strip()
    default_title = f"📢 {session_obj.courseID} Lecture Update"
    title = str(data.get("title") or default_title).strip()
    slot = data.get("slot") if isinstance(data.get("slot"), dict) else {}

    # Reconcile latest enrollments from CoursePass before dispatching notifications
    try:
        sync_session_enrollments_from_coursepass(session_obj)
    except Exception:
        pass

    # Create local in-app notifications for enrolled students on FacePass
    enrollments = ses.query(SessionEnrollment).filter_by(session_id=session_id).all()
    enrolled_student_ids = [str(e.user_id) for e in enrollments if e.user_id]
    for enrollment in enrollments:
        notif = Notification(
            user_id=enrollment.user_id,
            title=title[:255],
            message=message,
            notification_type="lecture_update",
            related_session_id=session_id,
        )
        notif.save()

    # Dispatch push notification webhook to CoursePass enrolled mobile users
    dispatch_lecture_notification_webhook(
        course_id=session_obj.courseID,
        session_id=session_obj.id,
        title=title,
        message=message,
        notification_type=update_type,
        slot=slot,
        lecturer_name=lecturer_name,
        course_name=course_name,
        enrolled_student_ids=enrolled_student_ids,
    )

    return make_response(jsonify({
        "message": "Lecture update push notification sent to mobile users.",
        "courseID": session_obj.courseID,
        "title": title,
        "body": message,
        "update_type": update_type,
        "recipients_local": len(enrollments),
    }), 200)


# _recalculate_attendance_summary is imported from attendance.py

import csv
from io import StringIO
from models.course_material import CourseMaterial
from models.quiz import Quiz, QuizResult

@app_views.route('/lecturer/sessions/<session_id>/export-csv', methods=['GET'], strict_slashes=False)
@jwt_required()
def export_csv(session_id):
    session_obj = storage.get_id(Sessions, session_id)
    if not session_obj:
        return make_response(jsonify({"error": "Session not found"}), 404)

    try:
        sync_session_enrollments_from_coursepass(session_obj)
    except Exception:
        pass

    total_classes = session_obj.total_expected_classes or 13
    enrollments = ses.query(SessionEnrollment).filter_by(session_id=session_id).all()
    enrolled_ids = set(e.user_id for e in enrollments)
    logged_ids = set(
        uid for (uid,) in ses.query(AttendanceLog.user_id).filter_by(session_id=session_id).distinct().all()
    )

    si = StringIO()
    cw = csv.writer(si)
    cw.writerow(['Matric', 'Name', 'Department', 'Level', 'Total Classes', 'Attended', 'Excused', 'Missed', 'Percentage', 'Eligibility'])
    for uid in (enrolled_ids | logged_ids):
        user = storage.get_id(User, uid)
        if not user:
            continue
        days_attended = ses.query(AttendanceLog).filter_by(
            session_id=session_id, user_id=uid, status='present'
        ).count()
        excused = ses.query(AttendanceLog).filter_by(
            session_id=session_id, user_id=uid, status='excused'
        ).count()
        effective = days_attended + excused
        missed = max(0, total_classes - effective)
        pct = round((effective / total_classes) * 100, 2) if total_classes > 0 else 0
        dept = user.university.department if (user.university and user.university.department) else "N/A"
        lvl = f"{user.university.level}L" if (user.university and user.university.level) else "N/A"
        cw.writerow([
            user.matric or 'N/A',
            user.name or 'Student',
            dept,
            lvl,
            total_classes,
            days_attended,
            excused,
            missed,
            f"{pct}%",
            'Eligible' if pct >= 75 else 'Ineligible',
        ])

    output = make_response(si.getvalue())
    output.headers["Content-Disposition"] = f"attachment; filename=Attendance_{session_obj.courseID}.csv"
    output.headers["Content-type"] = "text/csv"
    return output

@app_views.route('/lecturer/sessions/<session_id>/student-audit/<student_id>', methods=['GET'], strict_slashes=False)
@jwt_required()
def student_audit(session_id, student_id):
    # Fetch chronological history and quiz results for a specific student...
    return jsonify({"student_id": student_id, "history": [], "quizzes": []}), 200
