#!/usr/bin/env python3
from models.base_model import BaseModel, Base
from sqlalchemy import Column, String, ForeignKey, Enum, Text
from sqlalchemy.orm import relationship

class CourseMaterial(BaseModel, Base):
    __tablename__ = 'course_materials'
    session_id = Column(String(60), ForeignKey('session_year.id', ondelete='CASCADE'), nullable=False)
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    material_type = Column(Enum('pdf', 'docx', 'link', 'announcement'), nullable=False)
    file_url = Column(String(512), nullable=True)
    uploaded_by = Column(String(60), ForeignKey('users.id'), nullable=False)

    session = relationship("Sessions", backref="materials")
    lecturer = relationship("User")
