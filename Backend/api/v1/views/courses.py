from flask import abort, jsonify, make_response, request
from api.v1.views import app_views
from models import storage
from models.course import Courses

from os.path import join, dirname
from flask_jwt_extended import  jwt_required
from flasgger.utils import swag_from

from dotenv import load_dotenv
import os
import json
import re

session = storage._DBStorage__session
load_dotenv()



# @jwt_required()
@app_views.route('/courses', methods=['GET'], strict_slashes=False)
# @swag_from(join(dirname(__file__), 'documentation/courses/all_course.yml'))
@jwt_required()
def get_all_courses():
    """
    Retrieves the list of all Courses.
    """
    courses = session.query(Courses).all()

    course_dict = [course.to_dict() for course in courses ]
 
    return (course_dict)
@app_views.route('/courses/sitemap', methods=['GET'], strict_slashes=False)
def get_courses_sitemap():
    """
    Optimized endpoint for Sitemap Generation/Google Bot.
    Returns ONLY id and updated_at for ALL courses.
    Extremely lightweight.
    """
    # 1. Select ONLY the columns we need (Projection). 
    # This avoids loading the heavy 'description' or 'content' into RAM.
    results = session.query(Courses.courseID, Courses.updated_at).all()

    # 2. Return a lightweight list
    data = [
        {
            "slug": row.courseID.replace(" ", "-"), # Pre-format for URL
            "updated_at": row.updated_at
        } 
        for row in results
    ]
 
    return jsonify(data)










@app_views.route('/course', methods=['POST'], strict_slashes=False)
# @swag_from(join(dirname(__file__), 'documentation/courses/post_course.yml'))
# @jwt_required()
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
    return make_response(jsonify(course.to_dict()), 201)


# Update a course
@app_views.route('/course/<course_id>', methods=['PUT'], strict_slashes=False)
# @swag_from(join(dirname(__file__), 'documentation/courses/update_course.yml'))
# @jwt_required()
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
    return make_response(jsonify(course.to_dict()), 200)


# Delete a course
@app_views.route('/course/<course_id>', methods=['DELETE'], strict_slashes=False)
# @swag_from(join(dirname(__file__), 'documentation/courses/del_course.yml'))
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




