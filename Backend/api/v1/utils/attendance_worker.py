import io
import os
import logging
from PIL import Image
from datetime import datetime
from api.v1.celery import celery
from models import storage
from models.session import Sessions
from api.v1.utils.rekognition_utils import get_rekognition_client, get_s3_client, ensure_session_collection
from api.v1.utils.webhook_dispatcher import dispatch_attendance_webhook

logger = logging.getLogger(__name__)
rekognition = get_rekognition_client()
s3_client = get_s3_client()
BUCKET_NAME = os.getenv('AWS_S3_BUCKET_NAME', 'facepass-file')

@celery.task(bind=True, max_retries=3, default_retry_delay=5)
def process_attendance_image_task(self, session_id, lecturer_id, s3_key):
    """
    Background task to process a group photo for attendance.
    """
    # Local import to avoid circular dependency
    from api.v1.views.attendance import update_student_record
    
    try:
        logger.info(f"Starting image attendance task for session {session_id}, s3_key {s3_key}")
        
        session_obj = storage.get_id(Sessions, session_id)
        if not session_obj:
            raise ValueError(f"Session {session_id} not found")

        s3_object = s3_client.get_object(Bucket=BUCKET_NAME, Key=s3_key)
        image_bytes = s3_object['Body'].read()

        detection_response = rekognition.detect_faces(
            Image={'Bytes': image_bytes},
            Attributes=['DEFAULT']
        )

        img = Image.open(io.BytesIO(image_bytes))
        width, height = img.size

        all_results = []
        best_matches = {}
        MIN_FACE_PIXELS = 55
        qualifying_faces_count = 0
        low_resolution_faces_count = 0

        for faceDetail in detection_response.get('FaceDetails', []):
            box = faceDetail['BoundingBox']
            left = width * box['Left']
            top = height * box['Top']
            face_w = width * box['Width']
            face_h = height * box['Height']
            right = left + face_w
            bottom = top + face_h

            if round(face_w) < MIN_FACE_PIXELS or round(face_h) < MIN_FACE_PIXELS:
                low_resolution_faces_count += 1
            else:
                qualifying_faces_count += 1

            face_crop = img.crop((left, top, right, bottom))
            stream = io.BytesIO()
            face_crop.save(stream, format="JPEG")
            crop_bytes = stream.getvalue()

            try:
                collection_id = ensure_session_collection(session_id)
                search_response = rekognition.search_users_by_image(
                    CollectionId=collection_id,
                    Image={'Bytes': crop_bytes},
                    MaxUsers=1,
                    UserMatchThreshold=85
                )
                matches = search_response.get('UserMatches', [])
                if matches:
                    user_id = matches[0]['User'].get('UserId')
                    confidence = matches[0].get('Similarity', 0)
                    if user_id and (user_id not in best_matches or confidence > best_matches[user_id]):
                        best_matches[user_id] = confidence
            except Exception as e:
                logger.error(f"Error searching face: {e}")
                continue

        unique_results = [
            {"user_id": uid, "confidence": conf}
            for uid, conf in best_matches.items()
        ]

        record_result = update_student_record(unique_results, session_id=session_id, lecturer_id=lecturer_id)

        present_ids = [res['user_id'] for res in unique_results]
        date_str = datetime.utcnow().strftime('%Y-%m-%d')
        dispatch_attendance_webhook(session_id, session_obj.courseID, date_str, present_ids, [])

        total_faces = len(detection_response.get('FaceDetails', []))
        recognized_count = len(unique_results)
        effective_faces_for_alert = qualifying_faces_count if qualifying_faces_count > 0 else total_faces
        unregistered_alert = effective_faces_for_alert > recognized_count

        result = {
            "status": "complete",
            "total_faces_detected": total_faces,
            "qualifying_faces_count": qualifying_faces_count,
            "low_resolution_faces_count": low_resolution_faces_count,
            "unique_faces_recognized": len(unique_results),
            "new_records": record_result.get("recognized_count", 0),
            "skipped_already_recorded": record_result.get("skipped_count", 0),
            "skipped_students": record_result.get("skipped_users", []),
            "unregistered_alert": unregistered_alert,
            "marked_present_count": record_result.get("recognized_count", 0),
            "already_marked_today_count": record_result.get("skipped_count", 0),
            "unmatched_faces_count": effective_faces_for_alert - recognized_count if effective_faces_for_alert > recognized_count else 0
        }
        
        logger.info(f"Image attendance task complete: {result}")
        return result

    except Exception as exc:
        logger.error(f"Image attendance processing failed: {exc}")
        raise self.retry(exc=exc)
