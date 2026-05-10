#!/usr/bin/python3
"""Student API endpoints — enrollment, attendance history, notifications"""
from models.user import User
from models.session import Sessions
from models.course import Courses
from models.session_enrollment import SessionEnrollment
from models.attendance_log import AttendanceLog
from models.notification import Notification
from models import storage
from api.v1.views import app_views
from flask import jsonify, make_response, request
from flask_jwt_extended import jwt_required, get_jwt_identity


ses = storage._DBStorage__session


# ─── Session Enrollment ───────────────────────────────────────────────────────

@app_views.route('/student/enroll', methods=["POST"], strict_slashes=False)
@jwt_required()
def student_enroll():
    """
    Enroll the current student in a session.
    Body: { "session_id": "..." }
    """
    user_id = get_jwt_identity()
    user = storage.get_id(User, user_id)
    if not user:
        return make_response(jsonify({"error": "User not found"}), 404)

    data = request.get_json()
    if not data or "session_id" not in data:
        return make_response(jsonify({"error": "Missing session_id"}), 400)

    session_id = data["session_id"]

    # Verify session exists
    session_obj = storage.get_id(Sessions, session_id)
    if not session_obj:
        return make_response(jsonify({"error": "Session not found"}), 404)

    # Check if already enrolled
    existing = ses.query(SessionEnrollment).filter_by(
        session_id=session_id, user_id=user_id
    ).first()
    if existing:
        return make_response(jsonify({"error": "Already enrolled in this session"}), 409)

    enrollment = SessionEnrollment(session_id=session_id, user_id=user_id)
    enrollment.save()

    course = ses.query(Courses).filter_by(courseID=session_obj.courseID).first()

    return make_response(jsonify({
        "message": "Enrolled successfully",
        "session": {
            "id": session_obj.id,
            "session_name": session_obj.session_name,
            "courseID": session_obj.courseID,
            "course_name": course.courseName if course else "N/A",
        }
    }), 201)


# ─── Student's Enrolled Sessions ──────────────────────────────────────────────

@app_views.route('/student/sessions', methods=["GET"], strict_slashes=False)
@jwt_required()
def student_sessions():
    """
    List all sessions the student is enrolled in, along with current
    attendance percentage and eligibility status.
    """
    user_id = get_jwt_identity()

    enrollments = ses.query(SessionEnrollment).filter_by(user_id=user_id).all()
    sessions_list = []

    for enrollment in enrollments:
        session_obj = storage.get_id(Sessions, enrollment.session_id)
        if not session_obj:
            continue

        total_classes = session_obj.total_expected_classes or 13
        course = ses.query(Courses).filter_by(courseID=session_obj.courseID).first()

        # Count attendance
        days_present = ses.query(AttendanceLog).filter_by(
            session_id=session_obj.id, user_id=user_id, status='present'
        ).count()
        days_excused = ses.query(AttendanceLog).filter_by(
            session_id=session_obj.id, user_id=user_id, status='excused'
        ).count()
        days_absent = ses.query(AttendanceLog).filter_by(
            session_id=session_obj.id, user_id=user_id, status='absent'
        ).count()

        effective = days_present + days_excused
        percentage = (effective / total_classes) * 100 if total_classes > 0 else 0

        # Determine warning level
        warning = None
        if percentage < 75:
            warning = "danger"  # Already below threshold
        elif percentage < 80:
            warning = "warning"  # Dangerously close

        # Get lecturers
        from models.lecturer_session import LecturerSession
        lecturer_links = ses.query(LecturerSession).filter_by(session_id=session_obj.id).all()
        lecturers = []
        for link in lecturer_links:
            lec = storage.get_id(User, link.lecturer_id)
            if lec:
                lecturers.append({"name": lec.name})

        sessions_list.append({
            "id": session_obj.id,
            "session_name": session_obj.session_name,
            "courseID": session_obj.courseID,
            "course_name": course.courseName if course else "N/A",
            "total_expected_classes": total_classes,
            "days_present": days_present,
            "days_excused": days_excused,
            "days_absent": days_absent,
            "percentage": round(percentage, 2),
            "eligible": percentage >= 75,
            "warning": warning,
            "lecturers": lecturers,
            "enrolled_at": enrollment.enrolled_at.strftime("%Y-%m-%d") if enrollment.enrolled_at else None,
        })

    return make_response(jsonify({"data": sessions_list}), 200)


# ─── Student Attendance History for a Session ─────────────────────────────────

@app_views.route('/student/sessions/<session_id>/attendance', methods=["GET"], strict_slashes=False)
@jwt_required()
def student_attendance_detail(session_id):
    """
    Get detailed attendance history for the student in a specific session.
    Includes date, status, and the name of the lecturer who recorded each class.
    """
    user_id = get_jwt_identity()

    # Verify enrollment
    enrollment = ses.query(SessionEnrollment).filter_by(
        session_id=session_id, user_id=user_id
    ).first()
    if not enrollment:
        return make_response(jsonify({"error": "You are not enrolled in this session"}), 403)

    session_obj = storage.get_id(Sessions, session_id)
    if not session_obj:
        return make_response(jsonify({"error": "Session not found"}), 404)

    total_classes = session_obj.total_expected_classes or 13
    course = ses.query(Courses).filter_by(courseID=session_obj.courseID).first()

    logs = ses.query(AttendanceLog).filter_by(
        session_id=session_id, user_id=user_id
    ).order_by(AttendanceLog.date.desc()).all()

    history = []
    for log in logs:
        lecturer = storage.get_id(User, log.recorded_by) if log.recorded_by else None
        history.append({
            "log_id": log.id,
            "date": log.date.strftime("%Y-%m-%d") if log.date else None,
            "time": log.date.strftime("%H:%M:%S") if log.date else None,
            "status": log.status,
            "recorded_by": lecturer.name if lecturer else "System",
        })

    days_present = sum(1 for l in logs if l.status == 'present')
    days_excused = sum(1 for l in logs if l.status == 'excused')
    effective = days_present + days_excused
    percentage = (effective / total_classes) * 100 if total_classes > 0 else 0

    return make_response(jsonify({
        "session": {
            "id": session_obj.id,
            "session_name": session_obj.session_name,
            "courseID": session_obj.courseID,
            "course_name": course.courseName if course else "N/A",
            "total_expected_classes": total_classes,
        },
        "summary": {
            "days_present": days_present,
            "days_excused": days_excused,
            "days_absent": sum(1 for l in logs if l.status == 'absent'),
            "percentage": round(percentage, 2),
            "eligible": percentage >= 75,
            "classes_remaining": total_classes - len(logs),
        },
        "history": history,
    }), 200)


# ─── Notifications ─────────────────────────────────────────────────────────────

@app_views.route('/student/notifications', methods=["GET"], strict_slashes=False)
@jwt_required()
def student_notifications():
    """Get all notifications for the current student, newest first."""
    user_id = get_jwt_identity()

    notifications = ses.query(Notification).filter_by(user_id=user_id).order_by(
        Notification.created_at.desc()
    ).limit(50).all()

    data = []
    for n in notifications:
        data.append({
            "id": n.id,
            "title": n.title,
            "message": n.message,
            "type": n.notification_type,
            "is_read": n.is_read,
            "session_id": n.related_session_id,
            "created_at": n.created_at.strftime("%Y-%m-%d %H:%M:%S") if n.created_at else None,
        })

    unread_count = ses.query(Notification).filter_by(user_id=user_id, is_read=False).count()

    return make_response(jsonify({"data": data, "unread_count": unread_count}), 200)


@app_views.route('/student/notifications/<notification_id>/read', methods=["PUT"], strict_slashes=False)
@jwt_required()
def mark_notification_read(notification_id):
    """Mark a notification as read."""
    user_id = get_jwt_identity()
    notification = storage.get_id(Notification, notification_id)

    if not notification or notification.user_id != user_id:
        return make_response(jsonify({"error": "Notification not found"}), 404)

    notification.is_read = True
    notification.save()

    return make_response(jsonify({"message": "Marked as read"}), 200)


@app_views.route('/student/notifications/read-all', methods=["PUT"], strict_slashes=False)
@jwt_required()
def mark_all_notifications_read():
    """Mark all notifications as read for the current student."""
    user_id = get_jwt_identity()
    notifications = ses.query(Notification).filter_by(user_id=user_id, is_read=False).all()

    for n in notifications:
        n.is_read = True

    storage.save()

    return make_response(jsonify({"message": f"Marked {len(notifications)} notifications as read"}), 200)


# ─── Available Sessions (for enrollment discovery) ────────────────────────────

@app_views.route('/student/available-sessions', methods=["GET"], strict_slashes=False)
@jwt_required()
def available_sessions():
    """
    List all sessions the student can enroll in (not yet enrolled).
    Supports ?search=PHY to filter by course ID.
    """
    user_id = get_jwt_identity()
    search = request.args.get('search', '').strip()

    # Get already enrolled session IDs
    enrolled = ses.query(SessionEnrollment.session_id).filter_by(user_id=user_id).all()
    enrolled_ids = {e.session_id for e in enrolled}

    # Query all sessions
    query = ses.query(Sessions)
    if search:
        query = query.filter(Sessions.courseID.ilike(f"%{search}%"))

    all_sessions = query.all()

    result = []
    for s in all_sessions:
        if s.id in enrolled_ids:
            continue

        course = ses.query(Courses).filter_by(courseID=s.courseID).first()

        # Get lecturers for this session
        from models.lecturer_session import LecturerSession
        lecturer_links = ses.query(LecturerSession).filter_by(session_id=s.id).all()
        lecturers = []
        for link in lecturer_links:
            lec = storage.get_id(User, link.lecturer_id)
            if lec:
                lecturers.append({"name": lec.name})

        enrolled_count = ses.query(SessionEnrollment).filter_by(session_id=s.id).count()

        result.append({
            "id": s.id,
            "session_name": s.session_name,
            "courseID": s.courseID,
            "course_name": course.courseName if course else "N/A",
            "total_expected_classes": s.total_expected_classes,
            "enrolled_students": enrolled_count,
            "lecturers": lecturers,
        })

    return make_response(jsonify({"data": result}), 200)
