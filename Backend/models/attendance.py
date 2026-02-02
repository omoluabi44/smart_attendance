#!/usr/bin/env python3
import models
from models.base_model import BaseModel, Base
from os import getenv
import sqlalchemy
from sqlalchemy import Column, String, ForeignKey,JSON,Enum,Integer
from sqlalchemy.orm import relationship


class Attendance(BaseModel, Base):
    __tablename__ = 'attendance'
    session_id = Column(String(60), ForeignKey('session_year.id', ondelete='CASCADE'), nullable=False)
    user_id = Column(String(60), ForeignKey('users.id', ondelete='CASCADE'), nullable=False)
    lecturer_id =  Column(String(60), nullable=True)
    eligibility =  Column(String(255), nullable=True)
    days =  Column(Integer, nullable=True)
    percentage =  Column(String(255), nullable=True)
    status = Column(Enum('present','absent'), nullable=False)
    
    
    sessions = relationship("Sessions", back_populates="attendance")
    
   
    
  
    

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        
    
   