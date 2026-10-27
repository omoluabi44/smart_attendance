import boto3
import os
import logging

logger = logging.getLogger(__name__)


def _get_aws_client_kwargs():
    """Return boto3 client kwargs using env credentials if present, otherwise falling back to EC2 IAM Role."""
    region = os.getenv('AWS_DEFAULT_REGION') or os.getenv('AWS_REGION') or 'us-east-1'
    kwargs = {'region_name': region}
    access_key = os.getenv('AWS_ACCESS_KEY_ID', '').strip()
    secret_key = os.getenv('AWS_SECRET_ACCESS_KEY', '').strip()
    if access_key and secret_key:
        kwargs['aws_access_key_id'] = access_key
        kwargs['aws_secret_access_key'] = secret_key
    return kwargs


def get_rekognition_client():
    return boto3.client('rekognition', **_get_aws_client_kwargs())


def get_s3_client():
    return boto3.client('s3', **_get_aws_client_kwargs())


def ensure_session_collection(session_id: str):
    """Ensure a compartmentalized Rekognition collection exists for the session/course."""
    client = get_rekognition_client()
    collection_id = f"facepass_session_{session_id}"
    try:
        client.create_collection(CollectionId=collection_id)
        logger.info(f"Created Rekognition collection: {collection_id}")
    except client.exceptions.ResourceAlreadyExistsException:
        pass
    except Exception as e:
        logger.error(f"Error creating collection {collection_id}: {e}")
    return collection_id


def search_faces_and_detect_intruders(session_id: str, image_bytes: bytes, threshold: float = 85.0):
    """
    Search classroom image against course collection.
    Returns: (matched_face_ids, unregistered_alert, total_faces)
    """
    client = get_rekognition_client()
    collection_id = f"facepass_session_{session_id}"

    # Detect total faces in image
    total_faces = 0
    try:
        detect_res = client.detect_faces(Image={'Bytes': image_bytes})
        total_faces = len(detect_res.get('FaceDetails', []))
    except Exception as e:
        logger.error(f"Error detecting faces: {e}")
        return [], False, 0

    # Search against course collection
    matched_face_ids = []
    try:
        search_res = client.search_users_by_image(
            CollectionId=collection_id,
            Image={'Bytes': image_bytes},
            FaceMatchThreshold=threshold
        )
        for match in search_res.get('UserMatches', []):
            matched_face_ids.append(match['User']['UserId'])
    except client.exceptions.ResourceNotFoundException:
        logger.warning(f"Collection {collection_id} not found.")
    except Exception as e:
        logger.error(f"Error searching collection {collection_id}: {e}")

    # Detect intruders
    unregistered_alert = total_faces > len(matched_face_ids)

    return matched_face_ids, unregistered_alert, total_faces
