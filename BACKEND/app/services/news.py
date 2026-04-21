"""
Servicio de noticias: integra fuentes externas de forma segura.
La API key se mantiene en backend y no se expone al frontend.
"""
from typing import Any, Dict, List
import httpx

from app.core.config import get_settings


class NewsService:
    def __init__(self):
        self.settings = get_settings()

    @staticmethod
    def _category_query(category: str) -> str:
        category_map = {
            "general": "(Medellin OR Medellín)",
            "seguridad": "(Medellin OR Medellín) AND (seguridad OR crimen OR policia OR hurto)",
            "emprendimiento": "(Medellin OR Medellín) AND (emprendimiento OR negocios OR empresas OR startup)",
            "movilidad": "(Medellin OR Medellín) AND (movilidad OR transporte OR vias OR metro)",
            "salud": "(Medellin OR Medellín) AND (salud OR hospitales OR clinicas)",
            "economia": "(Medellin OR Medellín) AND (economia OR comercio OR empleo OR industria)",
        }
        return category_map.get(category.lower(), category_map["general"])

    @staticmethod
    def _is_medellin_article(item: Dict[str, Any]) -> bool:
        text = " ".join(
            [
                str(item.get("title") or ""),
                str(item.get("description") or ""),
                str(item.get("content") or ""),
            ]
        ).lower()
        return "medellin" in text or "medellín" in text

    async def get_medellin_news(self, page_size: int = 8, category: str = "general") -> List[Dict[str, Any]]:
        """Obtiene noticias relevantes para Medellin/seguridad/emprendimiento."""
        if not self.settings.NEWS_API_KEY:
            raise ValueError("NEWS_API_KEY no configurada")

        endpoint = f"{self.settings.NEWS_API_BASE_URL}/everything"
        params = {
            "q": self._category_query(category),
            "language": "es",
            "sortBy": "publishedAt",
            "pageSize": page_size,
            "apiKey": self.settings.NEWS_API_KEY,
        }

        async with httpx.AsyncClient(timeout=12.0) as client:
            response = await client.get(endpoint, params=params)
            response.raise_for_status()
            payload = response.json()

        if payload.get("status") != "ok":
            raise ValueError(payload.get("message", "Respuesta invalida de NewsAPI"))

        raw_articles = [
            article for article in payload.get("articles", [])
            if self._is_medellin_article(article)
        ]

        # Normaliza para frontend y evita enviar campos innecesarios.
        articles: List[Dict[str, Any]] = []
        for item in raw_articles:
            articles.append(
                {
                    "source": (item.get("source") or {}).get("name"),
                    "title": item.get("title"),
                    "description": item.get("description"),
                    "url": item.get("url"),
                    "image_url": item.get("urlToImage"),
                    "published_at": item.get("publishedAt"),
                }
            )

        return articles
