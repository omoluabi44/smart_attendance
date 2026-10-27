from api.v1.views import app_views
from flask import jsonify, make_response, abort, request
from models import storage
from models.universities import Universities
from models.college import College
from api.v1.utils.webhook_dispatcher import fetch_coursepass_api
import os
from os.path import join, dirname
from flask_jwt_extended import jwt_required
from flasgger.utils import swag_from


@app_views.route('/universities/<universities_id>/college', methods=['GET'], strict_slashes=False)
def get_universities_college(universities_id):
    """
    Retrieves the list of all colleges for a specific university from CoursePass API (with local DB fallback).
    """
    remote_data = fetch_coursepass_api(f'/api/v1/universities/{universities_id}/college')
    if isinstance(remote_data, list):
        return make_response(jsonify(remote_data), 200)

    university = storage.get_id(Universities, universities_id)
    if not university:
        abort(404)

    college_dict = [college.to_dict() for college in university.college if college.universityID == universities_id]
    return make_response(jsonify(college_dict), 200)


@app_views.route('/college', methods=['POST'], strict_slashes=False)
def post_college():
    """
    Creates new college for a specific University.
    """
    if not request.get_json():
        abort(400, description="Not a JSON")

    data = request.get_json()
    college_attributes = ['college', 'universityID']
    for i in college_attributes:
        if i not in data:
            abort(400, description=f"missing - {i}")
    university_id = data.get('universityID')

    university = storage.get_id(Universities, university_id)
    if not university:
        abort(404, description="university not found")
    instance = College(**data)
    instance.save()

    return make_response(jsonify(instance.to_dict()), 201)


@app_views.route('/college/<college_id>', methods=['PUT'], strict_slashes=False)
def put_college_id(college_id):
    """
    Updates existing College.
    """
    college = storage.get_id(College, college_id)
    if not college:
        abort(404)
    if not request.get_json():
        abort(400, description="Not a JSON")

    data = request.get_json()
    ignore = ['id', 'course_id', 'created_at', 'updated_at']
    for key, value in data.items():
        if key not in ignore:
            setattr(college, key, value)
    college.save()
    return make_response(jsonify(college.to_dict()), 200)


@app_views.route('/college/<college_id>', methods=['DELETE'], strict_slashes=False)
def delete_college(college_id):
    """
    Deletes College by its ID.
    """
    college = storage.get_id(College, college_id)
    if not college:
        abort(404)
    storage.delete(college)
    storage.save()
    return make_response(jsonify({}), 200)
