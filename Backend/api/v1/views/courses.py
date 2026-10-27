from flask import abort, jsonify, make_response, request
from api.v1.views import app_views
from models import storage
from models.course import Courses
from os.path import join, dirname
from flask_jwt_extended import jwt_required
from flasgger.utils import swag_from
from dotenv import load_dotenv
import os
import json
import re
from api.v1.utils.webhook_dispatcher import dispatch_course_config_webhook, fetch_coursepass_api

session = storage._DBStorage__session
load_dotenv()


@app_views.route('/courses', methods=['GET'], strict_slashes=False)
@jwt_required()
def get_all_courses():
    """
    Retrieves the list of all Courses from CoursePass API (with local DB fallback).
    """
    remote_courses = fetch_coursepass_api('/api/v1/courses', params={'per_page': 500})
    if isinstance(remote_courses, list) and len(remote_courses) > 0:
        return jsonify(remote_courses)

    courses = session.query(Courses).all()
    course_dict = [course.to_dict() for course in courses]
    return jsonify(course_dict)


@app_views.route('/courses/sitemap', methods=['GET'], strict_slashes=False)
def get_courses_sitemap():
    """
    Optimized endpoint for Sitemap Generation/Google Bot.
    Returns ONLY id and updated_at for ALL courses.
    """
    results = session.query(Courses.courseID, Courses.updated_at).all()
    data = [
        {
            "slug": row.courseID.replace(" ", "-"),
            "updated_at": row.updated_at
        }
        for row in results
    ]
    return jsonify(data)


@app_views.route('/course', methods=['POST'], strict_slashes=False)
def post_course():
    """
    Creates a new Course.
    """
    if not request.get_json():
        abort(400, description="Not a JSON")

    data = request.get_json()
    requiredField = ["courseID", "courseName"]
    for i in requiredField:
        if i not in data:
            abort(400, description=f"Missing {i}")

    course = Courses(**data)
    course.save()
    dispatch_course_config_webhook(course.id, data.get('total_classes', 13), data.get('academic_session', '2026/2027'))
    return make_response(jsonify(course.to_dict()), 201)


@app_views.route('/course/<course_id>', methods=['PUT'], strict_slashes=False)
def put_course(course_id):
    """
    Updates an existing Course.
    """
    course = storage.get_id(Courses, course_id)
    if not course:
        abort(404)
    if not request.get_json():
        abort(400, description="Not a JSON")

    data = request.get_json()
    ignore = ['id', 'created_at', 'updated_at']
    for key, value in data.items():
        if key not in ignore:
            setattr(course, key, value)
    course.save()
    total_classes = getattr(course, 'total_classes', 13)
    academic_session = getattr(course, 'academic_session', '2026/2027')
    dispatch_course_config_webhook(course.id, total_classes, academic_session)
    return make_response(jsonify(course.to_dict()), 200)


@app_views.route('/course/<course_id>', methods=['DELETE'], strict_slashes=False)
@jwt_required()
def delete_course(course_id):
    """
    Deletes a Course by its ID.
    """
    course = storage.get_id(Courses, course_id)
    if not course:
        abort(404)
    storage.delete(course)
    storage.save()
    return make_response(jsonify({}), 200)
