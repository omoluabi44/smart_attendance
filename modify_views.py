import sys

def modify_courses():
    file_path = "Backend/api/v1/views/courses.py"
    with open(file_path, "r") as f:
        content = f.read()

    content = content.replace(
        "session = storage._DBStorage__session",
        "from api.v1.utils.webhook_dispatcher import dispatch_course_config_webhook\nsession = storage._DBStorage__session"
    )

    content = content.replace(
        "    course = Courses(**data)\n    course.save()\n    return make_response(jsonify(course.to_dict()), 201)",
        "    course = Courses(**data)\n    course.save()\n    dispatch_course_config_webhook(course.id, data.get('total_classes', 13), data.get('academic_session', '2026/2027'))\n    return make_response(jsonify(course.to_dict()), 201)"
    )

    content = content.replace(
        "    for key, value in data.items():\n        if key not in ignore:\n            setattr(course, key, value)\n    course.save()\n    return make_response(jsonify(course.to_dict()), 200)",
        "    for key, value in data.items():\n        if key not in ignore:\n            setattr(course, key, value)\n    course.save()\n    total_classes = getattr(course, 'total_classes', 13)\n    academic_session = getattr(course, 'academic_session', '2026/2027')\n    dispatch_course_config_webhook(course.id, total_classes, academic_session)\n    return make_response(jsonify(course.to_dict()), 200)"
    )

    with open(file_path, "w") as f:
        f.write(content)

def modify_materials():
    file_path = "Backend/api/v1/views/materials.py"
    with open(file_path, "r") as f:
        content = f.read()

    content = content.replace(
        "from api.v1.utils.roles import role_required",
        "from api.v1.utils.roles import role_required\nfrom api.v1.utils.webhook_dispatcher import dispatch_material_webhook\nfrom models.session import Sessions"
    )

    content = content.replace(
        "    storage.new(new_material)\n    storage.save()\n    \n    return jsonify({\"message\": \"Material added successfully\", \"id\": new_material.id}), 201",
        "    storage.new(new_material)\n    storage.save()\n    \n    session_obj = storage.get_id(Sessions, session_id)\n    if session_obj:\n        dispatch_material_webhook(session_obj.courseID, new_material.id, new_material.title, new_material.material_type, new_material.file_url or '')\n\n    return jsonify({\"message\": \"Material added successfully\", \"id\": new_material.id}), 201"
    )

    with open(file_path, "w") as f:
        f.write(content)

def modify_quizzes():
    file_path = "Backend/api/v1/views/quizzes.py"
    with open(file_path, "r") as f:
        content = f.read()

    content = content.replace(
        "from api.v1.utils.roles import role_required",
        "from api.v1.utils.roles import role_required\nfrom api.v1.utils.webhook_dispatcher import dispatch_quiz_webhook\nfrom models.session import Sessions"
    )

    content = content.replace(
        "        except Exception:\n            pass\n            \n    storage.save()\n    \n    return jsonify({\"message\": \"Quiz created successfully\", \"id\": new_quiz.id}), 201",
        "        except Exception:\n            pass\n            \n    storage.save()\n    \n    session_obj = storage.get_id(Sessions, session_id)\n    if session_obj:\n        scheduled_at_str = new_quiz.scheduled_at.isoformat() if new_quiz.scheduled_at else ''\n        dispatch_quiz_webhook(session_obj.courseID, new_quiz.id, new_quiz.title, scheduled_at_str, new_quiz.duration_minutes, new_quiz.is_graded)\n\n    return jsonify({\"message\": \"Quiz created successfully\", \"id\": new_quiz.id}), 201"
    )

    with open(file_path, "w") as f:
        f.write(content)

if __name__ == "__main__":
    modify_courses()
    modify_materials()
    modify_quizzes()
    print("Modifications done.")
