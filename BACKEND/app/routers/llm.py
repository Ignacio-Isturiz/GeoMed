"""Endpoints de LLM: análisis de modelos y seguridad."""

from pydantic import BaseModel, Field
from fastapi import APIRouter, HTTPException, status
import logging

from app.services.llm_mock import LLMMockService
from app.services.security_llm_service import security_chat_real
from app.core.config import get_settings

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
