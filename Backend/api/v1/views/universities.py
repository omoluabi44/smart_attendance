from api.v1.views import app_views
from flask import jsonify, make_response, abort, request
from models import storage
from models.universities import Universities
import os
from os.path import join, dirname
from flask_jwt_extended import  jwt_required
from flasgger.utils import swag_from



@app_views.route('/universities', methods=['GET'], strict_slashes=False)
# @swag_from(join(dirname(__file__), 'documentation/note/all_note.yml'))
# @jwt_required()
def get_universities():
    """
    Retrieves the list of all universities.
    """
    courses = storage.all(Universities).values()
    return make_response(jsonify([course.to_dict() for course in courses]),200)

@app_views.route('/universities', methods=['POST'], strict_slashes=False)
# @swag_from(join(dirname(__file__), 'documentation/note/post_note.yml'))
# @jwt_required()
def post_universities():
    """
    Creates new note for a specific outline.
    """

    if not request.get_json():
        abort(400, description="Not a JSON")
    
    data = request.get_json()
    # note_attributes = ['content', 'outlineID', 'orderID']
    # for i in note_attributes:
    if "university" not in data:
        abort(400, description="missing university")

    
    instance = Universities(**data)  
    instance.save()
  
    return make_response(jsonify(instance.to_dict()), 201)



# Update content
@app_views.route('/universities/<universities_id>', methods=['PUT'], strict_slashes=False)
# @swag_from(join(dirname(__file__), 'documentation/note/update_note.yml'))
# @jwt_required()
def put_Universities(universities_id):
    """
    Updates existing Content.
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


# Delete content
@app_views.route('/universities/<universities_id>', methods=['DELETE'], strict_slashes=False)
# @swag_from(join(dirname(__file__), 'documentation/note/del_note.yml'))
# @jwt_required()
def delete_university(universities_id):
    """
    Deletes Content by its ID.
    """
    university = storage.get_id(Universities, universities_id)
    if not university:
        abort(404)
    storage.delete(university)
    storage.save()
    return make_response(jsonify({}), 200)
