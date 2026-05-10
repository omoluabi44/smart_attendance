#!/usr/bin/env python3
"""Role-based access control decorators for the API"""
from functools import wraps
from flask import jsonify, make_response
from flask_jwt_extended import get_jwt_identity, jwt_required
from models import storage
from models.user import User


def role_required(*allowed_roles):
    """
    Decorator that checks if the authenticated user has one of the allowed roles.
    Must be used AFTER @jwt_required().
    
    Usage:
        @jwt_required()
        @role_required('admin')
        def admin_only_route():
            ...
        
        @jwt_required()
        @role_required('lecturer', 'admin')
        def lecturer_or_admin_route():
            ...
    """
    def decorator(fn):
        @wraps(fn)
        def wrapper(*args, **kwargs):
            user_id = get_jwt_identity()
            user = storage.get_id(User, user_id)
            if not user:
                return make_response(jsonify({"error": "User not found"}), 404)
            if user.role not in allowed_roles:
                return make_response(jsonify({
                    "error": f"Access denied. Required role: {' or '.join(allowed_roles)}"
                }), 403)
            return fn(*args, **kwargs)
        return wrapper
    return decorator


def admin_required():
    """Shortcut decorator: requires admin role"""
    return role_required('admin')


def lecturer_required():
    """Shortcut decorator: requires lecturer or admin role"""
    return role_required('lecturer', 'admin')
