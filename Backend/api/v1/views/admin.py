#!/usr/bin/python3
"""Admin API endpoints — role management"""
from models.user import User
from models import storage
from api.v1.views import app_views
from flask import jsonify, make_response, request
from flask_jwt_extended import jwt_required, get_jwt_identity
from api.v1.utils.roles import role_required


@app_views.route('/admin/assign-role', methods=["POST"], strict_slashes=False)
@jwt_required()
@role_required('admin')
def assign_role():
    """
    Assign a role to a user. Only admins can do this.
    Body: { "user_id": "...", "role": "lecturer" | "student" }
    """
    data = request.get_json()
    if not data:
        return make_response(jsonify({"error": "Not a JSON"}), 400)

    user_id = data.get("user_id")
    new_role = data.get("role")

    if not user_id or not new_role:
        return make_response(jsonify({"error": "Missing user_id or role"}), 400)

    if new_role not in ('student', 'lecturer'):
        return make_response(jsonify({"error": "Invalid role. Must be 'student' or 'lecturer'"}), 400)

    user = storage.get_id(User, user_id)
    if not user:
        return make_response(jsonify({"error": "User not found"}), 404)

    user.role = new_role
    user.save()

    return make_response(jsonify({
        "message": f"User {user.name} has been assigned the role '{new_role}'",
        "user_id": user.id,
        "role": user.role
    }), 200)


@app_views.route('/admin/users', methods=["GET"], strict_slashes=False)
@jwt_required()
@role_required('admin')
def admin_list_users():
    """
    List all users with their roles for admin management.
    Supports ?role=lecturer to filter by role.
    """
    ses = storage._DBStorage__session
    role_filter = request.args.get('role', None)

    query = ses.query(User)
    if role_filter:
        query = query.filter(User.role == role_filter)

    users = query.all()
    user_list = []
    for u in users:
        user_list.append({
            "id": u.id,
            "name": u.name,
            "email": u.email,
            "matric": u.matric,
            "role": u.role,
            "is_verified": u.is_verified
        })

    return make_response(jsonify({"data": user_list, "total": len(user_list)}), 200)
