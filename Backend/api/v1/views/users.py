#!/usr/bin/python3
""" objects that handle all default RestFul API actions for Users """
from models.user import User
from models.profile import Profile
from models import storage
import random
from api.v1.views import app_views
from flask import abort, jsonify, make_response, request
from flasgger.utils import swag_from
from flask_jwt_extended import create_access_token,  create_refresh_token, jwt_required, get_jwt_identity
from flask_mail import Mail, Message
from os import environ
from os.path import join, dirname
from datetime import datetime, timedelta

from werkzeug.utils import secure_filename

import logging
logger = logging.getLogger(__name__)


ses = storage._DBStorage__session
@app_views.route('/users', methods=["GET"], strict_slashes=False)
@swag_from(join(dirname(__file__), 'documentation/user/all_users.yml'))
@jwt_required()

def get_users():
    """
    retrieve  all user object
    """
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 50, type=int)
    
    if per_page > 100:
        per_page = 100
        
    total_users = ses.query(User).count()
    offset = (page - 1) * per_page
    users = ses.query(User).offset(offset).limit(per_page).all() 

    list_users = []
    for user in users:
        list_users.append({
           "id": user.id, "email":user.email, "username":user.username
        }
            )
        
    response = {
        "data": list_users,
        "pagination":{
            "page": page, 
            "per_page": per_page,
            "total": total_users,
            "total page": (total_users + per_page - 1) // per_page 
        }
    }
    return jsonify(response)





def get_user_from_db(user_id):
    """
    this function cached user profile using memoization
    """
    user= storage.get_id(User, user_id)
    # profile= storage.get_id(Profile, user_id)

    if not user:
          abort(404)
    user_dict = user.to_dict()
 
    if user.university:
        user_dict["university"] = user.university.to_dict()
    else:
        user_dict["university"] = None
    
    return (user_dict)  

@app_views.route('/user/<user_id>', methods=["GET"], strict_slashes=False)
@swag_from(join(dirname(__file__), 'documentation/user/get_user.yml'))
# @jwt_required()
def get_user(user_id):
    """
    retrieve  specific  user object using id
    """
    user = get_user_from_db(user_id)
   
    if not user:
        logger.warning("User lookup failed", extra={
            'event': 'user_not_found',
            'target_user_id': user_id,
            'ip_address': request.remote_addr,
            'status': 404
        })
        make_response(jsonify({"error":"user not found"}),200)
    logger.info("User retrieved successfully", extra={
        'event': 'user_retrieved',
        'target_user_id': user_id,
        'user_email':"none", 
        'ip_address': request.remote_addr,
        'status': 200
    })
    return make_response(jsonify(user),200)



@app_views.route('/user/<user_id>', methods=['PUT'], strict_slashes=False)
@swag_from(join(dirname(__file__), 'documentation/user/put_user.yml'), methods=['PUT','OPTION'])
# @jwt_required()
def update_user(user_id):
    """
    Updates an existing user.
    """
    user = storage.get_id(User, user_id)

    if not user:
        return make_response(jsonify({"error": "user doesnt exists"}), 404)  

    if not request.get_json():
        abort(400, description="Not a JSON")

    data = request.get_json()
 
    ignore = ['id', 'created_at', 'updated_at', 'university','profile','providers','role']
   
    for key, value in data.items():
        if key not in ignore:
            setattr(user, key, value)
  
   
    # Update nested university fields if present
    
    if "university" in data:
        university_data = data["university"]
        university = user.university
        if not university:
            make_response(jsonify({"error":"university not found"}, 404))
        for key, value in university_data.items():
            if key not in ignore:
                setattr(university, key, value)
    if "profile" in data:
        profile_data = data["profile"]
        profile = user.profile
        if not profile:
            profile = Profile(userID=user.id)  
            profile.save()
            user.profile = profile
        for key, value in profile_data.items():
            if key not in ignore:
                setattr(profile, key, value)

    # Update streak if present
    if "streak" in data:
        streak_data = data["streak"]

        # user.streak is a list, not a single object
        if not user.streak or len(user.streak) == 0:
            abort(404, description="streak not found")

        streak = user.streak[0]  # Assuming one streak per user
        for key, value in streak_data.items():
            if key not in ignore:
                setattr(streak, key, value)
    # if "password" in data:
    #     local_provider = next((p for p in user.providers if p.provider == "Local"), None)
    #     if local_provider:
    #         local_provider.password = self._hash_password(data["password"])
    #     else:
    #         abort(404, description="Local provider not found for this user")
    if "providers" in data:
        provider_data = data["providers"]

        # find the Local provider for this user
        local_provider = next((p for p in user.providers ), None)
        if not local_provider:
            return make_response(jsonify({"error": "Local provider not found for this user"}), 400)     

        for key, value in provider_data.items():
            if key == "password":
                # hash before updating
           
                local_provider.password = local_provider._hash_password(value)
              
            else:
                setattr(local_provider, key, value)

   
    user.save()

  

    return make_response(jsonify({"message":"Update Successful!"}, 200))

@app_views.route('/user/<user_id>', methods=['DELETE'], strict_slashes=False)
@swag_from(join(dirname(__file__), 'documentation/user/delete_user.yml'))
@jwt_required()
def del_user(user_id):
    """
    Deletes user by its ID.
    """
    user = storage.get_id(User, user_id)

    if not user:
        abort(404)
    storage.delete(user)
    storage.save()
    return make_response(jsonify({}), 200)

@app_views.route('/user/<user_id>/balance', methods=['GET'], strict_slashes=False)
@swag_from(join(dirname(__file__), 'documentation/user/delete_user.yml'))
@jwt_required()
def Balance(user_id):
   
    user = storage.get_id(User, user_id)

   
    return make_response(jsonify({"balance":user.amount}), 200)


  


