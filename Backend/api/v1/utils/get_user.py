from models.user import User
from models import storage


def get_user():
    user = storage.get_id(User, "c25ac302-9cd7-4857-be07-d81528fcb5e0")
    user_dict = user.to_dict()
    if user.university:
        user_dict["university"] = user.university.to_dict()
        
    print(user_dict)