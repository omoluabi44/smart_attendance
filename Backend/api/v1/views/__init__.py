#!/usr/bin/python3
""" Blueprint for API """
from flask import Blueprint

app_views = Blueprint('app_views', __name__, url_prefix='/api/v1')


from api.v1.views.courses import *
from api.v1.views.users import *
from api.v1.views.university import *
from api.v1.views.enrollment import *
from api.v1.views.auth import *
from api.v1.views.universities import *
from api.v1.views.college import *
from api.v1.views.department import *
from api.v1.views.Oauth import *
from api.v1.views.sessions import *
from api.v1.views.attendance import *

