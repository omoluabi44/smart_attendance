from models.user import User
from models.profile import Profile
from models.auth_provider import AuthProvider
from models import storage
from flask_jwt_extended import (
                                create_access_token,  
                                create_refresh_token)
from flask import abort, jsonify, make_response, request

session = storage._DBStorage__session

def Login_helper(email: str, provider: str, provider_id: str, user_info: dict):
    user = storage.get_email(User, email)

    is_new = False
    
    try:
        
        if not user and provider != "Local":
            user = User(email=email,is_verified=True)
            user.save()
          
            is_new = True

        profile = session.query(Profile).filter_by(userID=user.id).first()
       
        if not profile:
            user = storage.get_email(User, email)
            user_info["userID"] = user.id
            user_profile = Profile(**user_info)
            user_profile.save()
             
            
        auth_prov =  session.query(AuthProvider).filter_by(userID=user.id, provider=provider).first()
        user_id = user.id
        if not auth_prov:
            auth_user = AuthProvider(provider = provider, provider_id = provider_id, userID = user.id)
            auth_user.save()
    except Exception as e:
        return(jsonify(f"❌  Error creating user or auth provider: {e}"))
        
    
    access_token = create_access_token(identity=user.id)
    refresh_token = create_refresh_token(identity=user.id)
    return (access_token, refresh_token, is_new,user_id)
         
      
   