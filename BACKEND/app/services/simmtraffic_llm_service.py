"""
Servicio de chatbot de movilidad que reutiliza el motor real del dashboard.

Este módulo se conserva por compatibilidad con rutas antiguas, pero ya no
responde con la persona de seguridad ni con texto de criminalidad.
"""

from __future__ import annotations

import logging
from typing import Any, Dict

from app.services.llm_services import MobilityAIEngine

logger = logging.getLogger(__name__)


def _fallback_response(engine: MobilityAIEngine, error: Exception) -> Dict[str, Any]:
    summary = engine.analisis.get_dashboard_summary()
    top_corr = summary.get('top_corredores', [])[:3]
    return {
        'output': (
            'No pude consultar el proveedor IA en este momento, pero según el dashboard actual los corredores más críticos '
            'y comunas de mayor presión requieren gestión semafórica, rutas alternas en hora pico y priorización operativa en zonas críticas.'
        ),
        'mostrar_mapa': True,
        'comunas_destacadas': [c.get('corredor', 'N/A') for c in top_corr],
        'datos_mapa': summary.get('top_corredores', []),
        'model': 'data-fallback',
        'provider': 'none',
        'mock': False,
        'fallback_data_based': True,
        'error_llm': str(error),
    }


async def security_chat_real(
    prompt: str,
    provider: str,
    openai_key: str,
    gemini_key: str,
    anthropic_key: str = '',
    ai_api_key: str = '',
) -> Dict[str, Any]:
    """Compatibilidad legacy: ahora responde con el motor de movilidad."""
    engine = MobilityAIEngine()

    try:
        result = engine.ask_assistant(prompt, current_section='movilidad')
        return {
            'output': result.get('output', ''),
            'mostrar_mapa': result.get('mostrar_mapa', False),
            'comunas_destacadas': result.get('comunas_destacadas', []),
            'datos_mapa': engine.analisis.get_dashboard_summary().get('top_corredores', []),
            'model': result.get('model', 'dashboard-summary'),
            'provider': result.get('provider', provider or 'data'),
            'mock': False,
            'fallback_data_based': result.get('provider') == 'data',
        }
    except Exception as error:
        logger.error('Error en mobility_chat_real: %s', error, exc_info=True)
        return _fallback_response(engine, error)
