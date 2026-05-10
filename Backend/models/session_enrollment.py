#!/usr/bin/env python3
"""SessionEnrollment: Links students to specific sessions (course + year)"""
import models
from models.base_model import BaseModel, Base
from sqlalchemy import Column, String, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from datetime import datetime


class SessionEnrollment(BaseModel, Base):
    __tablename__ = 'session_enrollments'
    session_id = Column(String(60), ForeignKey('session_year.id', ondelete='CASCADE'), nullable=False)
    user_id = Column(String(60), ForeignKey('users.id', ondelete='CASCADE'), nullable=False)
    enrolled_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    session = relationship("Sessions", back_populates="enrolled_students")
    student = relationship("User", back_populates="session_enrollments")

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
