from api.v1.views import app_views
from flask import jsonify, make_response, abort, request
from models import storage
from models.user import User
from models.course import Courses
from models.enrollment import Enrollment
import os
from os.path import join, dirname
from flask_jwt_extended import  jwt_required,get_jwt_identity
from flasgger.utils import swag_from


session = storage._DBStorage__session
# @cache.memoize(timeout=36)
def get_enrollment_user_memoized(user_id):
    session = storage._DBStorage__session
  
    enrollments = session.query(Enrollment).filter(Enrollment.userID == user_id).all()
    courses =  [en.to_dict() for en in enrollments]
 
    return courses
    
@app_views.route('/enrollment/user/<user_id>/', methods=["GET"], strict_slashes=False)
# @swag_from(join(dirname(__file__), 'documentation/enrollment/all_enrollment.yml'))
@jwt_required()

def get_enrollment_user(user_id):
    """
    get user enrolled courses
    """
    courses = get_enrollment_user_memoized(user_id)
    return make_response(jsonify(courses), 200)

    return make_response(jsonify(user_course_dict),200)
@app_views.route('/enrollment/course/<course_id>/', methods=["GET"], strict_slashes=False)
def get_enrollment_course(course_id):
    course = storage.get(Courses,course_id ) 
   
    course_dict = [course.to_dict() for course in course.students]

    return make_response(jsonify(course_dict),200)


    
 
@app_views.route('/enrollment', methods=['POST'], strict_slashes=False)
# @swag_from(join(dirname(__file__), 'documentation/enrollment/post_enrollment.yml'))
# @jwt_required()
def post_enrollment():
    """
    assigned courses for  user
    """
    if not request.get_json():
        abort(400, description="Not a JSON")
    data = request.get_json()
   
    quizes_attributes = ['courseID', 'userID','course_name']
    for i in quizes_attributes:
        if i not in data:
            abort(400, description=f"missing - {i}")
       
    
    user_id = data.get('userID')
    course_id = data.get('courseID')
   
   
    user = storage.get_id(User,user_id )
    if not user:
        return make_response("user not found", 404)
    courses = session.query(Courses).filter_by(courseID=course_id).first()
    # courses = storage.get_id(Courses,course_id )
    if not courses:
        return make_response("course not found", 404)
    # get user enroll courses
    user_courses = []
    for i in user.courses:
        user_courses.append(i.courseID)

   
   
    for course in user_courses:
        if course == data['courseID']:
                #abort(400, description="Already enrolled in this course")
            return(make_response(jsonify({"error":"Already enrolled in this course"}), 404))

    instance = Enrollment(**data)
    instance.save()
    #cache.delete_memoized(get_enrollment_user_memoized, user_id)
    return(make_response(jsonify({"Success":"Course Enroll successful!"}), 201))



@app_views.route('/enrollment/<enrollment_id>', methods=['PUT'], strict_slashes=False)
# @swag_from(join(dirname(__file__), 'documentation/enrollment/update_enrollment.yml'))
# @jwt_required()
def put_enrollment(enrollment_id):
    """
    Updates an existing enrollment .
    """
    enrollment = storage.get_id(Enrollment, enrollment_id)
 
    if not enrollment:
        abort(404)
    if not request.get_json():
        abort(400, description="Not a JSON")
    
    data = request.get_json()
    if 'userID' in data:
        user = storage.get_id(User, data['userID'])
        if not user:
            abort(400, description="the user does not exist")
    if 'courseID' in data:  
        course = storage.get_id(Courses, data['courseID'])
        if not course:
            abort(400, description="the course does not exist")
    ignore = ['id', 'created_at', 'updated_at',]
    for key, value in data.items():
        if key not in ignore:
            setattr(enrollment, key, value)
   
        
    enrollment.save()

    return make_response(jsonify(enrollment.to_dict()), 200)

@app_views.route('/enrollment/<enrollment_id>', methods=['DELETE'], strict_slashes=False)
# @swag_from(join(dirname(__file__), 'documentation/enrollment/del_enrollment.yml'))
@jwt_required()
def del_enrollment(enrollment_id):
    """
    Deletes enrollment by its ID.
    """
    enrollment = storage.get_id(Enrollment, enrollment_id)
    if not enrollment:
        abort(404)
    user_id = get_jwt_identity()

    storage.delete(enrollment)
    storage.save()
    #cache.delete_memoized(get_enrollment_user_memoized, user_id)
    return make_response(jsonify({}), 200)
