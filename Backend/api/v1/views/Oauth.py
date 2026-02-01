"""  authentication API actions for Users """
from models.user import User
from models.profile import Profile
from models import storage
import random
# from api.v1.app import google
from api.v1.views import app_views
from api.v1.oauth_client import google
from api.v1.oauth_client import facebook
from flask import abort, jsonify, make_response, request, url_for, redirect
from os import environ
from os.path import join, dirname
from datetime import datetime, timedelta
from ..utils.login_helper import Login_helper
import time
from flask import current_app




session = storage._DBStorage__session
frontend_url = "https://coursepass.app/redirect"
login = "https://coursepass.app/login"
start_time = time.time()
# ----------- GOOGLE IMPLEMENTATION ----------

@app_views.route('/auth/google/login', methods=["GET"], strict_slashes=False)
def google_login():
    
    
    try:
        
        redirect_url = url_for('app_views.google_authorize', _external=True,_scheme='https')
        current_app.logger.info(f"Generated redirect_url: {redirect_url} in {time.time() - start_time:.2f}s")
        responses = google.authorize_redirect(redirect_url)
        current_app.logger.info(f"Redirecting to Google in {time.time() - start_time:.2f}s")
        return responses
    except Exception as e:
        return(f"an error occurer: {e}")
        
@app_views.route('/auth/google/callback', methods=["GET"], strict_slashes=False)
def google_authorize():
    current_app.logger.info("Starting /auth/google/callback")
    try:
        if 'error' in request.args:
            current_app.logger.error(f"Google OAuth error: {request.args['error']}")
            return jsonify({"error": request.args['error']}), 400
        
        token = google.authorize_access_token()
        current_app.logger.info(f"Got access token in {time.time() - start_time:.2f}s")  
        userinfo = token.get("userinfo")
        
        if not userinfo:
            return jsonify({"error": "Failed to retrieve user info"}), 400
        
        email = userinfo["email"] 
        Fname = userinfo.get("given_name", None)
        Lname = userinfo.get("family_name", None)
        profile_image = userinfo.get("picture", "")
        provider = "Google"   
        provider_id = userinfo["sub"]

        #save user infor saperately
        user_info = {
            "profile_image":profile_image, "Lname":Lname,"Fname":Fname
        }
        access_token, refresh_token, is_new, user_id =  Login_helper(email, provider, provider_id, user_info)
        response = make_response(redirect(frontend_url))
        
        response.set_cookie(
            "access_token",
            access_token,
            httponly=True,
            secure=False,  
            samesite="Lax",
            max_age=3600
        )
        response.set_cookie(
            "refresh_token",
            refresh_token,
            httponly=True,
            secure=False,  
            samesite="Lax",
             max_age=7 * 24 * 3600
        )
        response.set_cookie(
            "is_new",
            str(is_new),
            httponly=True,
            secure=False,  
            samesite="Lax",
             max_age=7 * 24 * 3600
        )
        response.set_cookie(
            "user_id",
            user_id,
            httponly=True,
            secure=False,  
            samesite="Lax",
             max_age=7 * 24 * 3600
        )
        
        return(response)
   
    except Exception as e:
        return(redirect(login))
    
    
    
    
# ----------- FACEBOOK IMPLEMENTATION ----------
@app_views.route("auth/facebook/login")
def login_facebook():
    try:
        
        redirect_uri = url_for("app_views.facebook_authorize", _external=True,_scheme='https')
        return facebook.authorize_redirect(redirect_uri)
    except Exception as e:
        return(f"an error occurer: {e}")

@app_views.route("/auth/facebook/callback")
def facebook_authorize():
    try:
        token = facebook.authorize_access_token()
        userinfo = facebook.get("me?fields=id,name,email,picture{url}").json()
        
        if not userinfo:
            return jsonify({"error": "Failed to retrieve user info"}), 400
 
        email = userinfo["email"] 
        full_name = userinfo["name"].split(" ")
        Fname = full_name[0]
        Lname = full_name[1]
        profile_image = userinfo["picture"]["data"]["url"]
        provider = "Facebook"   
        provider_id = userinfo["id"]
     
        #save user infor saperately
        user_info = {
            "profile_image":profile_image, "Lname":Lname,"Fname":Fname
        }
        access_token, refresh_token, is_new,user_id =  Login_helper(email, provider, provider_id, user_info)
        response = make_response(redirect(frontend_url))
        
        response.set_cookie(
            "access_token",
            access_token,
            httponly=True,
            secure=False,  
            samesite="Lax",
            max_age=3600
        )
        response.set_cookie(
            "refresh_token",
            refresh_token,
            httponly=True,
            secure=False,  
            samesite="Lax",
             max_age=7 * 24 * 3600
        )
        response.set_cookie(
            "is_new",
            str(is_new),
            httponly=True,
            secure=False,  
            samesite="Lax",
             max_age=7 * 24 * 3600
        )
        response.set_cookie(
            "user_id",
            user_id,
            httponly=True,
            secure=False,  
            samesite="Lax",
             max_age=7 * 24 * 3600
        )
        
        return(response)
    except Exception as e:
        # return(redirect(login))
        return e

    
@app_views.route('/auth/session', methods=["GET"], strict_slashes=False)
def get_session_info():
    # try:
    access_token = request.cookies.get("access_token")
    refresh_token = request.cookies.get("refresh_token")
    user_id = request.cookies.get("user_id")
    is_new = request.cookies.get("is_new") == "True"

    if not access_token or not refresh_token or not user_id:
        return jsonify({"error": "No session data found"}), 401
    user = storage.get_id(User, user_id)
    #user = session.query(User.id, User.email, User.username).filter(User.id == user_id).first()
    profile = session.query(Profile.profile_image, Profile.Lname, Profile.Fname).filter(Profile.userID == user_id).first()

    if not user:
        return make_response(jsonify({"error": "user not found"}), 404)
    if not profile:

        user_details = {
            "tokens": {"access": access_token, "refresh_token_cookie":refresh_token},
            "user": {
                "id": user.id,
                "username": user.username,
                "email": user.email
                },
            "is_new":True
        }
        response = make_response(jsonify(user_details))
        
        response.set_cookie(
        'refresh_token_cookie',
        value=refresh_token,
        httponly=True,
        secure=False,
        samesite='Lax',
        max_age=7 * 24 * 3600 # 7 days
        )
    
        return response, 200

    user_details = {
            "tokens": {"access": access_token,"refresh_token_cookie":refresh_token},
            "user": {
                "id": user.id,
                "username": user.username,
                "email": user.email,
                 "profile_url":user.profile.profile_image,
                 "first_name":user.profile.Fname,
                 "last_name":user.profile.Lname
                },
            "is_new":is_new
            }

        

    response = (make_response(jsonify(user_details)))
    response.set_cookie(
        'refresh_token_cookie',
        value=refresh_token,
        httponly=True,
        secure=False,
        samesite='Lax',
        max_age=7 * 24 * 3600 # 7 days
    )
    return response, 200
  
        