"""  authentication API actions for Users """
from models.user import User
from models.auth_provider import AuthProvider
from models import storage
import random
from api.v1.views import app_views
from flask import abort, jsonify, make_response, request
from flasgger.utils import swag_from
from ..utils.login_helper import Login_helper
from flask_jwt_extended import (
                                create_access_token,  
                                create_refresh_token, 
                                jwt_required,
                                get_jwt_identity, get_jwt

                                 )
from flask_mail import Mail, Message
from os import environ
from os.path import join, dirname
from datetime import datetime, timedelta
from ..utils.auth import generate_verification_code, generate_password_code
from sqlalchemy.exc import OperationalError
import bcrypt

ses = storage._DBStorage__session

@app_views.route('/auth/register', methods=["POST"], strict_slashes=False)
# @swag_from(join(dirname(__file__), 'documentation/user/register_user.yml'))

def post_user():
    """
        CREATE  a new user
    """
    if not request.get_json():
        abort(400, description="Not a JSON")
    data = request.get_json()
    requiredField = ["matric", "password", "email","name"]
    for i in requiredField:
        if i not in data:
            abort(400, description=f"Missing {i}")
    


    email = data.get("email")
    
    verification_code = str(random.randint(100000, 999999))
    expires_at = datetime.utcnow() + timedelta(hours=2)
    
    db_email = ses.query(User).filter(User.email == email).first()
    
    
    # if db_email and db_email.is_verified == False:
    #     from api.v1.Ai_agent.task import send_queue_verification_email
    #     sent = send_queue_verification_email.delay(
    #                                     recipient=data["email"],
    #                                     code=verification_code
    #     )
       
        
    #     db_email.verification_code = verification_code
    #     db_email.code_expires_at = expires_at
    #     db_email.save()
    #     return make_response(jsonify({"userID":db_email.id}), 201)
    
    if db_email and db_email.is_verified == True:
        return make_response(jsonify({"error": "Email already exists"}), 400)

    

    # from api.v1.utils.email import send_queue_verification_email
    # send_queue_verification_email(
    #     recipient=data["email"],
    #     code=verification_code
    # )



    user_data ={
    "matric": data["matric"],
    "email": data["email"],
    "name": data["name"],
    "verification_code":None,
    "is_verified":True,
    "code_expires_at": expires_at, 
   }
    user_instance = User(**user_data)
    user_instance.save()
    
    
    user = storage.get_email(User, email)
    
    auth_provi_data={
    "password" : data["password"], 
    "provider": "Local",
    "provider_id": data["email"],
    "userID": user.id
    }
    provider_instance = AuthProvider(**auth_provi_data)
    provider_instance.save()
   
    return make_response(jsonify({"userID":user.id}), 201)


@app_views.route('/auth/login', methods=["POST"], strict_slashes=False)
# @swag_from(join(dirname(__file__), 'documentation/user/login.yml'))
def login_user():
    """
        login  a  user
    """
    if not request.get_json():
        abort(400, description="Not a JSON")
    if 'email' not in request.get_json():
         abort(400, description="Missing email")
    if 'password' not in request.get_json():
         abort(400, description="Missing password")

    data = request.get_json()
    email = data["email"].replace(" ", "")
    password = data["password"].replace(" ", "")
    
    try:
        
        user = storage.get_email(User, email)
        print(user)
        if not user:
            return make_response(jsonify({"error": "Invalid email or password"}), 404)
        
        auth_prov =  ses.query(AuthProvider).filter_by(userID=user.id).first()
        
        if not auth_prov:
            return make_response(jsonify({"error": "provider not found"}), 404)
    except OperationalError:
            return jsonify({"error": "Database unavailable, try again later"}), 503

    if not auth_prov.check_password(password):
        return jsonify({"error": "Invalid email or passwords"}), 404
    if not user.is_verified:
        return jsonify({"error": "account not verified"}), 403
    access_token = create_access_token(identity=user.id)
    refresh_token = create_refresh_token(identity=user.id)

    response_data = {
        "tokens": {"access": access_token, "refresh_token_cookie":refresh_token},
        "user": {
            "id": user.id,
 
            "email": user.email,
            "profile_url": user.profile.profile_image if user.profile else "default_url_here"
        }
    }
    
    response = make_response(jsonify(response_data))

    
    response.set_cookie(
        'refresh_token_cookie',
        value=refresh_token,
        httponly=True,
        secure=True,
        samesite='None',
        max_age=7 * 24 * 3600 # 7 days
    )
    
    return response, 200

    


@app_views.route('/auth/resend_code', methods=["POST"], strict_slashes=False)
# @swag_from(join(dirname(__file__), 'documentation/user/resend.yml'))
def resend_code():
    COOLDOWN_SECONDS = 60       
    MAX_RESENDS = 5 
    """ resend verification code"""
    if not request.get_json():
        abort(400, description="Not a JSON")
    data = request.get_json()
    if not data or 'userId' not in data:
        abort(400, description="Email required")
    

    
    user_id = data["userId"]
    user = storage.get_id(User, user_id)
    if user.is_verified:
        return jsonify({"error": "User already verified"}), 400
    now = datetime.utcnow()
    
    if user.last_code_sent_at and (now - user.last_code_sent_at).total_seconds() < COOLDOWN_SECONDS:
        wait_time = COOLDOWN_SECONDS - (now - user.last_code_sent_at).total_seconds()
        return make_response(jsonify({"error": f"Please wait {int(wait_time)}s before requesting another code"}), 429)
    if user.code_expires_at and now > user.code_expires_at:
        user.resend_attempts = 0
    
    if user.resend_attempts >= MAX_RESENDS:
        return make_response(jsonify({"error": "Max resend attempts reached. Please wait for code to expire."}), 429)

    new_code = generate_verification_code(user)
    
    user.last_code_sent_at = now
    user.resend_attempts = (user.resend_attempts or 0) + 1
    storage.save()
    from api.v1.Ai_agent.task import send_queue_verification_email
  
    send_queue_verification_email.delay(recipient=user.email, code=new_code)
    return jsonify({
        "message": "New verification code sent"
    }), 200

@app_views.route('/auth/verify', methods=["POST"], strict_slashes=False)
# @swag_from(join(dirname(__file__), 'documentation/user/verify.yml'))
def verify():
    """ verify user account"""
    if not request.get_json():
        abort(400, description="Not a JSON")
    data = request.get_json()
    requiredField = [ "code", "userID"]
    for i in requiredField:
        if i not in data:
            abort(400, description=f"Missing {i}")
    user_id = data["userID"]
    code = data["code"]
   
    
    user = storage.get_id(User, user_id)

    if not user:
        return make_response(jsonify({"error": "User not found"}), 404)
    if user.is_verified:
        return make_response(jsonify({"error": "User already verified"}), 400)

    if user.verification_code != code:
 
        return make_response(jsonify({"error": "Invalid Verification code"}), 400)
    
    if datetime.utcnow() > user.code_expires_at:
        return make_response(jsonify({"error": "Verification code expired"}), 400)
    user.is_verified = True
    user.verification_code = None
    
    storage.save()
  
    return make_response(jsonify({"message":"Verification successful!"}), 200)



@app_views.route('/auth/refresh', methods=['POST'])
@jwt_required(refresh=True, locations=['cookies'])
def refresh_token():
    current_user_id = get_jwt_identity()
    # Create a new, short-lived access token
    new_access_token = create_access_token(identity=current_user_id)
       
        
    return make_response(jsonify({"access": new_access_token}))
    
    
@app_views.route('/auth/change_password_request', methods=['POST'])
def change_password_request():
    # collect user email
    # not found - user does not exist
    if not request.get_json():
        abort(400, description="Not a JSON")
    if 'email' not in request.get_json():
         abort(400, description="Missing email")
    data = request.get_json()
    email = data["email"]
    user = storage.get_email(User, email)
    if not user:
        return make_response(jsonify({"error": "User not found"}), 404)
    new_code = generate_password_code(user)
  
    
    from api.v1.Ai_agent.task import send_queue_password_code
    send_queue_password_code.delay(recipient=user.email, code=new_code)
    return jsonify({
        "message": "password verification code sent",
        "expires_at": user.code_expires_at.isoformat() 
    }), 200


@app_views.route('/auth/reset_password', methods=['POST'], strict_slashes=False)
# @swag_from(join(dirname(__file__), 'documentation/user/put_user.yml'), methods=['PUT'])
# @jwt_required()
def reset_password():
    """
    change user password
    """
   
  
    if not request.get_json():
        abort(400, description="Not a JSON")
    data = request.get_json()
    requiredField = [ "code", "email", "password"]
    for i in requiredField:
        if i not in data:
            abort(400, description=f"Missing {i}")
   
   
    code = data["code"]
    email = data["email"].replace(" ", "")
    user = storage.get_email(User, email)

    if not user:
        return jsonify({"error": "no user found"}), 404
        
    local_provider = next((p for p in user.providers), None)
    
    if not local_provider:
        return jsonify({"error": "No provider for this user"}), 404
    

    
    if not user:
        return make_response(jsonify({"error":"user not found!"}), 404)
    if datetime.utcnow() > user.code_expires_at:
        return make_response(jsonify({"error": "Verification code expired"}), 400)
    if user.password_reset_code != code:
         return make_response(jsonify({"error": "Invalid Verification code"}), 400)
    
    
    user.password_reset_code = None
    hashed_password = _hash_password(data["password"])
    print("before ",local_provider.password)
    local_provider.password = hashed_password  
    print("after ",local_provider.password)
    storage.save()
    return make_response(jsonify({"message": "password changed successfully!"}), 200)

def _hash_password(password: str) -> str:
    """Hash a password using bcrypt."""
    salt = bcrypt.gensalt(rounds=12)  # Increased rounds for security
    hashed = bcrypt.hashpw(password.encode('utf-8'), salt)
    return hashed.decode('utf-8')
