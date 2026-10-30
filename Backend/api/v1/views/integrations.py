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
from api.v1.utils.webhook_dispatcher import fetch_coursepass_api
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


def _sync_student_and_sessions(data: dict, index_faces: bool = True):
    """Upsert student User/University and enroll them in matching FacePass sessions."""
    ses = storage._DBStorage__session
    student_id = str(data.get('student_id') or data.get('userID') or data.get('id') or '').strip()
    if not student_id:
        return None, "Missing student_id"

    # Enrich missing student profile details from CoursePass /api/v1/user/<student_id> if needed
    if not data.get('student_name') or not data.get('department'):
        try:
            remote_u = fetch_coursepass_api(f"/api/v1/user/{student_id}")
            if isinstance(remote_u, dict) and remote_u.get('id'):
                prof = remote_u.get('profile') or {}
                uni = remote_u.get('university') or {}
                fname = (prof.get('Fname') or '').strip()
                lname = (prof.get('Lname') or '').strip()
                full_name = f"{fname} {lname}".strip() or remote_u.get('username') or remote_u.get('email') or 'Student'
                data = dict(data)
                data.setdefault('student_name', full_name)
                data.setdefault('email', remote_u.get('email') or '')
                data.setdefault('matric_number', prof.get('matric_number') or '')
                data.setdefault('department', uni.get('department') or 'N/A')
                data.setdefault('college', uni.get('College') or '')
                data.setdefault('university', uni.get('university') or 'University')
                data.setdefault('level', str(uni.get('level') or '100'))
                if prof.get('face_image_s3_key') and not data.get('face_image_s3_key'):
                    data['face_image_s3_key'] = prof.get('face_image_s3_key')
        except Exception:
            pass

    student_name = (
        data.get('student_name')
        or data.get('name')
        or data.get('username')
        or 'Student'
    ).strip()
    matric_number = (
        data.get('matric_number')
        or data.get('matric')
        or ''
    ).strip() or None
    email = (data.get('email') or f"{student_id}@coursepass.student").strip()
    department = (data.get('department') or 'N/A').strip()
    university_name = (data.get('university') or 'University').strip()
    college_name = (data.get('college') or department or 'College').strip()
    raw_level = str(data.get('level') or '100')
    digits = re.findall(r'\d+', raw_level)
    level_int = int(digits[0]) if digits else 100

    # Upsert student User record so Session Control Room roster displays their name, matric, and department
    try:
        user_obj = storage.get_id(User, student_id)
        if not user_obj:
            existing_by_email = ses.query(User).filter_by(email=email).first()
            if existing_by_email and existing_by_email.id != student_id:
                email = f"{student_id[:16]}.{email}"[:128]
            uni_obj = University(
                university=(university_name or 'University')[:128],
                College=(college_name or 'College')[:128],
                department=(department or 'N/A')[:128],
                level=level_int,
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
            if user_obj.university:
                if department and department != 'N/A':
                    user_obj.university.department = department[:128]
                if university_name and university_name != 'University':
                    user_obj.university.university = university_name[:128]
                if level_int:
                    user_obj.university.level = level_int
            elif department:
                uni_obj = University(
                    university=(university_name or 'University')[:128],
                    College=(college_name or 'College')[:128],
                    department=(department or 'N/A')[:128],
                    level=level_int,
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

    synced_session_ids = []
    for sid, s_obj in target_sessions.items():
        try:
            existing = ses.query(SessionEnrollment).filter_by(
                session_id=sid, user_id=student_id
            ).first()
            if not existing:
                new_enrollment = SessionEnrollment(session_id=sid, user_id=student_id)
                storage.new(new_enrollment)
                storage.save()
            if index_faces:
                _index_student_in_session_collection(sid, student_id, data)
            synced_session_ids.append(sid)
        except Exception as exc:
            logger.warning("Could not create SessionEnrollment for %s in %s: %s", student_id, sid, exc)
            storage.rollback()

    return synced_session_ids, None


def sync_session_enrollments_from_coursepass(session_obj) -> int:
    """
    Pulls and reconciles course enrollments from local `enrollments` table AND
    CoursePass Central API (`/api/v1/enrollment/course/<courseID>`) into `SessionEnrollment`
    so any student enrolled on CoursePass immediately shows up on the FacePass session dashboard.
    """
    if not session_obj or not session_obj.courseID:
        return 0

    ses = storage._DBStorage__session
    course_code = str(session_obj.courseID).strip()
    norm_code = _normalize_course_code(course_code)
    synced_count = 0

    # 1. Reconcile any local `Enrollment` rows matching this course code
    try:
        local_enrollments = ses.query(Enrollment).all()
        for le in local_enrollments:
            if _normalize_course_code(le.courseID) == norm_code and le.userID:
                existing_se = ses.query(SessionEnrollment).filter_by(
                    session_id=session_obj.id, user_id=le.userID
                ).first()
                if not existing_se:
                    user_exists = storage.get_id(User, le.userID)
                    if not user_exists:
                        remote_u = fetch_coursepass_api(f"/api/v1/user/{le.userID}")
                        if isinstance(remote_u, dict) and remote_u.get('id'):
                            prof = remote_u.get('profile') or {}
                            uni = remote_u.get('university') or {}
                            fname = (prof.get('Fname') or '').strip()
                            lname = (prof.get('Lname') or '').strip()
                            full_name = f"{fname} {lname}".strip() or remote_u.get('username') or remote_u.get('email') or 'Student'
                            _sync_student_and_sessions({
                                'student_id': str(remote_u.get('id')),
                                'student_name': full_name,
                                'email': remote_u.get('email') or '',
                                'matric_number': prof.get('matric_number') or '',
                                'department': uni.get('department') or 'N/A',
                                'college': uni.get('College') or '',
                                'university': uni.get('university') or 'University',
                                'level': str(uni.get('level') or '100'),
                                'face_image_s3_key': prof.get('face_image_s3_key') or '',
                                'session_id': session_obj.id,
                                'course_code': course_code,
                            }, index_faces=False)
                            synced_count += 1
                            continue
                    storage.new(SessionEnrollment(session_id=session_obj.id, user_id=le.userID))
                    storage.save()
                    synced_count += 1
    except Exception as exc:
        logger.warning("Local enrollment reconciliation warning for %s: %s", course_code, exc)
        storage.rollback()

    # 2. Pull live course enrollments from CoursePass Central API
    try:
        remote_enrollments = fetch_coursepass_api(f"/api/v1/enrollment/course/{course_code}", use_cache=False)
        if isinstance(remote_enrollments, list):
            for item in remote_enrollments:
                if not isinstance(item, dict):
                    continue
                uid = str(item.get('student_id') or item.get('userID') or '').strip()
                if not uid:
                    continue

                payload = dict(item)
                payload['student_id'] = uid
                payload['session_id'] = session_obj.id
                payload['course_code'] = course_code

                # If student identity details weren't embedded in enrollment response, fetch from /api/v1/user/<uid>
                if not payload.get('student_name'):
                    remote_u = fetch_coursepass_api(f"/api/v1/user/{uid}")
                    if isinstance(remote_u, dict) and remote_u.get('id'):
                        prof = remote_u.get('profile') or {}
                        uni = remote_u.get('university') or {}
                        fname = (prof.get('Fname') or '').strip()
                        lname = (prof.get('Lname') or '').strip()
                        full_name = f"{fname} {lname}".strip() or remote_u.get('username') or remote_u.get('email') or 'Student'
                        payload.update({
                            'student_name': full_name,
                            'email': remote_u.get('email') or '',
                            'matric_number': prof.get('matric_number') or '',
                            'department': uni.get('department') or 'N/A',
                            'college': uni.get('College') or '',
                            'university': uni.get('university') or 'University',
                            'level': str(uni.get('level') or '100'),
                            'face_image_s3_key': prof.get('face_image_s3_key') or '',
                        })

                _sync_student_and_sessions(payload, index_faces=bool(payload.get('face_image_s3_key')))
                synced_count += 1
    except Exception as exc:
        logger.warning("Remote CoursePass enrollment pull failed for %s: %s", course_code, exc)

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
