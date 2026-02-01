#!/usr/bin/env python3
import models
from models.base_model import BaseModel, Base
from os import getenv
import sqlalchemy
from sqlalchemy import Column, String, ForeignKey,Boolean,DateTime,Integer,Date
from sqlalchemy.orm import relationship
import bcrypt
from datetime import datetime, timedelta
from models.user import User

class Profile(BaseModel, Base):
    __tablename__= "user_profile"
    Fname =  Column(String(128), nullable=True)
    Lname =  Column(String(128), nullable=True)
    profile_image = Column(String(128), nullable=True)
  
  
    userID = Column(String(120), ForeignKey('users.id', ondelete="CASCADE"), primary_key=True, nullable=False)
    user = relationship("User", back_populates="profile")
   
    


    def __init__(self, *args, **kwargs):
        """initialize user"""
        super().__init__(*args, **kwargs)