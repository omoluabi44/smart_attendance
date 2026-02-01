from api.v1.views import app_views
from flask import jsonify, make_response, abort, request
from models import storage
from models.department import Department
from models.college import College
import os
from os.path import join, dirname
from flask_jwt_extended import  jwt_required
from flasgger.utils import swag_from

@app_views.route('/college/<college_id>/department', methods=['GET'], strict_slashes=False)
# @swag_from(join(dirname(__file__), 'documentation/outline/all_outline.yml'))
# @jwt_required()
def get_college_department(college_id):
    """
    Retrieves the list of all department for a specific college.
    """
    college = storage.get_id(College, college_id)
    if not college:
        abort(404)

    department_dict = [department.to_dict() for department in college.department if department.collegeID == college_id]
    return make_response(jsonify(department_dict), 200)
  


# Get a specific content by ID


@app_views.route('/department', methods=['POST'], strict_slashes=False)
# @swag_from(join(dirname(__file__), 'documentation/outline/post_outline.yml'))
# @jwt_required()
def post_department():
    """
    Creates new department for a specific College.
    """
    
    if not request.get_json():
        abort(400, description="Not a JSON")
    
    data = request.get_json()
    college_attributes = ['department', 'collegeID']
    for i in college_attributes:
        if i not in data:
            abort(400, description=f"missing - {i}")
    college_id = data.get('collegeID')

    college = storage.get_id(College, college_id)
    if not college:
         abort(404, description="college not found")
    instance = Department(**data)  
    instance.save()
  
    return make_response(jsonify(instance.to_dict()), 201)



# Update content
@app_views.route('/department/<department_id>', methods=['PUT'], strict_slashes=False)
# @swag_from(join(dirname(__file__), 'documentation/outline/update_outline.yml'))
# @jwt_required()
def put_department_id(department_id):
    """
    Updates existing department.
    """
    department = storage.get_id(Department, department_id)
    if not department:
        abort(404)
    if not request.get_json():
        abort(400, description="Not a JSON")
    
    data = request.get_json()
    ignore = ['id', 'course_id', 'created_at', 'updated_at']
    for key, value in data.items():
        if key not in ignore:
            setattr(department, key, value)
    department.save()
    return make_response(jsonify(department.to_dict()), 200)


# Delete content
@app_views.route('/department/<department_id>', methods=['DELETE'], strict_slashes=False)
# @swag_from(join(dirname(__file__), 'documentation/outline/del_outline.yml'))
# @jwt_required()
def delete_department(department_id):
    """
    Deletes Content by its ID.
    """
    department = storage.get_id(Department, department_id)
    if not department:
        abort(404)
    storage.delete(department)
    storage.save()
    return make_response(jsonify({}), 200)
