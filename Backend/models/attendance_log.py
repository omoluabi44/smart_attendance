#!/usr/bin/env python3
"""AttendanceLog: Granular per-class attendance record with lecturer info"""
import models
from models.base_model import BaseModel, Base
from sqlalchemy import Column, String, ForeignKey, DateTime, Enum
from sqlalchemy.orm import relationship
from datetime import datetime


class AttendanceLog(BaseModel, Base):
    __tablename__ = 'attendance_logs'
    session_id = Column(String(60), ForeignKey('session_year.id', ondelete='CASCADE'), nullable=False)
    user_id = Column(String(60), ForeignKey('users.id', ondelete='CASCADE'), nullable=False)
    recorded_by = Column(String(60), ForeignKey('users.id', ondelete='SET NULL'), nullable=True)
    date = Column(DateTime, default=datetime.utcnow, nullable=False)
    status = Column(Enum('present', 'absent', 'excused'), default='present', nullable=False)

    session = relationship("Sessions", back_populates="attendance_logs")
    student = relationship("User", foreign_keys=[user_id], backref="attendance_logs_as_student")
    lecturer = relationship("User", foreign_keys=[recorded_by], backref="attendance_logs_as_lecturer")

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
