#!/usr/bin/env python3
"""
Automatic Lecture Reminder Worker (2 hours, 1 hour, and 30 minutes before lecture).
Checks configured weekly course timetables and dispatches push notifications
to lecturers and enrolled mobile users on FacePass and CoursePass.
"""
import logging
import os
import threading
import time
from datetime import datetime, timedelta, timezone

from models import storage
from models.course import Courses
from models.lecturer_session import LecturerSession
from models.notification import Notification
from models.session import Sessions
from models.session_enrollment import SessionEnrollment
from models.user import User
from api.v1.utils.webhook_dispatcher import dispatch_lecture_notification_webhook_sync

logger = logging.getLogger(__name__)

# Reminder stages: (stage_key, target_minutes_before, window_min, window_max, label)
REMINDER_STAGES = [
    ("2h", 120, 115, 122, "2 hours"),
    ("1h", 60, 55, 62, "1 hour"),
    ("30m", 30, 25, 32, "30 minutes"),
]

_SENT_REMINDER_KEYS = set()
_WORKER_STARTED = False
_WORKER_LOCK = threading.Lock()


def _get_local_now() -> datetime:
    """Return current local datetime (defaults to WAT / Africa/Lagos UTC+1)."""
    offset_hours = float(os.getenv("LECTURE_TIMEZONE_OFFSET_HOURS", "1"))
    tz = timezone(timedelta(hours=offset_hours))
    return datetime.now(tz)


def check_and_dispatch_lecture_reminders() -> list:
    """
    Scan all sessions with configured timetables and dispatch automatic
    2-hour, 1-hour, and 30-minute lecture reminders.
    Returns a list of dispatched reminder metadata dicts.
    """
    dispatched = []
    now_local = _get_local_now()
    today_weekday = now_local.strftime("%A")  # e.g. 'Monday'
    today_date_str = now_local.strftime("%Y-%m-%d")

    ses = storage._DBStorage__session
    if ses is None:
        return dispatched

    try:
        sessions = ses.query(Sessions).all()
        for session_obj in sessions:
            timetable = session_obj.timetable
            if not isinstance(timetable, list) or not timetable:
                continue

            course = ses.query(Courses).filter_by(courseID=session_obj.courseID).first()
            course_name = course.courseName if course else session_obj.courseID

            lecturer_links = ses.query(LecturerSession).filter_by(session_id=session_obj.id).all()
            lecturer_ids = [link.lecturer_id for link in lecturer_links]
            primary_lecturer_name = "Course Lecturer"
            if lecturer_ids:
                lec_user = storage.get_id(User, lecturer_ids[0])
                if lec_user and lec_user.name:
                    primary_lecturer_name = lec_user.name

            for idx, slot in enumerate(timetable):
                if not isinstance(slot, dict):
                    continue
                slot_day = str(slot.get("day") or "").strip()
                start_time_str = str(slot.get("start_time") or "").strip()
                if slot_day.lower() != today_weekday.lower() or not start_time_str:
                    continue

                try:
                    parts = start_time_str.split(":")
                    hour, minute = int(parts[0]), int(parts[1])
                except (ValueError, IndexError):
                    continue

                lecture_dt = now_local.replace(hour=hour, minute=minute, second=0, microsecond=0)
                minutes_until = (lecture_dt - now_local).total_seconds() / 60.0

                slot_id = str(slot.get("id") or f"{slot_day}-{start_time_str}-{idx}")
                venue = slot.get("venue")
                venue_suffix = f" at {venue}" if venue else ""

                for stage_key, target_mins, min_bound, max_bound, stage_label in REMINDER_STAGES:
                    if not (min_bound <= minutes_until <= max_bound):
                        continue

                    dedup_key = f"reminder:{session_obj.id}:{today_date_str}:{slot_id}:{stage_key}"
                    if dedup_key in _SENT_REMINDER_KEYS:
                        continue

                    # Also check database Notification table to prevent duplicate sends across processes
                    title_marker = f"[{stage_key.upper()} REMINDER] {session_obj.courseID}"
                    existing_notif = (
                        ses.query(Notification)
                        .filter_by(
                            related_session_id=session_obj.id,
                            notification_type=f"lecture_reminder_{stage_key}",
                            title=title_marker,
                        )
                        .first()
                    )
                    if existing_notif and existing_notif.created_at:
                        if existing_notif.created_at.strftime("%Y-%m-%d") == today_date_str:
                            _SENT_REMINDER_KEYS.add(dedup_key)
                            continue

                    _SENT_REMINDER_KEYS.add(dedup_key)

                    lecturer_msg = (
                        f"Reminder: Your {course_name} ({session_obj.courseID}) lecture starts in {stage_label} "
                        f"({start_time_str}{venue_suffix})."
                    )
                    student_title = f"⏰ {session_obj.courseID} Lecture in {stage_label}"
                    student_msg = (
                        f"Upcoming lecture reminder: {course_name} ({session_obj.courseID}) starts in {stage_label} "
                        f"at {start_time_str}{venue_suffix}."
                    )

                    # 1. Notify lecturer(s) on FacePass
                    for lec_id in lecturer_ids:
                        lec_notif = Notification(
                            user_id=lec_id,
                            title=title_marker,
                            message=lecturer_msg,
                            notification_type=f"lecture_reminder_{stage_key}",
                            related_session_id=session_obj.id,
                        )
                        lec_notif.save()

                    # 2. Notify enrolled students on FacePass
                    enrollments = ses.query(SessionEnrollment).filter_by(session_id=session_obj.id).all()
                    enrolled_student_ids = [str(e.user_id) for e in enrollments if e.user_id]
                    for enrollment in enrollments:
                        stu_notif = Notification(
                            user_id=enrollment.user_id,
                            title=student_title,
                            message=student_msg,
                            notification_type=f"lecture_reminder_{stage_key}",
                            related_session_id=session_obj.id,
                        )
                        stu_notif.save()

                    # 3. Push notification to CoursePass enrolled mobile users
                    dispatch_lecture_notification_webhook_sync(
                        course_id=session_obj.courseID,
                        session_id=session_obj.id,
                        title=student_title,
                        message=student_msg,
                        notification_type="lecture_reminder",
                        reminder_stage=stage_key,
                        slot=slot,
                        lecturer_name=primary_lecturer_name,
                        course_name=course_name,
                        enrolled_student_ids=enrolled_student_ids,
                    )

                    dispatched.append({
                        "session_id": session_obj.id,
                        "courseID": session_obj.courseID,
                        "stage": stage_key,
                        "start_time": start_time_str,
                        "day": slot_day,
                    })
                    logger.info(
                        f"Dispatched {stage_label} lecture reminder for {session_obj.courseID} ({slot_day} {start_time_str})"
                    )
    except Exception as exc:
        logger.error(f"Error in check_and_dispatch_lecture_reminders: {exc}")
    finally:
        try:
            storage.close()
        except Exception:
            pass

    return dispatched


def start_background_reminder_scheduler(app):
    """Start a lightweight daemon thread that checks lecture reminders every 60 seconds."""
    global _WORKER_STARTED
    with _WORKER_LOCK:
        if _WORKER_STARTED:
            return
        _WORKER_STARTED = True

    def _loop():
        time.sleep(5)
        while True:
            try:
                with app.app_context():
                    check_and_dispatch_lecture_reminders()
            except Exception as e:
                logger.warning(f"Lecture reminder scheduler loop warning: {e}")
            time.sleep(60)

    thread = threading.Thread(target=_loop, daemon=True, name="FacePassLectureReminderScheduler")
    thread.start()


try:
    from api.v1.celery import celery

    @celery.task(name="api.v1.utils.lecture_reminder_worker.run_lecture_reminder_task")
    def run_lecture_reminder_task():
        return check_and_dispatch_lecture_reminders()
except Exception:
    pass
