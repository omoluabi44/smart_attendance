from flask import request, jsonify, make_response
from flask_jwt_extended import jwt_required, get_jwt_identity
from models import storage
from models.course_material import CourseMaterial
from api.v1.views import app_views
from api.v1.utils.roles import role_required
from api.v1.utils.webhook_dispatcher import dispatch_material_webhook
from models.session import Sessions

@app_views.route('/lecturer/sessions/<session_id>/materials', methods=['GET'], strict_slashes=False)
@jwt_required()
def get_materials(session_id):
    """Get all materials for a session."""
    materials = storage._DBStorage__session.query(CourseMaterial).filter_by(session_id=session_id).all()
    return jsonify([
        {
            "id": mat.id,
            "title": mat.title,
            "description": mat.description,
            "material_type": mat.material_type,
            "file_url": mat.file_url,
            "uploaded_by": mat.uploaded_by,
            "created_at": mat.created_at
        } for mat in materials
    ]), 200

@app_views.route('/lecturer/sessions/<session_id>/materials', methods=['POST'], strict_slashes=False)
@jwt_required()
@role_required('lecturer')
def add_material(session_id):
    """Add a new course material."""
    data = request.get_json()
    if not data or 'title' not in data or 'material_type' not in data:
        return make_response(jsonify({"error": "Missing required fields"}), 400)
    
    user_id = get_jwt_identity()
    new_material = CourseMaterial(
        session_id=session_id,
        title=data['title'],
        description=data.get('description'),
        material_type=data['material_type'],
        file_url=data.get('file_url'),
        uploaded_by=user_id
    )
    storage.new(new_material)
    storage.save()
    
    session_obj = storage.get_id(Sessions, session_id)
    if session_obj:
        dispatch_material_webhook(session_obj.courseID, new_material.id, new_material.title, new_material.material_type, new_material.file_url or '')

    return jsonify({"message": "Material added successfully", "id": new_material.id}), 201

@app_views.route('/lecturer/sessions/<session_id>/materials/<material_id>', methods=['DELETE'], strict_slashes=False)
@jwt_required()
@role_required('lecturer')
def delete_material(session_id, material_id):
    """Delete a course material."""
    material = storage.get_id(CourseMaterial, material_id)
    if not material or material.session_id != session_id:
        return make_response(jsonify({"error": "Material not found"}), 404)
        
    storage.delete(material)
    storage.save()
    return jsonify({"message": "Material deleted successfully"}), 200
