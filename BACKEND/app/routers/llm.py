"""Endpoints de LLM: análisis de modelos, seguridad, análisis de facturas e historial de conversaciones."""

from pydantic import BaseModel, Field
from typing import Optional
from fastapi import APIRouter, HTTPException, status, UploadFile, File, Depends
from fastapi.responses import Response
import logging
import httpx

from app.services.llm_mock import LLMMockService
from app.services.security_llm_service import security_chat_real
from app.services.entrepreneur_llm_service import entrepreneur_chat_real
from app.services.bill_analysis_service import analyze_bill
from app.services.conversation_service import ConversationService
from app.core.config import get_settings
from app.core.dependencies import get_current_user, get_db
from app.models.user import User

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/llm", tags=["llm"])


class SimulateChatRequest(BaseModel):
    prompt: str = Field(min_length=3, max_length=3000)
    model: str = Field(default="gpt-4o-mini-sim")


class SimulateRecommendationRequest(BaseModel):
    business_type: str = Field(min_length=2, max_length=120)
    comuna: str | None = Field(default=None)


class SecurityChatRequest(BaseModel):
    prompt: str = Field(min_length=3, max_length=2000)


class EmprendedorChatRequest(BaseModel):
    prompt: str = Field(min_length=3, max_length=2000)
    conversation_id: Optional[str] = None  # NEW: for saving to conversation history


class TextToSpeechRequest(BaseModel):
    text: str = Field(min_length=1, max_length=700)
    voice: str = Field(default="alloy")
    language: str = Field(default="es", pattern=r"^[a-z]{2}(-[A-Z]{2})?$")


@router.get(
    "/models",
    status_code=status.HTTP_200_OK,
    summary="Listar modelos LLM disponibles"
)
async def list_models():
    try:
        service = LLMMockService()
        return {"success": True, "data": service.list_models(), "count": len(service.list_models())}
    except Exception as e:
        logger.error(f"Error listando modelos LLM: {e}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Error listando modelos LLM")


@router.post(
    "/chat",
    status_code=status.HTTP_200_OK,
    summary="Consultar modelo LLM"
)
async def chat(payload: SimulateChatRequest):
    try:
        service = LLMMockService()
        result = service.simulate_chat(prompt=payload.prompt, model=payload.model)
        return {"success": True, "data": result}
    except Exception as e:
        logger.error(f"Error en consulta a modelo LLM: {e}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Error procesando consulta al modelo LLM")


@router.post(
    "/recommendation",
    status_code=status.HTTP_200_OK,
    summary="Obtener recomendación de zona para negocio"
)
async def recommendation(payload: SimulateRecommendationRequest):
    try:
        service = LLMMockService()
        result = service.simulate_zone_recommendation(
            business_type=payload.business_type,
            comuna=payload.comuna,
        )
        return {"success": True, "data": result}
    except Exception as e:
        logger.error(f"Error al generar recomendación: {e}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Error procesando recomendación de zona")


@router.post(
    "/facturas/analizar",
    status_code=status.HTTP_200_OK,
    summary="Analizar factura EPM (1 o varias imágenes) con visión IA y tarifas reales",
)
async def analizar_factura(files: list[UploadFile] = File(...)):
    _ALLOWED = {"image/jpeg", "image/png", "image/webp", "image/gif"}
    if not files:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="Debes subir al menos una imagen.")
    if len(files) > 6:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="Máximo 6 imágenes por factura.")
    try:
        images = []
        for file in files:
            if file.content_type not in _ALLOWED:
                raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail=f"Archivo '{file.filename}' no es una imagen válida (JPG, PNG, WEBP).")
            image_bytes = await file.read()
            if len(image_bytes) > 10 * 1024 * 1024:
                raise HTTPException(status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE, detail=f"'{file.filename}' supera el límite de 10 MB.")
            images.append((image_bytes, file.content_type))

        settings = get_settings()
        result = await analyze_bill(images=images, api_key=settings.OPENAI_API_KEY)
        return {"success": True, "data": result}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error analizando factura: {e}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Error procesando la factura.")


@router.post(
    "/seguridad/chat",
    status_code=status.HTTP_200_OK,
    summary="Chatbot de seguridad basado en datos de criminalidad"
)
async def security_chat(payload: SecurityChatRequest):
    try:
        settings = get_settings()
        result = await security_chat_real(
            prompt=payload.prompt,
            provider=settings.LLM_PROVIDER,
            openai_key=settings.OPENAI_API_KEY,
            gemini_key=settings.GEMINI_API_KEY,
        )
        return {"success": True, "data": result}
    except Exception as e:
        logger.error(f"Error en chatbot de seguridad: {e}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Error procesando consulta de seguridad")


@router.post(
    "/tts",
    summary="Texto a voz para accesibilidad (OpenAI)",
)
async def text_to_speech(payload: TextToSpeechRequest):
    try:
        settings = get_settings()
        if not settings.OPENAI_API_KEY:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="OPENAI_API_KEY no está configurada en el backend",
            )

        allowed_voices = {
            "alloy", "ash", "ballad", "coral", "echo", "fable", "nova", "onyx", "sage", "shimmer"
        }
        voice = payload.voice if payload.voice in allowed_voices else "alloy"

        headers = {
            "Authorization": f"Bearer {settings.OPENAI_API_KEY}",
            "Content-Type": "application/json",
        }
        language = (payload.language or "es").strip().lower()
        language_instruction = {
            "es": "Speak in clear neutral Latin American Spanish.",
            "es-co": "Speak in clear Colombian Spanish with natural pronunciation.",
            "en": "Speak in clear neutral English.",
        }.get(language, "Speak in clear neutral Latin American Spanish.")

        body = {
            "model": "gpt-4o-mini-tts",
            "voice": voice,
            "input": payload.text,
            "instructions": language_instruction,
            "format": "mp3",
        }

        async with httpx.AsyncClient(timeout=40.0) as client:
            response = await client.post("https://api.openai.com/v1/audio/speech", headers=headers, json=body)

        if response.status_code >= 400:
            logger.error("OpenAI TTS error: %s %s", response.status_code, response.text)
            raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail="No se pudo generar audio TTS")

        return Response(content=response.content, media_type="audio/mpeg")
    except HTTPException:
        raise
    except Exception as e:
        logger.error("Error en TTS: %s", e)
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Error interno en TTS")


@router.post(
    "/emprendedor/consulta",
    status_code=status.HTTP_200_OK,
    summary="Chatbot de emprendedor con recomendaciones basadas en datos de negocios"
)
async def entrepreneur_chat(
    payload: EmprendedorChatRequest,
    current_user: User = Depends(get_current_user),
    db = Depends(get_db),
):
    """Chat with entrepreneur bot - saves messages to conversation history."""
    try:
        settings = get_settings()
        conv_service = ConversationService(db)

        # Get or create conversation
        conversation_id = payload.conversation_id
        title = None

        if not conversation_id:
            # Generate AI title from first prompt
            title = conv_service.generate_title_from_prompt(payload.prompt)
            conversation = await conv_service.create_conversation(current_user.id, title)
            conversation_id = conversation.id

        # Call LLM
        result = await entrepreneur_chat_real(
            prompt=payload.prompt,
            provider=settings.LLM_PROVIDER,
            openai_key=settings.OPENAI_API_KEY,
            gemini_key=settings.GEMINI_API_KEY,
        )

        # Save user message
        await conv_service.save_message_to_conversation(
            conversation_id,
            "user",
            payload.prompt,
            [],
            {}
        )

        # Save bot message
        await conv_service.save_message_to_conversation(
            conversation_id,
            "bot",
            result.get("output", ""),
            result.get("recomendaciones_especificas", []),
            result.get("prediccion_costo_mensual", {})
        )

        # Return with conversation_id and title
        response_data = result.copy()
        response_data["conversation_id"] = conversation_id
        if title:
            response_data["title"] = title

        return {"success": True, "data": response_data}
    except Exception as e:
        logger.error(f"Error en chatbot de emprendedor: {e}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Error procesando consulta de emprendedor")


# ═══════════════════════════════════════════════════════════════
# CONVERSATION MANAGEMENT ENDPOINTS
# ═══════════════════════════════════════════════════════════════


@router.get(
    "/emprendedor/conversations",
    status_code=status.HTTP_200_OK,
    summary="List all conversations for authenticated user"
)
async def list_conversations(
    current_user: User = Depends(get_current_user),
    db = Depends(get_db),
):
    """Get all conversations for the current user (ordered by recency)."""
    try:
        conv_service = ConversationService(db)
        conversations = await conv_service.get_user_conversations(current_user.id)
        return {"success": True, "data": conversations}
    except Exception as e:
        logger.error(f"Error listing conversations: {e}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Error loading conversations")


@router.get(
    "/emprendedor/conversations/{conversation_id}",
    status_code=status.HTTP_200_OK,
    summary="Get a specific conversation with all messages"
)
async def get_conversation(
    conversation_id: str,
    current_user: User = Depends(get_current_user),
    db = Depends(get_db),
):
    """Get specific conversation with all messages (verify ownership)."""
    try:
        conv_service = ConversationService(db)
        conversation = await conv_service.get_conversation_with_messages(conversation_id, current_user.id)

        if not conversation:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Conversation not found")

        return {"success": True, "data": conversation}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting conversation: {e}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Error loading conversation")


@router.delete(
    "/emprendedor/conversations/{conversation_id}",
    status_code=status.HTTP_200_OK,
    summary="Delete a conversation"
)
async def delete_conversation(
    conversation_id: str,
    current_user: User = Depends(get_current_user),
    db = Depends(get_db),
):
    """Delete a conversation (verify ownership before deletion)."""
    try:
        conv_service = ConversationService(db)
        deleted = await conv_service.delete_conversation(conversation_id, current_user.id)

        if not deleted:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Conversation not found")

        return {"success": True, "message": "Conversation deleted"}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting conversation: {e}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Error deleting conversation")
