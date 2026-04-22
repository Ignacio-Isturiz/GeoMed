from fastapi import APIRouter, HTTPException, status
import logging
from app.services.movilidad_analisis_service import AnalisisService

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/analytics", tags=["analytics"])

@router.get(
    "/dashboard-summary",
    status_code=status.HTTP_200_OK,
    summary="Obtener resumen estratégico de movilidad",
    description="Devuelve métricas clave, top corredores, anomalías y prioridades estratégicas."
)
async def get_dashboard_summary():
    try:
        service = AnalisisService()
        data = service.get_dashboard_summary()
        return {
            "success": True,
            "data": data
        }
    except Exception as e:
        logger.error(f"Error al obtener dashboard summary: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error al obtener datos analíticos"
        )
from pydantic import BaseModel

class AnalysisRequest(BaseModel):
    corredor: str
    hora: int

@router.post(
    "/analyze",
    status_code=status.HTTP_200_OK,
    summary="Analizar corredor y hora específica",
    description="Devuelve un análisis inteligente y recomendaciones para un corredor y hora dados."
)
async def analyze_corridor_hour(request: AnalysisRequest):
    try:
        service = AnalisisService()
        result = service.analyze_corridor_hour(request.corredor, request.hora)
        return {
            "success": True,
            "data": result
        }
    except Exception as e:
        logger.error(f"Error al analizar corredor: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error al procesar el análisis inteligente"
        )
