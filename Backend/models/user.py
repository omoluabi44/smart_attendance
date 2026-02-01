#!/usr/bin/env python3
import models
from models.base_model import BaseModel, Base
from os import getenv
import sqlalchemy
from sqlalchemy import Column, String, ForeignKey,Boolean,DateTime,Integer,text,Enum
from sqlalchemy.orm import relationship
import bcrypt
from datetime import datetime, timedelta

class User(BaseModel, Base):
    __tablename__= "users"
    matric =  Column(String(20), nullable=True)
    email =  Column(String(128), nullable=False, unique=True, index=True)
    verification_code = Column(String(6), nullable=True)
    is_verified = Column(Boolean, default=False)
    code_expires_at = Column(DateTime, nullable=True)
    universityID = Column(String(60), ForeignKey("university.id"), nullable=True)
    role = Column(Enum('student','lecturer'), default="student", nullable=True)
    last_code_sent_at =  Column(DateTime, nullable=True)
    resend_attempts = Column(Integer, nullable=False, server_default=text("0"))
    password_reset_code = Column(String(6), nullable=True)
    name =  Column(String(128), nullable=False)
    

  

    
    university = relationship("University", back_populates="student")
    courses = relationship("Courses", secondary="enrollments", overlaps="enrollment", back_populates="students")
    enrollment = relationship("Enrollment", cascade="all, delete-orphan",overlaps="courses", back_populates="user")
    profile = relationship("Profile", uselist=False, back_populates="user")
    providers = relationship("AuthProvider", back_populates="user")
    attendance = relationship("Attendance", backref="user")

    def __init__(self, *args, **kwargs):
        """initialize user"""
        super().__init__(*args, **kwargs)


