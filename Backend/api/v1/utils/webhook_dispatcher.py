import requests
import os
import logging
import threading
from datetime import datetime

logger = logging.getLogger(__name__)

def get_base_url():
    base = os.getenv('COURSEPASS_API_BASE_URL', '').strip().rstrip('/')
    if not base:
        webhook_url = os.getenv('COURSEPASS_WEBHOOK_URL', '')
        if '/api/v1/' in webhook_url:
            base = webhook_url.split('/api/v1/')[0]
        else:
            base = 'http://localhost:8000'
    return base


def fetch_coursepass_api(path: str, params: dict = None):
    """
    Fetch data from CoursePass API (e.g., '/api/v1/universities', '/api/v1/courses').
    Tries configured COURSEPASS_API_BASE_URL and localhost:8000 first, then derived base URL.
    Returns parsed JSON on HTTP 200, or None if unreachable.
    """
    candidates = []
    env_base = os.getenv('COURSEPASS_API_BASE_URL', '').strip().rstrip('/')
    if env_base:
        candidates.append(env_base)
    if 'http://localhost:8000' not in candidates and 'http://127.0.0.1:8000' not in candidates:
        candidates.append('http://localhost:8000')
    derived = get_base_url()
    if derived not in candidates:
        candidates.append(derived)

    secret = os.getenv('COURSEPASS_SERVICE_SECRET', 'facepass_coursepass_secret')
    headers = {
        "Accept": "application/json",
        "X-API-Key": secret
    }
    for base in candidates:
        url = f"{base}{path}"
        try:
            res = requests.get(url, params=params, headers=headers, timeout=4)
            if res.status_code == 200:
                return res.json()
        except Exception as e:
            logger.warning(f"CoursePass API fetch failed for {url}: {e}")
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
