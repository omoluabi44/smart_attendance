#!/usr/bin/python3
""" objects that handle all default RestFul API actions for Users """
from models.university import University
from models.user import User
from models import storage
import random
from api.v1.views import app_views
from flask import abort, jsonify, make_response, request
from flasgger.utils import swag_from
from flask_mail import Mail, Message
from os import environ
from datetime import datetime, timedelta
from flask_jwt_extended import jwt_required
from os.path import join, dirname


@app_views.route('auth/university/<user_id>', methods=["POST"], strict_slashes=False)
@swag_from(join(dirname(__file__), 'documentation/university/post_uni.yml'))

def post_university(user_id):
    """
       regester university for student
    """
    if not request.get_json():
        abort(400, description="Not a JSON")
    data = request.get_json()
    requiredField = ["university", "College", "department", "level"]
    for i in requiredField:
        if i not in data:
            abort(400, description=f"Missing {i}")
            return make_response(jsonify({"error": f"Missing required field {i}"}), 404)
    
    user = storage.get_id(User, user_id)
    if user.university:
        return make_response(jsonify({"error": "User already has a university assigned"}), 400)

    instance = University(**data)
    instance.save()
   
    if not user:
        abort(404)
    user.university = instance
    user.save()

    return make_response(jsonify({"message":"university Profile created succesfully"}), 201)
@app_views.route('/university/<university_id>', methods=['DELETE'], strict_slashes=False)
@swag_from(join(dirname(__file__), 'documentation/user/delete_user.yml'))
# @jwt_required()
def del_uni(university_id):
    """
    Deletes user by its ID.
    """
    university = storage.get_id(University, university_id)
    if not university:
        abort(404)
    storage.delete(university)
    storage.save()
    return make_response(jsonify({}), 200)