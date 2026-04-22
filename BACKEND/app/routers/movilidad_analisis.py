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
