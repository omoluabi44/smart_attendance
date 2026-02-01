#!/usr/bin/env python3
import models
from models.base_model import BaseModel, Base
from os import getenv
import sqlalchemy
from sqlalchemy import Column, String, ForeignKey,Boolean,DateTime,Integer
from sqlalchemy.orm import relationship
import bcrypt
from datetime import datetime, timedelta

class College(BaseModel, Base):
    __tablename__= "colleges"
    college =  Column(String(128), nullable=False)
    universityID = Column(String(60), ForeignKey('universities.id'), nullable=False)
    university = relationship("Universities", back_populates="college")
    department = relationship("Department", back_populates="college", cascade="all, delete-orphan")
    

   

    def __init__(self, *args, **kwargs):
        """initialize user"""
        super().__init__(*args, **kwargs)

   
