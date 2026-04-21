"""Repository for Conversation and Message models."""

from typing import List, Optional
from sqlalchemy.orm import Session
from sqlalchemy import desc
from app.models.conversation import Conversation, Message


class IConversationRepository:
    """Interface for Conversation repository."""

    async def create(self, user_id: str, title: str) -> Conversation:
        raise NotImplementedError

    async def get_by_id(self, conversation_id: str) -> Optional[Conversation]:
        raise NotImplementedError

    async def get_by_id_and_user(self, conversation_id: str, user_id: str) -> Optional[Conversation]:
        raise NotImplementedError

    async def get_user_conversations(self, user_id: str) -> List[Conversation]:
        raise NotImplementedError

    async def delete(self, conversation_id: str) -> bool:
        raise NotImplementedError

    async def save_message(
        self,
        conversation_id: str,
        role: str,
        text: str,
        recomendaciones: List[str] = None,
        costos: dict = None,
    ) -> Message:
        raise NotImplementedError


class ConversationRepository(IConversationRepository):
    """SQLAlchemy implementation of Conversation repository."""

    def __init__(self, db: Session):
        self.db = db

    async def create(self, user_id: str, title: str) -> Conversation:
        """Create new conversation."""
        conversation = Conversation(user_id=user_id, title=title)
        self.db.add(conversation)
        self.db.commit()
        self.db.refresh(conversation)
        return conversation

    async def get_by_id(self, conversation_id: str) -> Optional[Conversation]:
        """Get conversation by ID."""
        return self.db.query(Conversation).filter(Conversation.id == conversation_id).first()

    async def get_by_id_and_user(self, conversation_id: str, user_id: str) -> Optional[Conversation]:
        """Get conversation by ID and verify it belongs to user."""
        return self.db.query(Conversation).filter(
            Conversation.id == conversation_id,
            Conversation.user_id == user_id,
        ).first()

    async def get_user_conversations(self, user_id: str) -> List[Conversation]:
        """Get all conversations for a user, ordered by most recent first."""
        return self.db.query(Conversation).filter(
            Conversation.user_id == user_id
        ).order_by(desc(Conversation.created_at)).all()

    async def delete(self, conversation_id: str) -> bool:
        """Delete conversation and all its messages."""
        conversation = await self.get_by_id(conversation_id)
        if not conversation:
            return False
        self.db.delete(conversation)
        self.db.commit()
        return True

    async def save_message(
        self,
        conversation_id: str,
        role: str,
        text: str,
        recomendaciones: List[str] = None,
        costos: dict = None,
    ) -> Message:
        """Save message to conversation."""
        message = Message(
            conversation_id=conversation_id,
            role=role,
            text=text,
            recomendaciones_especificas=recomendaciones or [],
            prediccion_costo_mensual=costos or {},
        )
        self.db.add(message)
        self.db.commit()
        self.db.refresh(message)
        return message
