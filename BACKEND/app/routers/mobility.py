from fastapi import APIRouter, HTTPException
from app.services.mobility_service import MobilityService

router = APIRouter(prefix="/api/mobility", tags=["mobility"])
router_es = APIRouter(prefix="/api/movilidad", tags=["movilidad"])
mobility_service = MobilityService()

@router.get("/summary/hour")
def get_hour_summary():
    """Retorna un resumen de movilidad agrupado por hora."""
    try:
        return mobility_service.get_summary_by_hour()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/summary/comuna")
def get_comuna_summary():
    """Retorna un resumen de movilidad agrupado por comuna con coordenadas."""
    try:
        return mobility_service.get_summary_by_comuna()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/critical-corridors")
def get_critical_corridors(limit: int = 10):
    """Retorna los corredores con mayor índice de criticidad."""
    try:
        return mobility_service.get_top_critical_corridors(limit)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/recommendations")
def get_mobility_recommendations():
    """Retorna recomendaciones dinámicas basadas en los datos de movilidad."""
    try:
        return mobility_service.get_recommendations()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router_es.get("")
def get_mobility_geo_points(limit: int = 12000):
    """Retorna puntos geoespaciales de movilidad para visualización 3D."""
    try:
        return mobility_service.get_geo_points(limit)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
