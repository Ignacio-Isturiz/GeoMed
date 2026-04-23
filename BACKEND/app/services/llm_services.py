import json
import logging
from typing import Any, Dict, List

from app.core.config import get_settings
from app.services.movilidad_analisis_service import AnalisisService

logger = logging.getLogger(__name__)


class _RealLLMClient:
    def __init__(self):
        self.settings = get_settings()

    def _resolve_provider_key(self, preferred_model: str | None = None) -> tuple[str, str]:
        provider = (self.settings.LLM_PROVIDER or 'openai').lower()

        if preferred_model:
            p = preferred_model.lower()
            if 'claude' in p or 'anthropic' in p:
                provider = 'anthropic'
            elif 'gemini' in p:
                provider = 'gemini'
            elif 'gpt' in p or 'openai' in p:
                provider = 'openai'

        if provider == 'openai':
            key = self.settings.OPENAI_API_KEY
        elif provider == 'gemini':
            key = self.settings.GEMINI_API_KEY
        elif provider == 'anthropic':
            key = self.settings.ANTHROPIC_API_KEY or self.settings.AI_API_KEY
        else:
            provider = 'openai'
            key = self.settings.OPENAI_API_KEY

        return provider, key or ''

    def _provider_candidates(self, preferred_model: str | None = None) -> List[tuple[str, str]]:
        # 1) Proveedor preferido según config/model
        preferred_provider, preferred_key = self._resolve_provider_key(preferred_model=preferred_model)

        # 2) Resto de proveedores con key disponible
        candidates: List[tuple[str, str]] = []
        if preferred_key:
            candidates.append((preferred_provider, preferred_key))

        openai_key = self.settings.OPENAI_API_KEY or ''
        gemini_key = self.settings.GEMINI_API_KEY or ''
        anthropic_key = self.settings.ANTHROPIC_API_KEY or self.settings.AI_API_KEY or ''

        for provider, key in [
            ('openai', openai_key),
            ('gemini', gemini_key),
            ('anthropic', anthropic_key),
        ]:
            if key and provider not in [p for p, _ in candidates]:
                candidates.append((provider, key))

        return candidates

    def _call_openai(self, system_prompt: str, user_prompt: str, key: str) -> str:
        from openai import OpenAI

        client = OpenAI(api_key=key)
        rsp = client.chat.completions.create(
            model='gpt-4o-mini',
            temperature=0.2,
            messages=[
                {'role': 'system', 'content': system_prompt},
                {'role': 'user', 'content': user_prompt},
            ],
        )
        return rsp.choices[0].message.content or ''

    def _call_gemini(self, system_prompt: str, user_prompt: str, key: str) -> str:
        import google.generativeai as genai

        genai.configure(api_key=key)
        model = genai.GenerativeModel(
            model_name='gemini-1.5-flash',
            system_instruction=system_prompt,
        )
        rsp = model.generate_content(user_prompt)
        return (rsp.text or '').strip()

    def _call_anthropic(self, system_prompt: str, user_prompt: str, key: str) -> str:
        import anthropic

        client = anthropic.Anthropic(api_key=key)
        rsp = client.messages.create(
            model='claude-3-5-haiku-latest',
            max_tokens=700,
            temperature=0.2,
            system=system_prompt,
            messages=[{'role': 'user', 'content': user_prompt}],
        )
        return rsp.content[0].text if rsp.content else ''

    def ask(self, system_prompt: str, user_prompt: str, preferred_model: str | None = None) -> Dict[str, Any]:
        candidates = self._provider_candidates(preferred_model=preferred_model)
        if not candidates:
            raise ValueError('No hay API key configurada para el proveedor LLM seleccionado.')

        last_error: Exception | None = None
        for provider, key in candidates:
            try:
                if provider == 'openai':
                    output = self._call_openai(system_prompt, user_prompt, key)
                    model_used = 'gpt-4o-mini'
                elif provider == 'gemini':
                    output = self._call_gemini(system_prompt, user_prompt, key)
                    model_used = 'gemini-1.5-flash'
                else:
                    output = self._call_anthropic(system_prompt, user_prompt, key)
                    model_used = 'claude-3-5-haiku-latest'

                return {
                    'output': output.strip(),
                    'provider': provider,
                    'model': model_used,
                    'mock': False,
                }
            except Exception as e:
                logger.warning('Fallo proveedor %s, probando siguiente: %s', provider, e)
                last_error = e

        raise RuntimeError(f'Fallaron todos los proveedores LLM configurados: {last_error}')


class MobilityAIEngine:
    def __init__(self):
        self.client = _RealLLMClient()
        self.analisis = AnalisisService()

    def _build_context(self) -> str:
        summary = self.analisis.get_dashboard_summary()
        top_corr = summary.get('top_corredores', [])[:5]
        top_com = summary.get('presion_comunas', [])[:5]
        prioridades = summary.get('prioridades', {})

        corr_txt = '\n'.join(
            [f"- {c.get('corredor', 'N/A')}: criticidad {float(c.get('criticidad', 0)):.2f}/10, vel {float(c.get('velocidad_km_h', 0)):.1f} km/h"
             for c in top_corr]
        )
        com_txt = '\n'.join(
            [f"- {c.get('nombre_comuna', 'N/A')}: intensidad {int(float(c.get('intensidad', 0)))}"
             for c in top_com]
        )

        return (
            'CONTEXTO GEOMED - DASHBOARD\n'
            f'Top corredores:\n{corr_txt}\n\n'
            f'Comunas con mayor presión:\n{com_txt}\n\n'
            f'Prioridades: {json.dumps(prioridades, ensure_ascii=False)}'
        )

    def _direct_mobility_answer(self, user_query: str) -> Dict[str, Any] | None:
        summary = self.analisis.get_dashboard_summary()
        top_corr = summary.get('top_corredores', [])[:10]
        top_com = summary.get('presion_comunas', [])[:5]
        congestion = summary.get('puntos_congestion', [])[:3]
        priorities = summary.get('prioridades', {})

        q = (user_query or '').lower()
        has_time = any(token in q for token in ['am', 'pm', 'hora', 'h', 'medianoche', 'mediodía', 'mediodia'])

        corridor_name = None
        for corridor in summary.get('todos_corredores', []):
            if corridor and corridor.lower() in q:
                corridor_name = corridor
                break

        if '10 corredores' in q or 'corredores más críticos' in q or 'corredores mas críticos' in q:
            lines = []
            for i, c in enumerate(top_corr, start=1):
                lines.append(
                    f"{i}. {c.get('corredor', 'N/A')}: criticidad {float(c.get('criticidad', 0)):.2f}/10, "
                    f"velocidad {float(c.get('velocidad_km_h', 0)):.1f} km/h"
                )

            return {
                'output': (
                    'Los 10 corredores más críticos entre semana son:\n'
                    + '\n'.join(lines)
                    + '\n\nRecomendación: priorizar gestión semafórica y rutas alternas en los corredores con mayor criticidad, '
                    'especialmente en hora pico y en los tramos con menor velocidad promedio.'
                ),
                'provider': 'data',
                'model': 'dashboard-summary',
                'mock': False,
                'status': 'success',
                'mostrar_mapa': True,
                'comunas_destacadas': [c.get('corredor', 'N/A') for c in top_corr[:3]],
            }

        if 'presión vehicular' in q or 'presion vehicular' in q or 'comunas concentran' in q:
            lines = []
            for i, c in enumerate(top_com, start=1):
                lines.append(
                    f"{i}. {c.get('nombre_comuna', 'N/A')}: intensidad {int(float(c.get('intensidad', 0)))} "
                    f"y criticidad {float(c.get('criticidad', 0)):.2f}"
                )

            return {
                'output': (
                    'Las comunas con mayor presión vehicular en hora pico son:\n'
                    + '\n'.join(lines)
                    + '\n\nRecomendación: reforzar gestión semafórica y priorizar rutas alternas donde la intensidad es más alta.'
                ),
                'provider': 'data',
                'model': 'dashboard-summary',
                'mock': False,
                'status': 'success',
                'mostrar_mapa': True,
                'comunas_destacadas': [c.get('nombre_comuna', 'N/A') for c in top_com[:3]],
            }

        if 'baja velocidad' in q or 'alto flujo' in q or 'alto flujo al mismo tiempo' in q or 'puntos críticos' in q:
            lines = []
            for i, c in enumerate(congestion, start=1):
                lines.append(
                    f"{i}. {c.get('corredor', 'N/A')}: {c.get('descripcion', '')}, criticidad {float(c.get('criticidad', 0)):.2f}"
                )

            return {
                'output': (
                    'Los puntos donde coinciden baja velocidad y alto flujo son:\n'
                    + '\n'.join(lines)
                    + '\n\nRecomendación: priorizar rutas alternas y activar gestión semafórica en los corredores más comprometidos.'
                ),
                'provider': 'data',
                'model': 'dashboard-summary',
                'mock': False,
                'status': 'success',
                'mostrar_mapa': True,
                'comunas_destacadas': [c.get('corredor', 'N/A') for c in congestion[:3]],
            }

        if 'rutas alternas' in q or 'gestion semaf' in q or 'gestión semaf' in q or 'transporte sostenible' in q or 'priorizar' in q:
            rutas = priorities.get('rutas_alternas', {})
            sema = priorities.get('gestion_semaforica', {})
            sost = priorities.get('transporte_sostenible', {})
            return {
                'output': (
                    'Zonas y acciones prioritarias según el dashboard:\n'
                    f"- Rutas alternas: {rutas.get('zona', 'N/A')} — {rutas.get('sugerencia', '')}\n"
                    f"- Gestión semafórica: {sema.get('zona', 'N/A')} — {sema.get('sugerencia', '')}\n"
                    f"- Transporte sostenible: {sost.get('zona', 'N/A')} — {sost.get('sugerencia', '')}\n\n"
                    'Recomendación general: concentrar la intervención donde la criticidad y la intensidad se mantienen altas en hora pico.'
                ),
                'provider': 'data',
                'model': 'dashboard-summary',
                'mock': False,
                'status': 'success',
                'mostrar_mapa': True,
                'comunas_destacadas': [
                    rutas.get('zona', 'N/A'),
                    sema.get('zona', 'N/A'),
                    sost.get('zona', 'N/A'),
                ],
            }

        if corridor_name and has_time:
            target = next(
                (c for c in top_corr if (c.get('corredor') or '').lower() == corridor_name.lower()),
                None,
            )
            criticidad = float(target.get('criticidad', 0)) if target else 0.0
            velocidad = float(target.get('velocidad_km_h', 0)) if target else 0.0

            if criticidad >= 8.5:
                tendency = 'alta'
                action = 'te conviene revisar ruta alterna y salir con margen'
            elif criticidad >= 6.5:
                tendency = 'media'
                action = 'puede circularse, pero con atención a los picos'
            else:
                tendency = 'baja'
                action = 'no debería haber gran presión comparada con la hora pico'

            return {
                'output': (
                    f'Para {corridor_name} a esa hora, la presión vehicular debería ser {tendency} frente a las franjas pico. '
                    f'Según el dashboard, ese corredor tiene criticidad {criticidad:.2f}/10 y velocidad promedio de {velocidad:.1f} km/h. '
                    f'En general, la mayor presión se concentra en horas pico, así que {action}. '
                    'Si quieres, te comparo ese corredor contra otro o te doy una recomendación más precisa por franja horaria.'
                ),
                'provider': 'data',
                'model': 'dashboard-summary',
                'mock': False,
                'status': 'success',
                'mostrar_mapa': True,
                'comunas_destacadas': [corridor_name],
            }

        return None

    def ask_assistant(self, user_query: str, current_section: str = 'general') -> Dict[str, Any]:
        direct_answer = self._direct_mobility_answer(user_query)
        if direct_answer:
            return direct_answer

        summary = self.analisis.get_dashboard_summary()
        if not user_query or not user_query.strip():
            return {
                'output': (
                    'Puedo ayudarte con consultas de movilidad como corredores críticos, comunas con presión vehicular, '
                    'horas pico y recomendaciones de intervención. Por ejemplo: "¿Cuáles son los 10 corredores más críticos entre semana?"'
                ),
                'status': 'success',
                'provider': 'data',
                'model': 'dashboard-summary',
                'mock': False,
                'mostrar_mapa': False,
                'comunas_destacadas': [],
            }

        if len(user_query.split()) <= 3 and any(word in user_query.lower() for word in ['hola', 'buenas', 'hey', 'saludos']):
            return {
                'output': (
                    'Hola. Puedo ayudarte con movilidad en Medellín: corredores más críticos, comunas con mayor presión vehicular, '
                    'anomalías y recomendaciones como rutas alternas o gestión semafórica. ¿Qué quieres revisar?'
                ),
                'status': 'success',
                'provider': 'data',
                'model': 'dashboard-summary',
                'mock': False,
                'mostrar_mapa': False,
                'comunas_destacadas': [],
            }

        system_prompt = (
            'Eres GeoBot de GeoMed Medellín. Responde con base en datos del dashboard y datasets. '
            'No inventes cifras. Si no hay dato exacto, dilo explícitamente y sugiere la mejor acción operativa. '
            'Responde en español claro y accionable.\n\n'
            f'SECCIÓN ACTIVA: {current_section}\n'
            f'{self._build_context()}'
        )

        try:
            rsp = self.client.ask(system_prompt, user_query)
            rsp['status'] = 'success'
            return rsp
        except Exception as e:
            logger.error('Error llamando LLM real en ask_assistant: %s', e)
            # Fallback basado en datos reales (no simulado)
            return {
                'output': (
                    'No pude consultar el proveedor IA en este momento, pero según el dashboard actual '
                    'los corredores más críticos y comunas de mayor presión requieren gestión semafórica, '
                    'rutas alternas en hora pico y priorización operativa en zonas críticas.'
                ),
                'status': 'fallback_data_based',
                'error': str(e),
                'mock': False,
            }


class LLMMockService:
    """
    Mantiene compatibilidad con rutas existentes, pero las respuestas son reales
    (proveedor LLM + contexto de datos). El nombre de clase se conserva por compatibilidad.
    """

    def __init__(self):
        self.engine = MobilityAIEngine()

    def list_models(self) -> List[Dict[str, Any]]:
        settings = get_settings()
        return [
            {
                'id': 'gpt-4o-mini',
                'provider': 'openai',
                'available': bool(settings.AI_API_KEY or settings.OPENAI_API_KEY),
                'mock': False,
            },
            {
                'id': 'gemini-1.5-flash',
                'provider': 'gemini',
                'available': bool(settings.AI_API_KEY or settings.GEMINI_API_KEY),
                'mock': False,
            },
            {
                'id': 'claude-3-5-haiku-latest',
                'provider': 'anthropic',
                'available': bool(settings.AI_API_KEY or settings.ANTHROPIC_API_KEY),
                'mock': False,
            },
        ]

    def simulate_chat(self, prompt: str, model: str = 'auto') -> Dict[str, Any]:
        result = self.engine.ask_assistant(prompt, current_section='general')
        return {
            'output': result.get('output', ''),
            'model': result.get('model', model),
            'provider': result.get('provider', get_settings().LLM_PROVIDER),
            'mock': False,
            'status': result.get('status', 'success'),
        }

    def simulate_zone_recommendation(self, business_type: str, comuna: str | None = None) -> Dict[str, Any]:
        prompt = (
            f'Para un negocio tipo "{business_type}", '
            f'evalúa la mejor zona de Medellín considerando presión vehicular y dinámica urbana. '
            f'Comuna de referencia: {comuna or "sin preferencia"}. '
            'Da recomendación breve y accionable.'
        )
        result = self.engine.ask_assistant(prompt, current_section='analisis')
        return {
            'output': result.get('output', ''),
            'zona_recomendada': comuna or 'Depende del tipo de negocio y movilidad',
            'mock': False,
            'model': result.get('model'),
            'provider': result.get('provider'),
        }

    def simulate_security_chat(self, prompt: str) -> Dict[str, Any]:
        result = self.engine.ask_assistant(prompt, current_section='seguridad')
        return {
            'output': result.get('output', ''),
            'mostrar_mapa': True,
            'comunas_destacadas': [],
            'datos_mapa': [],
            'mock': False,
            'model': result.get('model'),
            'provider': result.get('provider'),
        }

    def simulate_entrepreneur_chat(self, prompt: str) -> Dict[str, Any]:
        result = self.engine.ask_assistant(prompt, current_section='emprendimiento')
        return {
            'output': result.get('output', ''),
            'recomendaciones_especificas': [
                'Validar flujo peatonal y vehicular por franja horaria.',
                'Priorizar zonas con conectividad y menor criticidad pico.',
                'Combinar promoción digital con logística de última milla.'
            ],
            'prediccion_costo_mensual': {
                'min': 0,
                'max': 0,
                'nota': 'Estimación cualitativa basada en movilidad; integra costos reales para cifra final.'
            },
            'mock': False,
            'model': result.get('model'),
            'provider': result.get('provider'),
        }
