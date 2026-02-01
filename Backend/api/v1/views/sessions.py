#!/usr/bin/python3
""" objects that handle all default RestFul API actions for Users """
from models.university import University
from models.session import Sessions
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


@app_views.route('/session', methods=["POST"], strict_slashes=False)
@swag_from(join(dirname(__file__), 'documentation/university/post_uni.yml'))

def post_session():
    """
       regester university for student
    """
    if not request.get_json():
        abort(400, description="Not a JSON")
    data = request.get_json()
    requiredField = ["courseID", "session_name", "total_expected_classes"]
    for i in requiredField:
        if i not in data:
            return make_response(jsonify({"error": f"Missing required field {i}"}), 404)
    
    

    instance = Sessions(**data)
    instance.save()
   

    return make_response(jsonify({"message":"session created"}), 201)