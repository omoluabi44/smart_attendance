from models.user import User
from models.university import University
from models import storage
from models.streak import Streak
from sqlalchemy import func
from sqlalchemy.orm import aliased
from sqlalchemy import over

session = storage._DBStorage__session
def get_all_rank(userId):
    user = storage.get_id(User, userId)
    if not user.university:
        print("user_uni_id not found")
    
    user_uni_id = user.university.university
    users = (
    session.query(User)
    .join(User.streak)
    .join(User.university)  
    .filter(University.university == user_uni_id)
    .order_by(Streak.point.desc())
    .all()
    )
    return users

def get_user_rank(userId):
    user = storage.get_id(User, userId)
    user_uni_id = user.university.university
    users = (
    session.query(User)
    .join(User.streak)
    .join(User.university)  
    .filter(University.university == user_uni_id)
    .order_by(Streak.point.desc())
    .all()
)

    ranked_users = (
    session.query(
        User,
        Streak.point,
        func.rank().over(order_by=Streak.point.desc()).label("rank")
    )
    .join(User.streak)
    .join(User.university)
    .filter(University.university == user_uni_id)
    .subquery()
    )
    alias = aliased(User, ranked_users)

    user_rank = (
    session.query(ranked_users.c.rank)
    .filter(ranked_users.c.id == user.id)
    .scalar()
)

    
    return(user_rank)