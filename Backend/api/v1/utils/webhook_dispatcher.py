import requests
import os
import logging
import threading
import time
import json
from datetime import datetime

logger = logging.getLogger(__name__)

# Lightweight in-memory TTL cache for CoursePass GET requests
_COURSEPASS_CACHE = {}
_CACHE_TTL_SECONDS = 300


def _normalize_coursepass_base_url(url: str) -> str:
    """Normalize CoursePass base URL so frontend hostnames point to the API host."""
    url = (url or '').strip().rstrip('/')
    if url in ('https://coursepass.app', 'http://coursepass.app', 'https://www.coursepass.app', 'http://www.coursepass.app'):
        return 'https://api.coursepass.app'
    return url


def get_base_url():
    base = _normalize_coursepass_base_url(os.getenv('COURSEPASS_API_BASE_URL', ''))
    if not base:
        webhook_url = os.getenv('COURSEPASS_WEBHOOK_URL', '')
        if '/api/v1/' in webhook_url:
            base = _normalize_coursepass_base_url(webhook_url.split('/api/v1/')[0])
        else:
            base = 'https://api.coursepass.app'
    return base


def invalidate_coursepass_cache(path_prefix: str = None):
    """Invalidate cached CoursePass API entries (all or matching a path prefix)."""
    if not path_prefix:
        _COURSEPASS_CACHE.clear()
        return
    keys_to_delete = [k for k in _COURSEPASS_CACHE if k.startswith(path_prefix)]
    for k in keys_to_delete:
        _COURSEPASS_CACHE.pop(k, None)


def _get_candidate_base_urls() -> list:
    candidates = []
    env_base = _normalize_coursepass_base_url(os.getenv('COURSEPASS_API_BASE_URL', ''))
    if env_base and env_base not in ('http://localhost:8000', 'http://127.0.0.1:8000'):
        candidates.append(env_base)

    if 'https://api.coursepass.app' not in candidates:
        candidates.append('https://api.coursepass.app')

    derived = get_base_url()
    if derived and derived not in candidates:
        candidates.append(derived)

    for local_url in ('http://localhost:8000', 'http://127.0.0.1:8000'):
        if local_url not in candidates:
            candidates.append(local_url)

    return candidates


def _build_coursepass_s2s_headers() -> dict:
    secret = (
        os.getenv('FACEPASS_S2S_API_KEY')
        or os.getenv('COURSEPASS_SERVICE_SECRET')
        or 'facepass-dev-s2s-key'
    ).strip()
    return {
        "Accept": "application/json",
        "Content-Type": "application/json",
        "X-FacePass-Api-Key": secret,
        "X-API-Key": secret,
        "Authorization": f"Bearer {secret}",
    }


def _post_coursepass_webhook(path: str, payload: dict, timeout: int = 8) -> bool:
    """
    POST a webhook payload to CoursePass across candidate base URLs.
    Retries with fallback S2S key if the server uses the default dev key.
    """
    secrets_to_try = []
    for candidate_secret in (
        os.getenv('FACEPASS_S2S_API_KEY', '').strip(),
        os.getenv('COURSEPASS_SERVICE_SECRET', '').strip(),
        'facepass-dev-s2s-key',
        'facepass_coursepass_secret',
    ):
        if candidate_secret and candidate_secret not in secrets_to_try:
            secrets_to_try.append(candidate_secret)

    for base in _get_candidate_base_urls():
        url = f"{base}{path}"
        for sec in secrets_to_try:
            headers = {
                "Accept": "application/json",
                "Content-Type": "application/json",
                "X-FacePass-Api-Key": sec,
                "X-API-Key": sec,
                "Authorization": f"Bearer {sec}",
            }
            try:
                res = requests.post(url, json=payload, headers=headers, timeout=timeout)
                if res.status_code in (200, 201):
                    logger.info(f"CoursePass webhook {path} succeeded at {base}: status {res.status_code}")
                    return True
                if res.status_code not in (401, 403):
                    # Reached server and authenticated, no need to retry other secrets on same host
                    logger.warning(f"CoursePass webhook {path} at {base} returned status {res.status_code}")
                    break
            except Exception as e:
                logger.debug(f"CoursePass webhook {url} unreachable: {e}")
                break
    return False


def fetch_coursepass_api(path: str, params: dict = None, use_cache: bool = True, cache_ttl: int = None):
    """
    Fetch data from CoursePass Central API (e.g., '/api/v1/universities', '/api/v1/courses').
    Tries configured COURSEPASS_API_BASE_URL and https://api.coursepass.app first, then localhost fallback.
    Returns parsed JSON on HTTP 200, or None if unreachable.
    """
    cache_key = f"{path}?{json.dumps(params or {}, sort_keys=True)}"
    now = time.time()
    ttl = _CACHE_TTL_SECONDS if cache_ttl is None else cache_ttl
    cached = _COURSEPASS_CACHE.get(cache_key)
    if use_cache and cached and (now - cached["ts"] < ttl):
        return cached["data"]

    headers = _build_coursepass_s2s_headers()
    for base in _get_candidate_base_urls():
        url = f"{base}{path}"
        try:
            res = requests.get(url, params=params, headers=headers, timeout=8)
            if res.status_code == 200:
                data = res.json()
                _COURSEPASS_CACHE[cache_key] = {"ts": now, "data": data}
                return data
        except Exception as e:
            logger.warning(f"CoursePass API fetch failed for {url}: {e}")

    # Return stale cache if available when network temporarily fails
    if cached:
        return cached["data"]
    return None

def dispatch_attendance_webhook_sync(session_id: str, course_id: str, date_str: str, present_user_ids: list, absent_user_ids: list):
    """Fire real-time attendance webhook to CoursePass (Synchronous)."""
    payload = {
        "event": "attendance_confirmed",
        "session_id": session_id,
        "course_id": course_id,
        "course_code": course_id,
        "date": date_str,
        "present_student_ids": present_user_ids,
        "absent_student_ids": absent_user_ids,
    }
    _post_coursepass_webhook('/api/v1/facepass/webhooks/attendance/', payload, timeout=6)

def dispatch_attendance_webhook(session_id: str, course_id: str, date_str: str, present_user_ids: list, absent_user_ids: list):
    """Fire real-time attendance webhook to CoursePass in a background thread."""
    thread = threading.Thread(target=dispatch_attendance_webhook_sync, args=(session_id, course_id, date_str, present_user_ids, absent_user_ids))
    thread.start()

def dispatch_course_config_webhook_sync(course_id: str, total_classes: int, academic_session: str = "2026/2027", timetable: list = None):
    payload = {
        "course_id": course_id,
        "course_code": course_id,
        "facepass_course_id": course_id,
        "total_classes": total_classes,
        "academic_session": academic_session,
    }
    if timetable is not None:
        payload["timetable"] = timetable
    _post_coursepass_webhook('/api/v1/facepass/webhooks/course-config/', payload, timeout=6)

def dispatch_course_config_webhook(course_id: str, total_classes: int, academic_session: str = "2026/2027", timetable: list = None):
    thread = threading.Thread(target=dispatch_course_config_webhook_sync, args=(course_id, total_classes, academic_session, timetable))
    thread.start()

def dispatch_lecture_notification_webhook_sync(
    course_id: str,
    session_id: str,
    title: str,
    message: str,
    notification_type: str = "lecture_update",
    reminder_stage: str = None,
    slot: dict = None,
    lecturer_name: str = None,
    course_name: str = None,
    enrolled_student_ids: list = None,
):
    """Fire real-time lecture update or reminder push notification webhook to CoursePass enrolled mobile users."""
    now_iso = datetime.utcnow().isoformat() + "Z"
    payload = {
        "course_id": course_id,
        "course_code": course_id,
        "course_name": course_name or course_id,
        "session_id": session_id,
        "title": title,
        "message": message,
        "notification_type": notification_type,
        "reminder_stage": reminder_stage,
        "slot": slot or {},
        "lecturer_name": lecturer_name or "Course Lecturer",
        "enrolled_student_ids": [str(uid) for uid in (enrolled_student_ids or []) if uid],
        "dispatched_at": now_iso,
        "sent_at": now_iso,
    }
    return _post_coursepass_webhook('/api/v1/facepass/webhooks/lecture-notification/', payload, timeout=8)

def dispatch_lecture_notification_webhook(
    course_id: str,
    session_id: str,
    title: str,
    message: str,
    notification_type: str = "lecture_update",
    reminder_stage: str = None,
    slot: dict = None,
    lecturer_name: str = None,
    course_name: str = None,
    enrolled_student_ids: list = None,
):
    thread = threading.Thread(
        target=dispatch_lecture_notification_webhook_sync,
        args=(
            course_id,
            session_id,
            title,
            message,
            notification_type,
            reminder_stage,
            slot,
            lecturer_name,
            course_name,
            enrolled_student_ids,
        ),
    )
    thread.start()

def dispatch_material_webhook_sync(course_id: str, material_id: str, title: str, material_type: str, file_url: str):
    payload = {
        "course_id": course_id,
        "course_code": course_id,
        "material_id": material_id,
        "facepass_material_id": material_id,
        "title": title,
        "material_type": material_type,
        "file_url": file_url,
    }
    _post_coursepass_webhook('/api/v1/facepass/webhooks/materials/', payload, timeout=6)

def dispatch_material_webhook(course_id: str, material_id: str, title: str, material_type: str, file_url: str = ""):
    thread = threading.Thread(target=dispatch_material_webhook_sync, args=(course_id, material_id, title, material_type, file_url))
    thread.start()

def dispatch_quiz_webhook_sync(course_id: str, quiz_id: str, title: str, scheduled_at: str, duration_minutes: int, is_graded: bool):
    payload = {
        "course_id": course_id,
        "course_code": course_id,
        "quiz_id": quiz_id,
        "facepass_quiz_id": quiz_id,
        "title": title,
        "scheduled_at": scheduled_at,
        "duration_minutes": duration_minutes,
        "is_graded": is_graded,
    }
    _post_coursepass_webhook('/api/v1/facepass/webhooks/quizzes/', payload, timeout=6)

def dispatch_quiz_webhook(course_id: str, quiz_id: str, title: str, scheduled_at: str, duration_minutes: int, is_graded: bool):
    thread = threading.Thread(target=dispatch_quiz_webhook_sync, args=(course_id, quiz_id, title, scheduled_at, duration_minutes, is_graded))
    thread.start()
