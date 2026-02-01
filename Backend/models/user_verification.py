#!/usr/bin/env python3
import models
from models.base_model import BaseModel, Base
from os import getenv
import sqlalchemy
from sqlalchemy import Column, String, ForeignKey,Boolean,DateTime,Integer
from sqlalchemy.orm import relationship
import bcrypt
from datetime import datetime, timedelta
from models.user import User

class Verification(BaseModel, Base):
    __tablename__= "verification"
    verification_code = Column(String(128), nullable=False)
    expired_at = Column(DateTime, nullable=False)
    userID = Column(String(120), ForeignKey("users.id", ondelete="CASCADE"), primary_key=True, nullable=False)

    


    def __init__(self, *args, **kwargs):
        """initialize user"""
        super().__init__(*args, **kwargs)
        
    def is_valid(self):
        return datetime.utcnow() < self.expired_at