



""" Flask Application """
import eventlet
eventlet.monkey_patch()
from models import storage
from api.v1.views import app_views
from api.v1.oauth_client import oauth
from os import environ
import os 
from flask import Flask, make_response, jsonify
from flask_cors import CORS
from flasgger import Swagger
from flask_jwt_extended import JWTManager
from flask_mail import Mail
from dotenv import load_dotenv
from datetime import timedelta

import logging

from flask import request
from models.user import User
from pythonjsonlogger import jsonlogger




load_dotenv()


app = Flask(__name__)

app.config['JSONIFY_PRETTYPRINT_REGULAR'] = True
app.register_blueprint(app_views)

CORS(
    app,
    resources={r"/api/v1/*": {"origins": "*"}},
)

app.config['JWT_SECRET_KEY'] = environ.get('JWT_SECRET_KEY')
app.config['JWT_ACCESS_TOKEN_EXPIRES'] = timedelta(hours=12)
app.config["JWT_COOKIE_CSRF_PROTECT"] = False

app.secret_key = environ.get("SECRET_KEY")



oauth.init_app(app)
jwt = JWTManager(app)

@jwt.unauthorized_loader
def unauthorized_callback(reason):
    return jsonify({"msg": reason}), 401

@jwt.invalid_token_loader
def invalid_token_callback(reason):
    return jsonify({"msg": reason}), 401

@jwt.expired_token_loader
def expired_token_callback(jwt_header, jwt_payload):
    return jsonify({"msg": "Token has expired"}), 401

@jwt.revoked_token_loader
def revoked_token_callback(jwt_header, jwt_payload):
    return jsonify({"msg": "Token revoked"}), 401



mail_username = environ.get('MAIL_USERNAME')
mail_password = environ.get('MAIL_PASSWORD')
app.config['MAIL_SERVER'] = 'smtp.gmail.com'
# app.config['MAIL_PORT'] = 465
# app.config['MAIL_USE_SSL'] = True
app.config['MAIL_PORT'] = 587
app.config['MAIL_USE_TLS'] = True 
app.config['MAIL_USE_SSL'] = False
app.config['MAIL_USERNAME'] = 'emmanuelogunleye441999@gmail.com' 
app.config['MAIL_PASSWORD'] = "vcwvkvdsnvhjauja"
app.config['MAIL_DEFAULT_SENDER'] = 'emmanuelogunleye441999@gmail.com'
mail = Mail(app)



@app.teardown_appcontext
def close_db(error):
    storage.close()

@app.errorhandler(404)
def not_found(error):
    return make_response(jsonify({'error': f"Not found{error}"}), 404)

app.config['SWAGGER'] = {
    'title': 'Course Pass Restful API',
    'uiversion': 3,
    'securityDefinitions': {
        'bearerAuth': {
            'type': 'apiKey',
            'name': 'Authorization',
            'in': 'header',
            'description': 'JWT Authorization header using the Bearer scheme. Example: "Authorization: Bearer {token}"'
        }
    }
}
Swagger(app)



#LOGGING

formatter = jsonlogger.JsonFormatter(
    '%(asctime)s %(levelname)s %(name)s %(message)s'
)
logger = logging.getLogger()
logHandler = logging.StreamHandler()
logHandler.setFormatter(formatter)
logger.handlers = [] 
logger.addHandler(logHandler)
logger.setLevel(logging.INFO)




