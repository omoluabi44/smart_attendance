#!/usr/bin/python3
"""
Contains the class DBStorage
"""

import models

from models.base_model import BaseModel, Base
from models.user import User
from models.university import University
from models.course import Courses
from models.enrollment import Enrollment
from models.universities import Universities
from models.college import College
from models.department import Department
from hashlib import md5
from models.session import Sessions
from models.attendance import  Attendance
from models.profile import Profile
from models.auth_provider import AuthProvider

from os import getenv
import sqlalchemy
from sqlalchemy import create_engine
from sqlalchemy.orm import scoped_session, sessionmaker

classes = {
            "Sessions":Sessions,"User":User, "BaseModel": BaseModel,"University":University, 
            "Courses": Courses,  "Attendance": Attendance, "Enrollment":Enrollment,
             "Universities":Universities, "College":College,"Department":Department, 
            "Profile":Profile, "AuthProvider":AuthProvider,
          }


class DBStorage:
    """interaacts with the MySQL database"""
    __engine = None
    __session = None

    def __init__(self):
        """Instantiate a DBStorage object"""
        HBNB_MYSQL_USER = getenv('BDYM_MYSQL_USER')
        HBNB_MYSQL_PWD = getenv('BDYM_MYSQL_PWD')
        HBNB_MYSQL_HOST = getenv('BDYM_MYSQL_HOST')
        HBNB_MYSQL_DB = getenv('BDYM_MYSQL_DB')
        HBNB_ENV = getenv('BDYM_ENV')
        db_url = 'mysql+mysqldb://{}:{}@{}/{}'.format(
            HBNB_MYSQL_USER,
            HBNB_MYSQL_PWD,
            HBNB_MYSQL_HOST,
            HBNB_MYSQL_DB
        )
        
        self.__engine = create_engine(db_url, pool_pre_ping=True)
        if HBNB_ENV == "test":
            Base.metadata.drop_all(self.__engine)

    def all(self, cls=None):
        """Query only the requested class"""
        if cls is None:
            raise ValueError("Class must be specified for performance reasons")

        objs = self.__session.query(cls).all()
        return {f"{obj.__class__.__name__}.{obj.id}": obj for obj in objs}


    def new(self, obj):
        """add the object to the current database session"""
        self.__session.add(obj)

    def save(self):
        """commit all changes of the current database session"""
        try:
            self.__session.commit()
        except Exception as e:
        # If any error (like a Lock Timeout) happens,
        # you MUST roll back the session.
            self.__session.rollback()
            raise e
    def rollback(self):
        """commit all changes of the current database session"""
        self.__session.rollback()


    def delete(self, obj=None):
        """delete from the current database session obj if not None"""
        if obj is not None:
            self.__session.delete(obj)

    def reload(self):
        """reloads data from the database"""
        Base.metadata.create_all(self.__engine)
        sess_factory = sessionmaker(bind=self.__engine, expire_on_commit=False)
        Session = scoped_session(sess_factory)
        self.__session = Session

    def close(self):
        """call remove() method on the private session attribute"""
        self.__session.remove()

    def get(self, cls, id):
        """
        Returns the object based on the class name and its CourseID, or
        None if not found
        """
        if cls not in classes.values():
            return None

        return self.__session.query(cls).filter_by(courseID=id).first()
    def get_username(self, cls, username):
        """
        Returns the object based on the class name and its username, or
        None if not found
        """
        if cls not in classes.values():
            return None
        """this way more faster than using the one above and below, gonna change it soon"""
        return self.__session.query(cls).filter_by(username=username).first()
    def get_email(self, cls, email):
        """
        Returns the object based on the class name and its email, or
        None if not found
        """
        if cls not in classes.values():
            return None
    
        return self.__session.query(cls).filter_by(email=email).first()
    def get_id(self, cls, id):
        """
        Returns the object based on the class name and its ID, or
        None if not found
        """
        if cls not in classes.values():
            return None

        return self.__session.query(cls).filter_by(id=id).first()
    def get_courseID(self, cls, id):
        """
        Returns the object based on the class name and its ID, or
        None if not found
        """
        if cls not in classes.values():
            return None

        return self.__session.query(cls).filter_by(courseID=id).first()
     
    def get_enroll_id(self, cls, id, course_id):
        """
        Returns the object based on the class name and its ID, or
        None if not found
        """
        if cls not in classes.values():
            return None

        return self.__session.query(cls).filter_by(userID=id, courseID=course_id).first()

        return None

    def count(self, cls=None):
        """
        count the number of objects in storage
        """
        all_class = classes.values()

        if not cls:
            count = 0
            for clas in all_class:
                count += len(models.storage.all(clas).values())
        else:
            count = len(models.storage.all(cls).values())

        return count
