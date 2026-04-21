"""
Rutas de noticias para frontend ciudadano.
"""
from fastapi import APIRouter, HTTPException, Query, status
import httpx

from app.services.news import NewsService

router = APIRouter(prefix="/api/news", tags=["news"])


@router.get(
    "/medellin",
    status_code=status.HTTP_200_OK,
    summary="Noticias de Medellin"
)
async def get_medellin_news(
    page_size: int = Query(default=8, ge=1, le=20, description="Cantidad de noticias"),
    category: str = Query(default="general", description="Categoria: general, seguridad, emprendimiento, movilidad, salud, economia"),
):
    try:
        service = NewsService()
        articles = await service.get_medellin_news(page_size=page_size, category=category)
        return {
            "success": True,
            "data": articles,
            "count": len(articles),
            "category": category,
        }
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=str(exc),
        )
    except httpx.HTTPStatusError as exc:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"Error de proveedor de noticias: {exc.response.status_code}",
        )
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="No fue posible obtener noticias en este momento",
        )
