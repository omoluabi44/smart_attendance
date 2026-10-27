import requests
import os
import logging
import threading

logger = logging.getLogger(__name__)

def dispatch_attendance_webhook_sync(session_id: str, date_str: str, present_user_ids: list, absent_user_ids: list):
    """Fire real-time attendance webhook to CoursePass (Synchronous)."""
    webhook_url = os.getenv('COURSEPASS_WEBHOOK_URL', 'http://localhost:5000/api/v1/integrations/facepass/attendance-webhook')
    if not webhook_url:
        logger.warning("COURSEPASS_WEBHOOK_URL not configured. Skipping webhook dispatch.")
        return
        
    secret = os.getenv('COURSEPASS_SERVICE_SECRET', 'facepass_coursepass_secret')
    payload = {
        "event": "attendance_confirmed",
        "session_id": session_id,
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
        logger.info(f"CoursePass webhook dispatched: status {res.status_code}")
    except Exception as e:
        logger.error(f"Failed to dispatch CoursePass webhook: {e}")

def dispatch_attendance_webhook(session_id: str, date_str: str, present_user_ids: list, absent_user_ids: list):
    """Fire real-time attendance webhook to CoursePass in a background thread."""
    thread = threading.Thread(target=dispatch_attendance_webhook_sync, args=(session_id, date_str, present_user_ids, absent_user_ids))
    thread.start()
