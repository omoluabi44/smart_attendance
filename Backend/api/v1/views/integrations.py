from flask import Blueprint, request, jsonify, make_response
from models import storage
from models.session_enrollment import SessionEnrollment
from api.v1.utils.rekognition_utils import ensure_session_collection
from api.v1.views import app_views
import os

SERVICE_SECRET = os.getenv('COURSEPASS_SERVICE_SECRET', 'facepass_coursepass_secret')

@app_views.route('/integrations/coursepass/sync-roster', methods=['POST'], strict_slashes=False)
def sync_coursepass_roster():
    """Inbound endpoint: Sync student profile & Face ID from CoursePass."""
    api_key = request.headers.get('X-API-Key')
    if api_key != SERVICE_SECRET:
        return make_response(jsonify({"error": "Unauthorized service request"}), 401)
    
    data = request.get_json()
    if not data or 'session_id' not in data or 'student_id' not in data:
        return make_response(jsonify({"error": "Missing required fields"}), 400)
    
    session_id = data['session_id']
    student_id = data['student_id']
    
    # Ensure enrollment record
    existing = storage._DBStorage__session.query(SessionEnrollment).filter_by(
        session_id=session_id, user_id=student_id
    ).first()
    
    if not existing:
        new_enrollment = SessionEnrollment(session_id=session_id, user_id=student_id)
        storage.new(new_enrollment)
        storage.save()
        
    ensure_session_collection(session_id)
    return jsonify({"message": "Student synced successfully to FacePass roster", "session_id": session_id}), 200
