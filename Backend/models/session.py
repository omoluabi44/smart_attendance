#!/usr/bin/env python3
import models
from models.base_model import BaseModel, Base
from os import getenv
import sqlalchemy
from sqlalchemy import Column, String, ForeignKey,JSON,Integer
from sqlalchemy.orm import relationship


class Sessions(BaseModel, Base):
    __tablename__ = 'session_year'
    courseID = Column(String(60), ForeignKey('courses.courseID', ondelete='CASCADE'), nullable=False)
    session_name = Column(String(530), nullable=False)
    total_expected_classes =  Column(Integer, default=13, nullable=False)
    
    course = relationship("Courses", back_populates="sessions")
    attendance = relationship("Attendance", back_populates="sessions")
   
    
  
    

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        
    
   