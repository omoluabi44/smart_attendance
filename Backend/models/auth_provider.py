#!/usr/bin/env python3
import models
from models.base_model import BaseModel, Base
from os import getenv
import sqlalchemy
from sqlalchemy import Column, String, ForeignKey,Boolean,DateTime,Integer,Enum,UniqueConstraint
from sqlalchemy.orm import relationship
import bcrypt
from datetime import datetime, timedelta
from models.user import User

class AuthProvider(BaseModel, Base):
    __tablename__= "auth_provider"
    provider_id =  Column(String(128), nullable=False)
    provider = Column(Enum("Google", "Facebook", "Apple", "Local", name="provider_enum"), index=True, default="Local", nullable=False)
    password =  Column(String(128), nullable=True)
    userID = Column(String(120), ForeignKey('users.id', ondelete="CASCADE"),  nullable=False, index=True)
    

   
    __table_args__ = (
        UniqueConstraint("provider", "provider_id", name="uq_provider_account"),
        UniqueConstraint("userID", "provider", name="uq_user_provider"),
    )


   
    user = relationship("User", back_populates="providers")
    
    


  
    def __init__(self, *args, **kwargs):
        """Initialize AuthProvider with password hashing for Local provider."""
        super().__init__(*args, **kwargs)
        if 'provider' not in kwargs:
            raise ValueError("Provider must be specified")
        if kwargs.get('provider') == 'Local' and 'password' in kwargs:
            if not kwargs['password']:
                raise ValueError("Password cannot be empty for Local provider")
            self.password = self._hash_password(kwargs['password'])
        elif kwargs.get('provider') != 'Local' and 'password' in kwargs:
            raise ValueError("Password should only be set for Local provider")
   
    def _hash_password(self, password: str) -> str:
        """Hash a password using bcrypt."""
        salt = bcrypt.gensalt(rounds=12)  # Increased rounds for security
        hashed = bcrypt.hashpw(password.encode('utf-8'), salt)
        return hashed.decode('utf-8')  # Store as string
        
    def check_password(self, password):
        """Verify provided password against stored hash."""
        if  not self.password:
            return False
        try:
            return bcrypt.checkpw(password.encode('utf-8'), self.password.encode('utf-8'))
        except (AttributeError, ValueError):
            return False

