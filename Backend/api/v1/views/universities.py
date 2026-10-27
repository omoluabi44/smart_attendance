from api.v1.views import app_views
from flask import jsonify, make_response, abort, request
from models import storage
from models.universities import Universities
from api.v1.utils.webhook_dispatcher import fetch_coursepass_api
import os
from os.path import join, dirname
from flask_jwt_extended import jwt_required
from flasgger.utils import swag_from


@app_views.route('/universities', methods=['GET'], strict_slashes=False)
def get_universities():
    """
    Retrieves the list of all universities from CoursePass API (with local DB fallback).
    """
    remote_data = fetch_coursepass_api('/api/v1/universities')
    if isinstance(remote_data, list):
        return make_response(jsonify(remote_data), 200)

    courses = storage.all(Universities).values()
    return make_response(jsonify([course.to_dict() for course in courses]), 200)


@app_views.route('/universities', methods=['POST'], strict_slashes=False)
def post_universities():
    """
    Creates new university.
    """
    if not request.get_json():
        abort(400, description="Not a JSON")

    data = request.get_json()
    if "university" not in data:
        abort(400, description="missing university")

    instance = Universities(**data)
    instance.save()

    return make_response(jsonify(instance.to_dict()), 201)


@app_views.route('/universities/<universities_id>', methods=['PUT'], strict_slashes=False)
def put_Universities(universities_id):
    """
    Updates existing University.
    """
    university = storage.get_id(Universities, universities_id)
    if not university:
        abort(404)
    if not request.get_json():
        abort(400, description="Not a JSON")

    data = request.get_json()
    ignore = ['id', 'course_id', 'created_at', 'updated_at']
    for key, value in data.items():
        if key not in ignore:
            setattr(university, key, value)
    university.save()
    return make_response(jsonify(university.to_dict()), 200)


@app_views.route('/universities/<universities_id>', methods=['DELETE'], strict_slashes=False)
def delete_university(universities_id):
    """
    Deletes University by its ID.
    """
    university = storage.get_id(Universities, universities_id)
    if not university:
        abort(404)
    storage.delete(university)
    storage.save()
    return make_response(jsonify({}), 200)
