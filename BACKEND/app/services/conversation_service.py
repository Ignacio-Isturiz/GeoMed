"""Service for managing conversations."""

import json
from typing import List, Optional, Dict, Any
from sqlalchemy.orm import Session
from app.models.conversation import Conversation, Message
from app.repositories.conversation import ConversationRepository


class ConversationService:
    """Business logic for conversation management."""

    def __init__(self, db: Session):
        self.db = db
        self.repository = ConversationRepository(db)

    async def create_conversation(self, user_id: str, title: str = None) -> Conversation:
        """Create new conversation."""
        if not title:
            title = "Nueva conversación"
        return await self.repository.create(user_id, title)

    async def get_user_conversations(self, user_id: str) -> List[Dict[str, Any]]:
        """Get all conversations for user (ordered by recency)."""
        conversations = await self.repository.get_user_conversations(user_id)
        return [conv.to_dict() for conv in conversations]

    async def get_conversation_with_messages(self, conversation_id: str, user_id: str) -> Optional[Dict[str, Any]]:
        """Get conversation with all messages."""
        conversation = await self.repository.get_by_id_and_user(conversation_id, user_id)
        if not conversation:
            return None

        return {
            "id": conversation.id,
            "title": conversation.title,
            "created_at": conversation.created_at.isoformat(),
            "messages": [msg.to_dict() for msg in conversation.messages],
        }

    async def delete_conversation(self, conversation_id: str, user_id: str) -> bool:
        """Delete conversation after verifying ownership."""
        conversation = await self.repository.get_by_id_and_user(conversation_id, user_id)
        if not conversation:
            return False
        await self.repository.delete(conversation_id)
        return True

    async def save_message_to_conversation(
        self,
        conversation_id: str,
        role: str,
        text: str,
        recomendaciones: List[str] = None,
        costos: Dict[str, Any] = None,
    ) -> Message:
        """Save message to conversation."""
        return await self.repository.save_message(
            conversation_id,
            role,
            text,
            recomendaciones,
            costos,
        )

    @staticmethod
    def generate_title_from_prompt(prompt: str) -> str:
        """Extract first 30 chars from prompt as temporary title."""
        # This is a simple extraction - will be replaced with LLM generation
        title = prompt.strip()[:50]
        if len(prompt) > 50:
            title += "..."
        return title if title else "Nueva conversación"

    async def generate_ai_title(self, prompt: str, llm_call) -> str:
        """
        Generate intelligent title using LLM.

        Args:
            prompt: User's first message
            llm_call: Async function that calls the LLM

        Returns:
            Generated title (2-8 words, max 50 chars)
        """
        title_prompt = f"""Tu tarea es generar un título corto (2-8 palabras, máximo 50 caracteres) que resuma el negocio o idea que presentó el usuario.

Mensaje del usuario: "{prompt[:100]}"

Responde SOLO con el título, sin explicaciones adicionales. Ejemplo: "Cafetería en Laureles" o "Tienda de ropa online".

Título:"""

        try:
            # Call LLM with minimal payload
            title_response = await llm_call(title_prompt)
            generated_title = title_response.strip()

            # Validate and clean up
            if len(generated_title) > 50:
                generated_title = generated_title[:50]
            if len(generated_title) < 3:
                generated_title = self.generate_title_from_prompt(prompt)

            return generated_title
        except Exception as e:
            # Fallback to simple extraction
            print(f"Error generating AI title: {e}")
            return self.generate_title_from_prompt(prompt)
