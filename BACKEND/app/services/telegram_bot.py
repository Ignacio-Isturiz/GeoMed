import logging
from telegram import Update
from telegram.ext import ApplicationBuilder, ContextTypes, CommandHandler, MessageHandler, filters

from app.services.llm_services import LLMMockService
from app.core.config import get_settings

logger = logging.getLogger(__name__)

async def start(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Maneja el comando /start"""
    await update.message.reply_text(
        "¡Hola! Soy GEOMED Movilidad, tu asistente ciudadano para Medellín. 🚦\n\n"
        "Puedo ayudarte a tomar decisiones informadas sobre corredores críticos, horas pico, presión vehicular y recomendaciones operativas.\n"
        "Pregúntame por un corredor, comuna o franja horaria."
    )

async def help_command(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Maneja el comando /help"""
    await update.message.reply_text(
        "Simplemente escríbeme el nombre de un corredor, comuna o franja horaria y hazme una pregunta sobre movilidad.\n\n"
        "Ejemplos:\n"
        "- ¿Cuáles son los 10 corredores más críticos entre semana?\n"
        "- ¿Qué comunas concentran más presión vehicular en hora pico?\n"
        "- ¿Dónde hay baja velocidad y alto flujo al mismo tiempo?"
    )

async def handle_message(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Procesa los mensajes de texto del usuario"""
    user_text = update.message.text
    if not user_text:
        return

    # Mostrar que el bot está escribiendo
    await context.bot.send_chat_action(chat_id=update.effective_chat.id, action="typing")

    try:
        settings = get_settings()
        service = LLMMockService()
        result = service.simulate_chat(prompt=user_text, model=settings.LLM_PROVIDER)
        
        # Extraer el texto de la respuesta
        response_text = result.get("output", "Lo siento, no pude procesar tu consulta en este momento.")
        
        await update.message.reply_text(response_text)
    except Exception as e:
        logger.error(f"Error procesando mensaje en Telegram: {e}")
        await update.message.reply_text("Hubo un error al procesar tu mensaje. Inténtalo de nuevo más tarde.")

def start_bot_polling():
    """Inicia el bot en modo polling"""
    settings = get_settings()
    token = settings.TELEGRAM_BOT_TOKEN
    
    if not token:
        logger.error("TELEGRAM_BOT_TOKEN no configurado en el entorno.")
        return

    application = ApplicationBuilder().token(token).build()
    
    # Añadir handlers
    application.add_handler(CommandHandler("start", start))
    application.add_handler(CommandHandler("help", help_command))
    application.add_handler(MessageHandler(filters.TEXT & (~filters.COMMAND), handle_message))
    
    logger.info("Iniciando bot de Telegram...")
    application.run_polling()
