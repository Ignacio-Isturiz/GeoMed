"""Bot de Telegram para el flujo ciudadano de seguridad.

Reutiliza exactamente la misma lógica del dashboard ciudadano:
`security_chat_real` en `app.services.security_llm_service`.
"""

from __future__ import annotations

import logging
from typing import Any, Dict
from pathlib import Path
import csv
from functools import lru_cache

from telegram import Update
from telegram.constants import ChatAction
from telegram.ext import Application, CommandHandler, ContextTypes, MessageHandler, filters

from app.core.config import get_settings
from app.services.security_llm_service import security_chat_real

logger = logging.getLogger(__name__)


def _format_security_reply(result: Dict[str, Any]) -> str:
    """Convierte la respuesta del servicio ciudadano a texto para Telegram."""
    output = (result or {}).get("output") or "No pude generar una respuesta en este momento."
    mostrar_mapa = bool((result or {}).get("mostrar_mapa"))
    destacadas = (result or {}).get("comunas_destacadas") or []

    if mostrar_mapa and destacadas:
        comunas = ", ".join(str(c) for c in destacadas)
        output = f"{output}\n\nComunas destacadas: {comunas}"

    # Telegram acepta hasta 4096 caracteres por mensaje
    return output[:4096]


async def _start(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    _ = context
    if not update.message:
        return
    await update.message.reply_text(
        "¡Hola! Soy MECIA — puedo ayudarte con información sobre seguridad en Medellín y recomendaciones locales. "
        "Dime a dónde piensas ir o qué te preocupa y te doy una respuesta cercana y práctica; si quieres, también puedo listar zonas más seguras o peligrosas."
    )


async def _help(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    _ = context
    if not update.message:
        return

    await update.message.reply_text(
        "Ejemplos:\n"
        "- Quiero ir a trotar por La Candelaria, es seguro?\n"
        "- Compara seguridad entre Laureles y Aranjuez\n"
        "- Cuales son las zonas mas peligrosas de Medellin?"
    )


async def _on_text(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    _ = context
    if not update.message or not update.message.text:
        return

    prompt = update.message.text.strip()
    if len(prompt) < 3:
        await update.message.reply_text("Escribe una pregunta un poco mas detallada para ayudarte mejor.")
        return

    settings = get_settings()

    try:
        await update.message.chat.send_action(action=ChatAction.TYPING)

        # Build an augmented prompt that asks the LLM for a friendly, explanatory
        # tone and includes a short sample of local businesses to allow recommendations.
        instruction = (
            "Responde con un tono cercano y explicativo, como si hablaras con un vecino. "
            "Si recomiendas un lugar, explica por qué y da contexto breve sobre su ubicación. "
            "Evita contradicciones: si sugieres una comuna como recomendación, no la listes después como peligrosa.\n\n"
        )

        # Prefer natural phrasing: do not obligatorily enumerate las más/menos seguras
        instruction += (
            "Solo proporciona listas de 'más seguras' o 'más peligrosas' si el usuario las pide explícitamente; "
            "si la consulta es general, ofrece una recomendación concreta y ofrece la opción de mostrar un resumen de zonas.\n\n"
        )

        negocios_summary = _load_negocios_summary()
        combined_prompt = f"{instruction}Consulta: {prompt}\n\nNegocios (muestra): {negocios_summary}"

        # Force usage of Gemini for Telegram interactions
        result = await security_chat_real(
            prompt=combined_prompt,
            provider="gemini",
            openai_key=settings.OPENAI_API_KEY,
            gemini_key=settings.GEMINI_API_KEY,
        )

        # If Gemini failed and we fell back to mock, try OpenAI (if available) to get a fuller response.
        if result.get("fallback_mock") and settings.OPENAI_API_KEY:
            logger.debug("Gemini failed — retrying security_chat_real with OpenAI")
            result = await security_chat_real(
                prompt=combined_prompt,
                provider="openai",
                openai_key=settings.OPENAI_API_KEY,
                gemini_key=settings.GEMINI_API_KEY,
            )

        await update.message.reply_text(_format_security_reply(result))
    except Exception as exc:
        logger.exception("Error atendiendo mensaje de Telegram: %s", exc)
        await update.message.reply_text(
            "Hubo un problema procesando tu consulta. Intenta de nuevo en unos segundos."
        )
def build_application(token: str) -> Application:
    app = Application.builder().token(token).build()

    app.add_handler(CommandHandler("start", _start))
    app.add_handler(CommandHandler("help", _help))
    app.add_handler(MessageHandler(filters.TEXT & ~filters.COMMAND, _on_text))

    return app


# Cargar una muestra resumida del dataset de negocios para incluir en el prompt.
@lru_cache()
def _load_negocios_summary(max_items: int = 20) -> str:
    try:
        base = Path(__file__).resolve().parents[2]
        csv_path = base / "datasets" / "negocios_medellin_full.csv"
        if not csv_path.exists():
            return "(dataset no disponible)"

        items = []
        with csv_path.open(newline='', encoding='utf-8') as fh:
            reader = csv.DictReader(fh)
            for i, row in enumerate(reader):
                if i >= max_items:
                    break
                # Try common columns, fall back gracefully
                name = row.get('nombre') or row.get('name') or row.get('Nombre') or ''
                barrio = row.get('barrio') or row.get('barrio_col') or row.get('barrio_nombre') or row.get('neighbourhood') or ''
                tipo = row.get('categoria') or row.get('tipo') or row.get('categoria_negocio') or ''
                if name:
                    snippet = name
                    if barrio:
                        snippet += f" ({barrio})"
                    if tipo:
                        snippet += f" - {tipo}"
                    items.append(snippet)

        if not items:
            return "(sin entradas en dataset)"

        return "; ".join(items)
    except Exception:
        logger.exception("No se pudo leer negocios_medellin_full.csv")
        return "(error cargando dataset)"


def run_polling() -> None:
    settings = get_settings()

    if not settings.TELEGRAM_BOT_TOKEN:
        raise ValueError("Falta TELEGRAM_BOT_TOKEN en variables de entorno")

    app = build_application(settings.TELEGRAM_BOT_TOKEN)
    app.run_polling(allowed_updates=Update.ALL_TYPES)


if __name__ == "__main__":
    run_polling()
