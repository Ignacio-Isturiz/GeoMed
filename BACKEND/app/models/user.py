"""
Modelos de base de datos usando SQLAlchemy
Aplica principios SOLID: cada modelo es responsable de su propia entidad
"""
from sqlalchemy import Column, String, Boolean, DateTime, Enum
from sqlalchemy.ext.declarative import declarative_base
from datetime import datetime
import enum

Base = declarative_base()


class UserRole(str, enum.Enum):
    """Roles disponibles en la aplicación"""
    EMPRENDEDOR = "emprendedor"
    CIUDADANO = "ciudadano"


class User(Base):
    """
    Modelo de Usuario en la base de datos.
    Single Responsibility: solo representa un usuario
    """
    __tablename__ = "users"
    
    id = Column(String, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    full_name = Column(String, nullable=False)
    hashed_password = Column(String, nullable=False)
    role = Column(Enum(UserRole), default=UserRole.CIUDADANO, nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)
    is_verified = Column(Boolean, default=False, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    def __repr__(self):
        return f"<User(email={self.email}, role={self.role})>"
