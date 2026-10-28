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


def fetch_coursepass_api(path: str, params: dict = None):
    """
    Fetch data from CoursePass Central API (e.g., '/api/v1/universities', '/api/v1/courses').
    Tries configured COURSEPASS_API_BASE_URL and https://api.coursepass.app first, then localhost fallback.
    Returns parsed JSON on HTTP 200, or None if unreachable.
    """
    cache_key = f"{path}?{json.dumps(params or {}, sort_keys=True)}"
    now = time.time()
    cached = _COURSEPASS_CACHE.get(cache_key)
    if cached and (now - cached["ts"] < _CACHE_TTL_SECONDS):
        return cached["data"]

    candidates = []
    env_base = _normalize_coursepass_base_url(os.getenv('COURSEPASS_API_BASE_URL', ''))
    if env_base and env_base not in ('http://localhost:8000', 'http://127.0.0.1:8000'):
        candidates.append(env_base)

    if 'https://api.coursepass.app' not in candidates:
        candidates.append('https://api.coursepass.app')

    derived = get_base_url()
    if derived and derived not in candidates:
        candidates.append(derived)

    if env_base in ('http://localhost:8000', 'http://127.0.0.1:8000') and env_base not in candidates:
        candidates.append(env_base)

    secret = os.getenv('COURSEPASS_SERVICE_SECRET', 'facepass_coursepass_secret')
    headers = {
        "Accept": "application/json",
        "X-API-Key": secret
    }
    for base in candidates:
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
    webhook_url = os.getenv('COURSEPASS_WEBHOOK_URL', f'{get_base_url()}/api/v1/facepass/webhooks/attendance/')
        
    secret = os.getenv('COURSEPASS_SERVICE_SECRET', 'facepass_coursepass_secret')
    payload = {
        "event": "attendance_confirmed",
        "session_id": session_id,
        "course_id": course_id,
        "date": date_str,
        "present_student_ids": present_user_ids,
        "absent_student_ids": absent_user_ids
    }
    headers = {
        "Content-Type": "application/json",
        "X-API-Key": secret
    }
    try:
        res = requests.post(webhook_url, json=payload, headers=headers, timeout=5)
        logger.info(f"CoursePass attendance webhook dispatched: status {res.status_code}")
    except Exception as e:
        logger.error(f"Failed to dispatch CoursePass attendance webhook: {e}")

def dispatch_attendance_webhook(session_id: str, course_id: str, date_str: str, present_user_ids: list, absent_user_ids: list):
    """Fire real-time attendance webhook to CoursePass in a background thread."""
    thread = threading.Thread(target=dispatch_attendance_webhook_sync, args=(session_id, course_id, date_str, present_user_ids, absent_user_ids))
    thread.start()

def dispatch_course_config_webhook_sync(course_id: str, total_classes: int, academic_session: str = "2026/2027"):
    webhook_url = f'{get_base_url()}/api/v1/facepass/webhooks/course-config/'
    secret = os.getenv('COURSEPASS_SERVICE_SECRET', 'facepass_coursepass_secret')
    payload = {
        "course_id": course_id,
        "facepass_course_id": course_id,
        "total_classes": total_classes,
        "academic_session": academic_session
    }
    headers = {"Content-Type": "application/json", "X-API-Key": secret}
    try:
        res = requests.post(webhook_url, json=payload, headers=headers, timeout=5)
        logger.info(f"CoursePass course-config webhook dispatched: status {res.status_code}")
    except Exception as e:
        logger.error(f"Failed to dispatch CoursePass course-config webhook: {e}")

def dispatch_course_config_webhook(course_id: str, total_classes: int, academic_session: str = "2026/2027"):
    thread = threading.Thread(target=dispatch_course_config_webhook_sync, args=(course_id, total_classes, academic_session))
    thread.start()

def dispatch_material_webhook_sync(course_id: str, material_id: str, title: str, material_type: str, file_url: str):
    webhook_url = f'{get_base_url()}/api/v1/facepass/webhooks/materials/'
    secret = os.getenv('COURSEPASS_SERVICE_SECRET', 'facepass_coursepass_secret')
    payload = {
        "course_id": course_id,
        "material_id": material_id,
        "facepass_material_id": material_id,
        "title": title,
        "material_type": material_type,
        "file_url": file_url
    }
    headers = {"Content-Type": "application/json", "X-API-Key": secret}
    try:
        res = requests.post(webhook_url, json=payload, headers=headers, timeout=5)
        logger.info(f"CoursePass material webhook dispatched: status {res.status_code}")
    except Exception as e:
        logger.error(f"Failed to dispatch CoursePass material webhook: {e}")

def dispatch_material_webhook(course_id: str, material_id: str, title: str, material_type: str, file_url: str = ""):
    thread = threading.Thread(target=dispatch_material_webhook_sync, args=(course_id, material_id, title, material_type, file_url))
    thread.start()

def dispatch_quiz_webhook_sync(course_id: str, quiz_id: str, title: str, scheduled_at: str, duration_minutes: int, is_graded: bool):
    webhook_url = f'{get_base_url()}/api/v1/facepass/webhooks/quizzes/'
    secret = os.getenv('COURSEPASS_SERVICE_SECRET', 'facepass_coursepass_secret')
    payload = {
        "course_id": course_id,
        "quiz_id": quiz_id,
        "facepass_quiz_id": quiz_id,
        "title": title,
        "scheduled_at": scheduled_at,
        "duration_minutes": duration_minutes,
        "is_graded": is_graded
    }
    headers = {"Content-Type": "application/json", "X-API-Key": secret}
    try:
        res = requests.post(webhook_url, json=payload, headers=headers, timeout=5)
        logger.info(f"CoursePass quiz webhook dispatched: status {res.status_code}")
    except Exception as e:
        logger.error(f"Failed to dispatch CoursePass quiz webhook: {e}")

def dispatch_quiz_webhook(course_id: str, quiz_id: str, title: str, scheduled_at: str, duration_minutes: int, is_graded: bool):
    thread = threading.Thread(target=dispatch_quiz_webhook_sync, args=(course_id, quiz_id, title, scheduled_at, duration_minutes, is_graded))
    thread.start()
