#!/usr/bin/python3
"""Admin API endpoints — platform telemetry, lecturer provisioning, user & session governance"""
import random
import secrets
import string
import bcrypt
from datetime import datetime
from sqlalchemy import or_
from flask import jsonify, make_response, request, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity
from flask_mail import Message

from models import storage
from models.user import User
from models.auth_provider import AuthProvider
from models.course import Courses
from models.session import Sessions
from models.lecturer_session import LecturerSession
from models.session_enrollment import SessionEnrollment
from models.attendance_log import AttendanceLog
from api.v1.views import app_views
from api.v1.utils.roles import role_required


def _generate_temp_password(length: int = 10) -> str:
    """Generate a readable, strong temporary password."""
    alphabet = string.ascii_letters + string.digits + "@#$"
    while True:
        pwd = "".join(secrets.choice(alphabet) for _ in range(length))
        if (
            any(c.islower() for c in pwd)
            and any(c.isupper() for c in pwd)
            and any(c.isdigit() for c in pwd)
        ):
            return pwd


def _hash_password(password: str) -> str:
    """Hash a password using bcrypt."""
    salt = bcrypt.gensalt(rounds=12)
    return bcrypt.hashpw(password.encode("utf-8"), salt).decode("utf-8")


def _try_send_welcome_email(name: str, email: str, temp_password: str, role: str) -> bool:
    """Attempt to send a welcome email with temporary credentials if Flask-Mail is configured."""
    try:
        from api.v1.app import mail
        if not current_app.config.get("MAIL_USERNAME"):
            return False
        subject = "Your FacePass Institutional Account Credentials"
        html_body = f"""
        <div style="font-family: Inter, Arial, sans-serif; max-width: 560px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 8px;">
            <h2 style="color: #0f172a; margin-top: 0;">Welcome to FacePass, {name}</h2>
            <p style="color: #334155; line-height: 1.6;">
                An institutional <strong>{role.upper()}</strong> account has been provisioned for you on the FacePass Biometric Attendance &amp; Course Management platform.
            </p>
            <div style="background: #f8fafc; border: 1px solid #cbd5e1; border-radius: 6px; padding: 16px; margin: 20px 0;">
                <p style="margin: 4px 0; color: #0f172a;"><strong>Login Email:</strong> {email}</p>
                <p style="margin: 4px 0; color: #0f172a;"><strong>Temporary Password:</strong> <code style="background: #e2e8f0; padding: 2px 6px; border-radius: 4px;">{temp_password}</code></p>
            </div>
            <p style="color: #475569; font-size: 13px;">
                For security, you will be prompted to set a new personal password immediately upon your first login.
            </p>
        </div>
        """
        msg = Message(subject=subject, recipients=[email], html=html_body)
        mail.send(msg)
        return True
    except Exception as exc:
        print(f"[Admin] Optional welcome email skipped/failed: {exc}")
        return False


# ─── Platform Overview Telemetry ──────────────────────────────────────────────

@app_views.route('/admin/overview', methods=["GET"], strict_slashes=False)
@jwt_required()
@role_required('admin')
def admin_overview():
    """Return high-level platform telemetry counts for the Admin Command Center."""
    ses = storage._DBStorage__session

    total_lecturers = ses.query(User).filter(User.role == 'lecturer').count()
    total_admins = ses.query(User).filter(User.role == 'admin').count()
    total_students = ses.query(User).filter(User.role == 'student').count()
    pending_password_changes = ses.query(User).filter(User.must_change_password == True).count()
    total_courses = ses.query(Courses).count()
    total_sessions = ses.query(Sessions).count()
    total_attendance_logs = ses.query(AttendanceLog).count()

    return make_response(jsonify({
        "total_lecturers": total_lecturers,
        "total_admins": total_admins,
        "total_students": total_students,
        "pending_password_changes": pending_password_changes,
        "total_courses": total_courses,
        "total_sessions": total_sessions,
        "total_attendance_logs": total_attendance_logs,
    }), 200)


# ─── User & Lecturer Management ───────────────────────────────────────────────

@app_views.route('/admin/users', methods=["GET"], strict_slashes=False)
@jwt_required()
@role_required('admin')
def admin_list_users():
    """
    List all users with their roles, temporary password status, and session assignments.
    Supports ?role=lecturer|admin|student and ?q=search_term
    """
    ses = storage._DBStorage__session
    role_filter = request.args.get('role', None)
    search_q = (request.args.get('q', '') or '').strip()

    query = ses.query(User)
    if role_filter and role_filter in ('student', 'lecturer', 'admin'):
        query = query.filter(User.role == role_filter)

    if search_q:
        like_pattern = f"%{search_q}%"
        query = query.filter(
            or_(
                User.name.ilike(like_pattern),
                User.email.ilike(like_pattern),
                User.matric.ilike(like_pattern),
            )
        )

    users = query.order_by(User.created_at.desc()).all()
    user_list = []
    for u in users:
        assigned_sessions_count = 0
        if u.role in ('lecturer', 'admin'):
            assigned_sessions_count = ses.query(LecturerSession).filter_by(lecturer_id=u.id).count()

        user_list.append({
            "id": u.id,
            "name": u.name,
            "email": u.email,
            "matric": u.matric,
            "role": u.role or "student",
            "is_verified": bool(u.is_verified),
            "must_change_password": bool(getattr(u, "must_change_password", False)),
            "assigned_sessions_count": assigned_sessions_count,
            "created_at": u.created_at.strftime("%Y-%m-%d %H:%M") if getattr(u, "created_at", None) else None,
        })

    return make_response(jsonify({"data": user_list, "total": len(user_list)}), 200)


@app_views.route('/admin/lecturers', methods=["POST"], strict_slashes=False)
@jwt_required()
@role_required('admin')
def admin_create_lecturer():
    """
    Manually provision a Lecturer (or Admin) account with a temporary password.
    Body:
    {
        "name": "Dr. Adaeze Okafor",
        "email": "adaeze@university.edu",
        "matric": "LEC-2041",          # optional; auto-generated if omitted
        "password": "...",             # optional; auto-generated if omitted
        "role": "lecturer" | "admin",  # default 'lecturer'
        "must_change_password": true,  # default true
        "send_email": true             # default true
    }
    """
    ses = storage._DBStorage__session
    data = request.get_json()
    if not data:
        return make_response(jsonify({"error": "Not a JSON"}), 400)

    name = (data.get("name") or "").strip()
    email = (data.get("email") or "").strip().lower()
    role = (data.get("role") or "lecturer").strip()
    matric = (data.get("matric") or "").strip()
    raw_password = (data.get("password") or "").strip()
    must_change_password = bool(data.get("must_change_password", True))
    send_email = bool(data.get("send_email", True))

    if not name or not email:
        return make_response(jsonify({"error": "Full name and email are required"}), 400)

    if role not in ("lecturer", "admin"):
        return make_response(jsonify({"error": "Role must be 'lecturer' or 'admin'"}), 400)

    existing = ses.query(User).filter(User.email == email).first()
    if existing:
        return make_response(jsonify({"error": "An account with this email already exists"}), 409)

    if not matric:
        prefix = "ADM" if role == "admin" else "LEC"
        matric = f"{prefix}-{random.randint(1000, 9999)}"

    temp_password = raw_password if raw_password else _generate_temp_password(10)
    if len(temp_password) < 6:
        return make_response(jsonify({"error": "Temporary password must be at least 6 characters"}), 400)

    user_instance = User(
        name=name,
        email=email,
        matric=matric,
        role=role,
        is_verified=True,
        verification_code=None,
        must_change_password=must_change_password,
    )
    user_instance.save()

    created_user = storage.get_email(User, email)
    provider_instance = AuthProvider(
        password=temp_password,
        provider="Local",
        provider_id=email,
        userID=created_user.id,
    )
    provider_instance.save()

    email_sent = False
    if send_email:
        email_sent = _try_send_welcome_email(name, email, temp_password, role)

    return make_response(jsonify({
        "message": f"{role.capitalize()} account provisioned successfully",
        "user": {
            "id": created_user.id,
            "name": created_user.name,
            "email": created_user.email,
            "matric": created_user.matric,
            "role": created_user.role,
            "is_verified": bool(created_user.is_verified),
            "must_change_password": bool(created_user.must_change_password),
        },
        "temporary_password": temp_password,
        "email_sent": email_sent,
    }), 201)


@app_views.route('/admin/users/<user_id>/reset-password', methods=["POST"], strict_slashes=False)
@jwt_required()
@role_required('admin')
def admin_reset_user_password(user_id):
    """
    Reset a user's password to a temporary password and force password change on next login.
    Body (optional): { "password": "...", "must_change_password": true, "send_email": false }
    """
    ses = storage._DBStorage__session
    data = request.get_json(silent=True) or {}

    user = storage.get_id(User, user_id)
    if not user:
        return make_response(jsonify({"error": "User not found"}), 404)

    raw_password = (data.get("password") or "").strip()
    temp_password = raw_password if raw_password else _generate_temp_password(10)
    if len(temp_password) < 6:
        return make_response(jsonify({"error": "Temporary password must be at least 6 characters"}), 400)

    must_change = bool(data.get("must_change_password", True))

    auth_prov = ses.query(AuthProvider).filter_by(userID=user.id).first()
    if not auth_prov:
        auth_prov = AuthProvider(
            password=temp_password,
            provider="Local",
            provider_id=user.email,
            userID=user.id,
        )
        auth_prov.save()
    else:
        auth_prov.password = _hash_password(temp_password)

    user.must_change_password = must_change
    user.is_verified = True
    storage.save()

    email_sent = False
    if data.get("send_email"):
        email_sent = _try_send_welcome_email(user.name, user.email, temp_password, user.role or "lecturer")

    return make_response(jsonify({
        "message": f"Temporary password generated for {user.name}",
        "user": {
            "id": user.id,
            "name": user.name,
            "email": user.email,
            "role": user.role,
            "must_change_password": bool(user.must_change_password),
        },
        "temporary_password": temp_password,
        "email_sent": email_sent,
    }), 200)


@app_views.route('/admin/assign-role', methods=["POST"], strict_slashes=False)
@jwt_required()
@role_required('admin')
def assign_role():
    """
    Assign a role to a user. Only admins can do this.
    Body: { "user_id": "...", "role": "lecturer" | "student" | "admin" }
    """
    current_admin_id = get_jwt_identity()
    data = request.get_json()
    if not data:
        return make_response(jsonify({"error": "Not a JSON"}), 400)

    user_id = data.get("user_id")
    new_role = data.get("role")

    if not user_id or not new_role:
        return make_response(jsonify({"error": "Missing user_id or role"}), 400)

    if new_role not in ('student', 'lecturer', 'admin'):
        return make_response(jsonify({"error": "Invalid role. Must be 'student', 'lecturer', or 'admin'"}), 400)

    if user_id == current_admin_id and new_role != 'admin':
        return make_response(jsonify({"error": "You cannot demote your own active admin account"}), 400)

    user = storage.get_id(User, user_id)
    if not user:
        return make_response(jsonify({"error": "User not found"}), 404)

    user.role = new_role
    user.save()

    return make_response(jsonify({
        "message": f"User {user.name} has been assigned the role '{new_role}'",
        "user_id": user.id,
        "role": user.role
    }), 200)


@app_views.route('/admin/users/<user_id>', methods=["DELETE"], strict_slashes=False)
@jwt_required()
@role_required('admin')
def admin_delete_user(user_id):
    """Delete a user account (with self-deletion guard)."""
    ses = storage._DBStorage__session
    current_admin_id = get_jwt_identity()
    if user_id == current_admin_id:
        return make_response(jsonify({"error": "You cannot delete your own active admin account"}), 400)

    user = storage.get_id(User, user_id)
    if not user:
        return make_response(jsonify({"error": "User not found"}), 404)

    # Remove related auth providers and lecturer session links
    ses.query(AuthProvider).filter_by(userID=user.id).delete()
    ses.query(LecturerSession).filter_by(lecturer_id=user.id).delete()
    storage.delete(user)
    storage.save()

    return make_response(jsonify({"message": f"User '{user.name}' deleted successfully"}), 200)


# ─── Course & Session Oversight ───────────────────────────────────────────────

@app_views.route('/admin/courses', methods=["GET"], strict_slashes=False)
@jwt_required()
@role_required('admin')
def admin_list_courses():
    """List all courses in the local database along with active session counts."""
    ses = storage._DBStorage__session
    courses = ses.query(Courses).order_by(Courses.courseID).all()
    result = []
    for c in courses:
        session_count = ses.query(Sessions).filter_by(courseID=c.courseID).count()
        result.append({
            "id": c.id,
            "courseID": c.courseID,
            "courseName": c.courseName,
            "description": c.description,
            "session_count": session_count,
            "created_at": c.created_at.strftime("%Y-%m-%d") if getattr(c, "created_at", None) else None,
        })
    return make_response(jsonify({"data": result, "total": len(result)}), 200)


@app_views.route('/admin/courses/<course_id>', methods=["DELETE"], strict_slashes=False)
@jwt_required()
@role_required('admin')
def admin_delete_course(course_id):
    """Delete a course by its ID or courseID."""
    ses = storage._DBStorage__session
    course = storage.get_id(Courses, course_id) or ses.query(Courses).filter_by(courseID=course_id).first()
    if not course:
        return make_response(jsonify({"error": "Course not found"}), 404)

    active_sessions = ses.query(Sessions).filter_by(courseID=course.courseID).count()
    if active_sessions > 0:
        return make_response(jsonify({
            "error": f"Cannot delete {course.courseID} while it has {active_sessions} active session(s). Delete its sessions first."
        }), 400)

    storage.delete(course)
    storage.save()
    return make_response(jsonify({"message": f"Course {course.courseID} deleted"}), 200)


@app_views.route('/admin/sessions', methods=["GET"], strict_slashes=False)
@jwt_required()
@role_required('admin')
def admin_list_sessions():
    """List all academic sessions across the platform with assigned lecturers and student counts."""
    ses = storage._DBStorage__session
    all_sessions = ses.query(Sessions).order_by(Sessions.created_at.desc()).all()
    result = []
    for s in all_sessions:
        course = ses.query(Courses).filter_by(courseID=s.courseID).first()
        enrolled_count = ses.query(SessionEnrollment).filter_by(session_id=s.id).count()
        log_count = ses.query(AttendanceLog).filter_by(session_id=s.id).count()

        links = ses.query(LecturerSession).filter_by(session_id=s.id).all()
        lecturers = []
        for link in links:
            lec = storage.get_id(User, link.lecturer_id)
            if lec:
                lecturers.append({
                    "id": lec.id,
                    "name": lec.name,
                    "email": lec.email,
                })

        result.append({
            "id": s.id,
            "courseID": s.courseID,
            "course_name": course.courseName if course else s.courseID,
            "session_name": s.session_name,
            "total_expected_classes": s.total_expected_classes,
            "enrolled_students": enrolled_count,
            "attendance_logs_count": log_count,
            "lecturers": lecturers,
            "created_at": s.created_at.strftime("%Y-%m-%d") if getattr(s, "created_at", None) else None,
        })

    return make_response(jsonify({"data": result, "total": len(result)}), 200)


@app_views.route('/admin/sessions/<session_id>/assign-lecturer', methods=["POST"], strict_slashes=False)
@jwt_required()
@role_required('admin')
def admin_assign_lecturer_to_session(session_id):
    """
    Assign any lecturer (or admin) to a session.
    Body: { "lecturer_id": "..." } or { "email": "..." }
    """
    ses = storage._DBStorage__session
    session_obj = storage.get_id(Sessions, session_id)
    if not session_obj:
        return make_response(jsonify({"error": "Session not found"}), 404)

    data = request.get_json() or {}
    lecturer = None
    if data.get("lecturer_id"):
        lecturer = storage.get_id(User, data["lecturer_id"])
    elif data.get("email"):
        lecturer = storage.get_email(User, data["email"].strip())

    if not lecturer:
        return make_response(jsonify({"error": "Lecturer not found"}), 404)

    if lecturer.role not in ("lecturer", "admin"):
        return make_response(jsonify({"error": "Selected user is not a lecturer or admin"}), 400)

    existing = ses.query(LecturerSession).filter_by(
        session_id=session_id, lecturer_id=lecturer.id
    ).first()
    if existing:
        return make_response(jsonify({"error": "Lecturer is already assigned to this session"}), 409)

    link = LecturerSession(session_id=session_id, lecturer_id=lecturer.id)
    link.save()

    return make_response(jsonify({
        "message": f"Assigned {lecturer.name} to {session_obj.courseID} ({session_obj.session_name})",
        "lecturer": {"id": lecturer.id, "name": lecturer.name, "email": lecturer.email},
    }), 201)


@app_views.route('/admin/sessions/<session_id>/lecturers/<lecturer_id>', methods=["DELETE"], strict_slashes=False)
@jwt_required()
@role_required('admin')
def admin_remove_lecturer_from_session(session_id, lecturer_id):
    """Unassign a lecturer from a session."""
    ses = storage._DBStorage__session
    link = ses.query(LecturerSession).filter_by(
        session_id=session_id, lecturer_id=lecturer_id
    ).first()
    if not link:
        return make_response(jsonify({"error": "Lecturer assignment not found"}), 404)

    storage.delete(link)
    storage.save()
    return make_response(jsonify({"message": "Lecturer unassigned from session"}), 200)


@app_views.route('/admin/sessions/<session_id>', methods=["DELETE"], strict_slashes=False)
@jwt_required()
@role_required('admin')
def admin_delete_session(session_id):
    """Delete a session and its lecturer links."""
    ses = storage._DBStorage__session
    session_obj = storage.get_id(Sessions, session_id)
    if not session_obj:
        return make_response(jsonify({"error": "Session not found"}), 404)

    ses.query(LecturerSession).filter_by(session_id=session_id).delete()
    ses.query(SessionEnrollment).filter_by(session_id=session_id).delete()
    ses.query(AttendanceLog).filter_by(session_id=session_id).delete()
    storage.delete(session_obj)
    storage.save()

    return make_response(jsonify({"message": "Session deleted successfully"}), 200)
