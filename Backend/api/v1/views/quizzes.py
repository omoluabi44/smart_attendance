from flask import request, jsonify, make_response
from flask_jwt_extended import jwt_required, get_jwt_identity
from models import storage
from models.quiz import Quiz, QuizResult
from api.v1.views import app_views
from api.v1.utils.roles import role_required
from datetime import datetime
import os

SERVICE_SECRET = os.getenv('COURSEPASS_SERVICE_SECRET', 'facepass_coursepass_secret')

@app_views.route('/lecturer/sessions/<session_id>/quizzes', methods=['GET'], strict_slashes=False)
@jwt_required()
def get_quizzes(session_id):
    """Get all quizzes for a session."""
    quizzes = storage._DBStorage__session.query(Quiz).filter_by(session_id=session_id).all()
    return jsonify([
        {
            "id": quiz.id,
            "title": quiz.title,
            "scheduled_at": quiz.scheduled_at,
            "duration_minutes": quiz.duration_minutes,
            "is_graded": quiz.is_graded,
            "status": quiz.status,
            "created_at": quiz.created_at
        } for quiz in quizzes
    ]), 200

@app_views.route('/lecturer/sessions/<session_id>/quizzes', methods=['POST'], strict_slashes=False)
@jwt_required()
@role_required('lecturer')
def create_quiz(session_id):
    """Create a new quiz."""
    data = request.get_json()
    if not data or 'title' not in data:
        return make_response(jsonify({"error": "Missing required fields"}), 400)
    
    new_quiz = Quiz(
        session_id=session_id,
        title=data['title'],
        duration_minutes=data.get('duration_minutes', 30),
        is_graded=data.get('is_graded', True),
        status='scheduled'
    )
    
    if 'scheduled_at' in data and data['scheduled_at']:
        # Basic parsing, assume ISO format or adjust as needed
        try:
            new_quiz.scheduled_at = datetime.fromisoformat(data['scheduled_at'].replace('Z', '+00:00'))
        except Exception:
            pass
            
    storage.new(new_quiz)
    storage.save()
    
    return jsonify({"message": "Quiz created successfully", "id": new_quiz.id}), 201

@app_views.route('/integrations/coursepass/quiz-results', methods=['POST'], strict_slashes=False)
def sync_quiz_results():
    """Inbound endpoint: Sync student quiz grades from CoursePass."""
    api_key = request.headers.get('X-API-Key')
    if api_key != SERVICE_SECRET:
        return make_response(jsonify({"error": "Unauthorized service request"}), 401)
    
    data = request.get_json()
    if not data or 'quiz_id' not in data or 'student_id' not in data or 'score' not in data:
        return make_response(jsonify({"error": "Missing required fields"}), 400)
    
    quiz_id = data['quiz_id']
    student_id = data['student_id']
    score = data['score']
    
    # Check if quiz exists
    quiz = storage.get_id(Quiz, quiz_id)
    if not quiz:
        return make_response(jsonify({"error": "Quiz not found"}), 404)
        
    result = storage._DBStorage__session.query(QuizResult).filter_by(
        quiz_id=quiz_id, user_id=student_id
    ).first()
    
    if result:
        result.score = score
    else:
        result = QuizResult(quiz_id=quiz_id, user_id=student_id, score=score, total_score=data.get('total_score', 100))
        storage.new(result)
        
    storage.save()
    return jsonify({"message": "Quiz result synced successfully"}), 200

@app_views.route('/lecturer/sessions/<session_id>/quizzes/<quiz_id>/analytics', methods=['GET'], strict_slashes=False)
@jwt_required()
@role_required('lecturer')
def quiz_analytics(session_id, quiz_id):
    quiz = storage.get_id(Quiz, quiz_id)
    if not quiz or quiz.session_id != session_id:
        return make_response(jsonify({"error": "Quiz not found"}), 404)
        
    results = storage._DBStorage__session.query(QuizResult).filter_by(quiz_id=quiz_id).all()
    scores = [r.score for r in results]
    
    avg_score = sum(scores) / len(scores) if scores else 0
    return jsonify({
        "quiz_title": quiz.title,
        "total_submissions": len(scores),
        "average_score": avg_score,
        "results": [{"student_id": r.user_id, "score": r.score, "total_score": r.total_score} for r in results]
    }), 200
