
from models.user import User
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
from flask import render_template

def generate_verification_code(user):
    """generate new new code and reset expiration"""
    user.verification_code = str(random.randint(100000, 999999))
    user.code_expires_at = datetime.utcnow() + timedelta(hours=1)
    storage.save()
    return user.verification_code
def generate_password_code(user):
    """generate new new code and reset expiration"""
    user.password_reset_code = str(random.randint(100000, 999999))
    user.code_expires_at = datetime.utcnow() + timedelta(hours=1)
    storage.save()
    return user.password_reset_code

