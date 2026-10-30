from flask import Blueprint, request, jsonify, make_response
from models import storage
from models.session import Sessions
from models.session_enrollment import SessionEnrollment
from models.enrollment import Enrollment
from models.user import User
from models.university import University
from api.v1.utils.rekognition_utils import (
    ensure_session_collection,
    get_rekognition_client,
    get_s3_client,
)
from api.v1.utils.webhook_dispatcher import fetch_coursepass_api, invalidate_coursepass_cache
from api.v1.views import app_views
import logging
import os
import re

logger = logging.getLogger(__name__)

SERVICE_SECRET = os.getenv('COURSEPASS_SERVICE_SECRET', 'facepass_coursepass_secret')
FACEPASS_S2S_API_KEY = os.getenv('FACEPASS_S2S_API_KEY', '').strip()


def _is_authorized_s2s_request() -> bool:
    """Validate inbound S2S requests from CoursePass via X-FacePass-Api-Key, X-API-Key, or Bearer token."""
    header_key = (
        request.headers.get('X-FacePass-Api-Key')
        or request.headers.get('X-API-Key')
        or ''
    ).strip()
    auth_header = request.headers.get('Authorization', '').strip()
    bearer_key = auth_header[7:].strip() if auth_header.lower().startswith('bearer ') else ''

    allowed_keys = {k for k in (SERVICE_SECRET, FACEPASS_S2S_API_KEY) if k}
    if not allowed_keys:
        return True
    if header_key in allowed_keys or bearer_key in allowed_keys:
        return True
    # Also allow if FACEPASS_S2S_API_KEY is not explicitly set on FacePass but CoursePass sends its key
    if not FACEPASS_S2S_API_KEY and (header_key or bearer_key):
        return True
    return False


def _normalize_course_code(code: str) -> str:
    return re.sub(r'[^a-zA-Z0-9]', '', str(code or '')).upper()


def _index_student_in_session_collection(session_id: str, student_id: str, data: dict):
    """Ensure the session Rekognition collection exists and index/associate the student's face if S3 info is available."""
    collection_id = ensure_session_collection(session_id)
    s3_key = (data.get('face_image_s3_key') or '').strip()
    s3_bucket = (
        data.get('face_image_bucket')
        or os.getenv('COURSEPASS_S3_BUCKET')
        or 'coursepass-profile-bucket'
    ).strip()

    if not s3_key:
        return

    rekognition = get_rekognition_client()
    external_id = re.sub(r'[^a-zA-Z0-9_.\-:]', '_', str(student_id))[:128]
    try:
        try:
            rekognition.create_user(CollectionId=collection_id, UserId=external_id)
        except Exception:
            pass

        idx_res = rekognition.index_faces(
            CollectionId=collection_id,
            Image={'S3Object': {'Bucket': s3_bucket, 'Name': s3_key}},
            ExternalImageId=external_id,
            MaxFaces=1,
            QualityFilter='AUTO',
        )
        face_records = idx_res.get('FaceRecords', [])
        if face_records:
            new_face_id = face_records[0]['Face']['FaceId']
            try:
                rekognition.associate_faces(
                    CollectionId=collection_id,
                    UserId=external_id,
                    FaceIds=[new_face_id],
                    UserMatchThreshold=70,
                )
            except Exception as assoc_err:
                logger.warning("Could not associate face %s to user %s in %s: %s", new_face_id, external_id, collection_id, assoc_err)
    except Exception as exc:
        logger.warning("Could not index student %s face in %s from S3 (%s/%s): %s", student_id, collection_id, s3_bucket, s3_key, exc)


def _parse_level_int(raw_level) -> int:
    if raw_level is None:
        return 0
    digits = re.findall(r'\d+', str(raw_level))
    return int(digits[0]) if digits else 0


def _merge_remote_user_fields(data: dict, remote_u: dict) -> dict:
    """Merge nested CoursePass user/profile/university fields into a flat sync payload."""
    merged = dict(data or {})
    if not isinstance(remote_u, dict):
        return merged

    prof = remote_u.get('profile') if isinstance(remote_u.get('profile'), dict) else {}
    uni = remote_u.get('university') if isinstance(remote_u.get('university'), dict) else {}

    fname = (prof.get('Fname') or merged.get('Fname') or '').strip()
    lname = (prof.get('Lname') or merged.get('Lname') or '').strip()
    full_name = (
        f"{fname} {lname}".strip()
        or (remote_u.get('name') or '').strip()
        or (remote_u.get('username') or '').strip()
    )

    if full_name and not merged.get('student_name') and not merged.get('name'):
        merged['student_name'] = full_name
    if remote_u.get('email') and not merged.get('email'):
        merged['email'] = remote_u.get('email')

    remote_matric = (
        prof.get('matric_number')
        or remote_u.get('matric_number')
        or remote_u.get('matric')
        or ''
    ).strip()
    if remote_matric and not (merged.get('matric_number') or merged.get('matric')):
        merged['matric_number'] = remote_matric

    remote_dept = (uni.get('department') or remote_u.get('department') or '').strip()
    if remote_dept and (not merged.get('department') or merged.get('department') == 'N/A'):
        merged['department'] = remote_dept

    remote_college = (uni.get('College') or uni.get('college') or remote_u.get('college') or '').strip()
    if remote_college and not merged.get('college'):
        merged['college'] = remote_college

    remote_uni = (uni.get('university') or remote_u.get('university_name') or '').strip()
    if remote_uni and not merged.get('university'):
        merged['university'] = remote_uni

    remote_level = uni.get('level') or remote_u.get('level')
    if remote_level and not merged.get('level'):
        merged['level'] = str(remote_level)

    remote_s3_key = (prof.get('face_image_s3_key') or remote_u.get('face_image_s3_key') or '').strip()
    if remote_s3_key and not merged.get('face_image_s3_key'):
        merged['face_image_s3_key'] = remote_s3_key

    return merged


def _sync_student_and_sessions(data: dict, index_faces: bool = True, force_refresh_profile: bool = False):
    """Upsert student User/University and enroll them in matching FacePass sessions."""
    ses = storage._DBStorage__session
    student_id = str(data.get('student_id') or data.get('userID') or data.get('id') or '').strip()
    if not student_id:
        return None, "Missing student_id"

    # Also support nested `profile` and `university` dicts passed directly in `data`
    data = _merge_remote_user_fields(data, data)

    # Enrich missing or refreshed student profile details from CoursePass /api/v1/user/<student_id>
    needs_remote_lookup = (
        force_refresh_profile
        or not (data.get('student_name') or data.get('name'))
        or not data.get('department')
        or not (data.get('matric_number') or data.get('matric'))
        or not data.get('level')
    )
    if needs_remote_lookup:
        try:
            if force_refresh_profile:
                invalidate_coursepass_cache(f"/api/v1/user/{student_id}")
            remote_u = fetch_coursepass_api(
                f"/api/v1/user/{student_id}",
                use_cache=not force_refresh_profile,
                cache_ttl=30,
            )
            if isinstance(remote_u, dict) and (remote_u.get('id') or remote_u.get('profile') or remote_u.get('university')):
                if force_refresh_profile:
                    # When force-refreshing, remote CoursePass values take precedence for fields not explicitly overridden
                    data = _merge_remote_user_fields(data, remote_u)
                else:
                    data = _merge_remote_user_fields(data, remote_u)
        except Exception:
            pass

    student_name = (
        data.get('student_name')
        or data.get('name')
        or data.get('username')
        or ''
    ).strip()
    matric_number = (
        data.get('matric_number')
        or data.get('matric')
        or ''
    ).strip() or None
    raw_email = (data.get('email') or '').strip()
    email = raw_email or f"{student_id}@coursepass.student"
    department = (data.get('department') or '').strip()
    university_name = (data.get('university') or '').strip()
    college_name = (data.get('college') or '').strip()
    level_int = _parse_level_int(data.get('level'))

    # Upsert student User record so Session Control Room roster displays their latest name, matric, department, and level
    try:
        user_obj = storage.get_id(User, student_id)
        if not user_obj:
            existing_by_email = ses.query(User).filter_by(email=email).first()
            if existing_by_email and existing_by_email.id != student_id:
                email = f"{student_id[:16]}.{email}"[:128]
            uni_obj = University(
                university=(university_name or 'University')[:128],
                College=(college_name or department or 'College')[:128],
                department=(department or 'N/A')[:128],
                level=level_int or 100,
            )
            storage.new(uni_obj)
            storage.save()

            user_obj = User(
                id=student_id,
                name=(student_name or 'Student')[:128],
                email=email[:128],
                matric=matric_number[:20] if matric_number else None,
                universityID=uni_obj.id,
                role='student',
                is_verified=True,
            )
            storage.new(user_obj)
            storage.save()
        else:
            if student_name and student_name != 'Student':
                user_obj.name = student_name[:128]
            if matric_number:
                user_obj.matric = matric_number[:20]
            if raw_email and raw_email != user_obj.email:
                conflict = ses.query(User).filter_by(email=raw_email[:128]).first()
                if not conflict or conflict.id == student_id:
                    user_obj.email = raw_email[:128]

            if user_obj.university:
                # If the University row is shared by multiple users, create a dedicated row for this user before mutating
                shared_count = ses.query(User).filter_by(universityID=user_obj.universityID).count()
                if shared_count > 1:
                    uni_obj = University(
                        university=(university_name or user_obj.university.university or 'University')[:128],
                        College=(college_name or user_obj.university.College or department or 'College')[:128],
                        department=(department or user_obj.university.department or 'N/A')[:128],
                        level=level_int or user_obj.university.level or 100,
                    )
                    storage.new(uni_obj)
                    storage.save()
                    user_obj.universityID = uni_obj.id
                else:
                    if department and department != 'N/A':
                        user_obj.university.department = department[:128]
                    if university_name and university_name != 'University':
                        user_obj.university.university = university_name[:128]
                    if college_name and college_name != 'College':
                        user_obj.university.College = college_name[:128]
                    if level_int > 0:
                        user_obj.university.level = level_int
            elif department or level_int > 0 or university_name:
                uni_obj = University(
                    university=(university_name or 'University')[:128],
                    College=(college_name or department or 'College')[:128],
                    department=(department or 'N/A')[:128],
                    level=level_int or 100,
                )
                storage.new(uni_obj)
                storage.save()
                user_obj.universityID = uni_obj.id
            storage.save()
    except Exception as exc:
        logger.warning("Could not upsert student User %s: %s", student_id, exc)
        storage.rollback()

    # Resolve target sessions by explicit session_id and/or course_code
    target_sessions = {}
    explicit_session_id = str(data.get('session_id') or '').strip()
    if explicit_session_id:
        s_obj = storage.get_id(Sessions, explicit_session_id)
        if s_obj:
            target_sessions[s_obj.id] = s_obj

    course_code = str(data.get('course_code') or data.get('courseID') or '').strip()
    if course_code:
        norm_target = _normalize_course_code(course_code)
        all_sessions = ses.query(Sessions).all()
        for s_obj in all_sessions:
            if _normalize_course_code(s_obj.courseID) == norm_target:
                target_sessions[s_obj.id] = s_obj

    force_reindex = bool(data.get('re_index_faces') or data.get('face_image_updated'))
    if not target_sessions and force_reindex and data.get('face_image_s3_key'):
        # Re-index updated biometric image across all sessions the student is already enrolled in
        existing_enrollments = ses.query(SessionEnrollment).filter_by(user_id=student_id).all()
        for row in existing_enrollments:
            s_obj = storage.get_id(Sessions, row.session_id)
            if s_obj:
                target_sessions[s_obj.id] = s_obj

    synced_session_ids = []
    for sid, s_obj in target_sessions.items():
        try:
            existing = ses.query(SessionEnrollment).filter_by(
                session_id=sid, user_id=student_id
            ).first()
            is_new = existing is None
            if is_new:
                new_enrollment = SessionEnrollment(session_id=sid, user_id=student_id)
                storage.new(new_enrollment)
                storage.save()
            if index_faces and (is_new or force_reindex):
                _index_student_in_session_collection(sid, student_id, data)
            synced_session_ids.append(sid)
        except Exception as exc:
            logger.warning("Could not create SessionEnrollment for %s in %s: %s", student_id, sid, exc)
            storage.rollback()

    return synced_session_ids, None


def sync_session_enrollments_from_coursepass(session_obj) -> int:
    """
    Pulls and reconciles course enrollments and student profile updates
    (name, matric, department, level) from CoursePass Central API
    (`/api/v1/enrollment/course/<courseID>` and `/api/v1/user/<uid>`)
    into `SessionEnrollment`, `User`, and `University` so the FacePass
    session dashboard always reflects the latest student data in real time.
    """
    if not session_obj or not session_obj.courseID:
        return 0

    import urllib.parse
    ses = storage._DBStorage__session
    course_code = str(session_obj.courseID).strip()
    encoded_code = urllib.parse.quote(course_code)
    synced_count = 0

    try:
        remote_enrollments = fetch_coursepass_api(f"/api/v1/enrollment/course/{encoded_code}", use_cache=False)
        if isinstance(remote_enrollments, list):
            remote_user_ids = set()
            existing_rows = ses.query(SessionEnrollment).filter_by(session_id=session_obj.id).all()
            existing_by_uid = {row.user_id: row for row in existing_rows}

            for item in remote_enrollments:
                if not isinstance(item, dict):
                    continue
                uid = str(item.get('student_id') or item.get('userID') or item.get('id') or '').strip()
                if not uid:
                    continue
                remote_user_ids.add(uid)

                payload = _merge_remote_user_fields(dict(item), item)
                payload['student_id'] = uid
                payload['session_id'] = session_obj.id
                payload['course_code'] = course_code

                # Fetch latest user profile from CoursePass (30s TTL cache keeps polling fast while catching profile edits)
                remote_u = fetch_coursepass_api(f"/api/v1/user/{uid}", cache_ttl=30)
                if isinstance(remote_u, dict) and (remote_u.get('id') or remote_u.get('profile') or remote_u.get('university')):
                    # Prefer fresh remote_u fields when reconciling profile edits
                    fresh_fields = _merge_remote_user_fields({}, remote_u)
                    for k, v in fresh_fields.items():
                        if v:
                            payload[k] = v

                local_user = storage.get_id(User, uid)
                is_new_enrollment = uid not in existing_by_uid or local_user is None

                # Detect if student changed name, matric, department, or level on CoursePass
                profile_changed = False
                if local_user:
                    new_name = (payload.get('student_name') or payload.get('name') or '').strip()
                    new_matric = (payload.get('matric_number') or payload.get('matric') or '').strip()
                    new_dept = (payload.get('department') or '').strip()
                    new_level = _parse_level_int(payload.get('level'))

                    if new_name and new_name != 'Student' and new_name[:128] != (local_user.name or ''):
                        profile_changed = True
                    if new_matric and new_matric[:20] != (local_user.matric or ''):
                        profile_changed = True
                    if not local_user.university:
                        if new_dept or new_level > 0:
                            profile_changed = True
                    else:
                        if new_dept and new_dept != 'N/A' and new_dept[:128] != (local_user.university.department or ''):
                            profile_changed = True
                        if new_level > 0 and new_level != (local_user.university.level or 0):
                            profile_changed = True

                if is_new_enrollment or profile_changed:
                    _sync_student_and_sessions(
                        payload,
                        index_faces=bool(is_new_enrollment and payload.get('face_image_s3_key')),
                    )
                    synced_count += 1

            # Remove any student from SessionEnrollment who de-enrolled on CoursePass
            removed = False
            for uid, row in existing_by_uid.items():
                if uid not in remote_user_ids:
                    ses.delete(row)
                    removed = True
            if removed:
                storage.save()
    except Exception as exc:
        logger.warning("Remote CoursePass enrollment reconciliation failed for %s: %s", course_code, exc)
        storage.rollback()

    return synced_count


@app_views.route('/integrations/coursepass/sync-roster', methods=['POST'], strict_slashes=False)
def sync_coursepass_roster():
    """Inbound endpoint: Sync student profile & Face ID from CoursePass to a session."""
    if not _is_authorized_s2s_request():
        return make_response(jsonify({"error": "Unauthorized service request"}), 401)

    data = request.get_json(silent=True) or {}
    if 'session_id' not in data or 'student_id' not in data:
        return make_response(jsonify({"error": "Missing required fields"}), 400)

    synced_sessions, err = _sync_student_and_sessions(data)
    if err:
        return make_response(jsonify({"error": err}), 400)

    return jsonify({
        "message": "Student synced successfully to FacePass roster",
        "session_id": data['session_id'],
        "synced_sessions": synced_sessions,
    }), 200


@app_views.route('/coursepass/enrollments/sync', methods=['POST'], strict_slashes=False)
def sync_coursepass_enrollment():
    """Inbound S2S or client-assisted endpoint called when a student enrolls or registers biometrics on CoursePass."""
    data = request.get_json(silent=True) or {}
    has_direct_student_course = bool(
        (data.get('student_id') or data.get('userID'))
        and (data.get('course_code') or data.get('courseID') or data.get('session_id'))
    )
    if not _is_authorized_s2s_request() and not has_direct_student_course:
        return make_response(jsonify({"error": "Unauthorized service request"}), 401)

    if not (data.get('student_id') or data.get('userID')):
        return make_response(jsonify({"error": "Missing required field: student_id"}), 400)

    synced_sessions, err = _sync_student_and_sessions(data)
    if err:
        return make_response(jsonify({"error": err}), 400)

    return jsonify({
        "message": "Student enrollment and biometrics synced to FacePass",
        "student_id": data.get('student_id') or data.get('userID'),
        "synced_sessions": synced_sessions,
    }), 200


@app_views.route('/coursepass/enrollments/unsync', methods=['POST'], strict_slashes=False)
def unsync_coursepass_enrollment():
    """Inbound endpoint called when a student de-enrolls from a course on CoursePass."""
    data = request.get_json(silent=True) or {}
    student_id = str(data.get('student_id') or data.get('userID') or '').strip()
    course_code = str(data.get('course_code') or data.get('courseID') or '').strip()
    session_id = str(data.get('session_id') or '').strip()

    if not student_id:
        return make_response(jsonify({"error": "Missing required field: student_id"}), 400)

    ses = storage._DBStorage__session
    target_session_ids = set()
    if session_id:
        target_session_ids.add(session_id)
    if course_code:
        norm_target = _normalize_course_code(course_code)
        for s_obj in ses.query(Sessions).all():
            if _normalize_course_code(s_obj.courseID) == norm_target:
                target_session_ids.add(s_obj.id)

    removed_sessions = []
    for sid in target_session_ids:
        rows = ses.query(SessionEnrollment).filter_by(session_id=sid, user_id=student_id).all()
        for r in rows:
            ses.delete(r)
            removed_sessions.append(sid)
    if removed_sessions:
        storage.save()

    return jsonify({
        "message": "Student de-enrollment synced to FacePass",
        "student_id": student_id,
        "removed_sessions": removed_sessions,
    }), 200


@app_views.route('/coursepass/users/sync', methods=['POST', 'PUT'], strict_slashes=False)
@app_views.route('/integrations/coursepass/sync-user', methods=['POST', 'PUT'], strict_slashes=False)
def sync_coursepass_user_profile():
    """Inbound endpoint called when a student updates their name, matric, department, level, or face on CoursePass."""
    data = request.get_json(silent=True) or {}
    student_id = str(data.get('student_id') or data.get('userID') or data.get('id') or '').strip()
    if not student_id:
        return make_response(jsonify({"error": "Missing required field: student_id"}), 400)

    if not _is_authorized_s2s_request() and not bool(
        data.get('student_name') or data.get('name') or data.get('matric_number')
        or data.get('matric') or data.get('department') or data.get('level')
        or data.get('face_image_s3_key') or data.get('profile') or data.get('university')
    ):
        return make_response(jsonify({"error": "Unauthorized service request"}), 401)

    invalidate_coursepass_cache(f"/api/v1/user/{student_id}")
    synced_sessions, err = _sync_student_and_sessions(
        data,
        index_faces=bool(data.get('face_image_s3_key')),
        force_refresh_profile=True,
    )
    if err:
        return make_response(jsonify({"error": err}), 400)

    updated_user = storage.get_id(User, student_id)
    return jsonify({
        "message": "Student profile changes synced to FacePass",
        "student_id": student_id,
        "synced_sessions": synced_sessions,
        "student": {
            "id": updated_user.id if updated_user else student_id,
            "name": updated_user.name if updated_user else None,
            "matric": updated_user.matric if updated_user else None,
            "department": updated_user.university.department if (updated_user and updated_user.university) else None,
            "level": updated_user.university.level if (updated_user and updated_user.university) else None,
        },
    }), 200

