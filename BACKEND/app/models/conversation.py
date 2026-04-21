"""Database models for conversation history."""

from datetime import datetime
from sqlalchemy import Column, String, DateTime, ForeignKey, JSON
from sqlalchemy.orm import relationship
from app.models.user import Base
import uuid


class Conversation(Base):
    """Stores conversation metadata."""
    __tablename__ = "conversations"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()), index=True)
    user_id = Column(String, ForeignKey("users.id"), nullable=False, index=True)
    title = Column(String, nullable=False, default="Nueva conversación")
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    # Relationships
    messages = relationship("Message", back_populates="conversation", cascade="all, delete-orphan")

    def to_dict(self):
        return {
            "id": self.id,
            "title": self.title,
            "created_at": self.created_at.isoformat(),
            "updated_at": self.updated_at.isoformat(),
            "message_count": len(self.messages) if self.messages else 0,
        }


class Message(Base):
    """Stores individual messages in a conversation."""
    __tablename__ = "messages"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()), index=True)
    conversation_id = Column(String, ForeignKey("conversations.id"), nullable=False, index=True)
    role = Column(String, nullable=False)  # "user" or "bot"
    text = Column(String, nullable=False)
    recomendaciones_especificas = Column(JSON, nullable=True, default=[])
    prediccion_costo_mensual = Column(JSON, nullable=True, default={})
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    # Relationships
    conversation = relationship("Conversation", back_populates="messages")

    def to_dict(self):
        return {
            "id": self.id,
            "role": self.role,
            "text": self.text,
            "recomendaciones": self.recomendaciones_especificas or [],
            "costos": self.prediccion_costo_mensual or {},
            "created_at": self.created_at.isoformat(),
        }
