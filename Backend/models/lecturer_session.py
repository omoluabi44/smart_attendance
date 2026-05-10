#!/usr/bin/env python3
"""LecturerSession: Many-to-many association between lecturers and sessions"""
import models
from models.base_model import BaseModel, Base
from sqlalchemy import Column, String, ForeignKey
from sqlalchemy.orm import relationship


class LecturerSession(BaseModel, Base):
    __tablename__ = 'lecturer_session'
    session_id = Column(String(60), ForeignKey('session_year.id', ondelete='CASCADE'), nullable=False)
    lecturer_id = Column(String(60), ForeignKey('users.id', ondelete='CASCADE'), nullable=False)

    session = relationship("Sessions", back_populates="lecturers")
    lecturer = relationship("User", back_populates="lecturer_sessions")

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
