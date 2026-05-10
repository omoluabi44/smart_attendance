#!/usr/bin/env python3
"""Notification: In-app notifications for students (e.g. attendance warnings)"""
import models
from models.base_model import BaseModel, Base
from sqlalchemy import Column, String, ForeignKey, Boolean, Text
from sqlalchemy.orm import relationship


class Notification(BaseModel, Base):
    __tablename__ = 'notifications'
    user_id = Column(String(60), ForeignKey('users.id', ondelete='CASCADE'), nullable=False)
    title = Column(String(255), nullable=False)
    message = Column(Text, nullable=False)
    notification_type = Column(String(50), default='warning', nullable=False)  # warning, info, success
    is_read = Column(Boolean, default=False, nullable=False)
    related_session_id = Column(String(60), ForeignKey('session_year.id', ondelete='SET NULL'), nullable=True)

    user = relationship("User", back_populates="notifications")
    session = relationship("Sessions")

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
