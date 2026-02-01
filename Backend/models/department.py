#!/usr/bin/env python3
import models
from models.base_model import BaseModel, Base
from os import getenv
import sqlalchemy
from sqlalchemy import Column, String, ForeignKey,Boolean,DateTime,Integer
from sqlalchemy.orm import relationship
import bcrypt
from datetime import datetime, timedelta

class Department(BaseModel, Base):
    __tablename__= "departments"
    department =  Column(String(128), nullable=False)
    collegeID = Column(String(60), ForeignKey('colleges.id'), nullable=False)
    
    college = relationship("College", back_populates="department")
   

   

    def __init__(self, *args, **kwargs):
        """initialize user"""
        super().__init__(*args, **kwargs)

   
