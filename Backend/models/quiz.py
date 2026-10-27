#!/usr/bin/env python3
from models.base_model import BaseModel, Base
from sqlalchemy import Column, String, ForeignKey, Boolean, Integer, DateTime
from sqlalchemy.orm import relationship

class Quiz(BaseModel, Base):
    __tablename__ = 'quizzes'
    session_id = Column(String(60), ForeignKey('session_year.id', ondelete='CASCADE'), nullable=False)
    title = Column(String(255), nullable=False)
    scheduled_at = Column(DateTime, nullable=True)
    duration_minutes = Column(Integer, default=30)
    is_graded = Column(Boolean, default=True)
    status = Column(String(50), default='scheduled') # scheduled, active, completed
    
    session = relationship("Sessions", backref="quizzes")
    results = relationship("QuizResult", back_populates="quiz", cascade="all, delete-orphan")

class QuizResult(BaseModel, Base):
    __tablename__ = 'quiz_results'
    quiz_id = Column(String(60), ForeignKey('quizzes.id', ondelete='CASCADE'), nullable=False)
    user_id = Column(String(60), ForeignKey('users.id', ondelete='CASCADE'), nullable=False)
    score = Column(Integer, nullable=False)
    total_score = Column(Integer, default=100)
    
    quiz = relationship("Quiz", back_populates="results")
    student = relationship("User")
