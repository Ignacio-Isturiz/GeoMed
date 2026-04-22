import logging
from telegram import Update
from telegram.ext import ApplicationBuilder, ContextTypes, CommandHandler, MessageHandler, filters

from app.services.simmtraffic_llm_service import security_chat_real
from app.core.config import get_settings

logger = logging.getLogger(__name__)

async def start(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Maneja el comando /start"""
    await update.message.reply_text(
        "¡Hola! Soy GEOMED Seguridad, tu asistente ciudadano para Medellín. 🏙️\n\n"
        "Puedo ayudarte a tomar decisiones informadas sobre seguridad basándome en datos reales de criminalidad.\n"
        "Dime a qué zona piensas ir o pregúntame por la seguridad en alguna comuna."
    )

async def help_command(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Maneja el comando /help"""
    await update.message.reply_text(
        "Simplemente escríbeme el nombre de una zona o hazme una pregunta sobre seguridad.\n\n"
        "Ejemplos:\n"
        "- ¿Qué tan seguro es El Poblado?\n"
        "- Compara la seguridad en Laureles y Aranjuez.\n"
        "- ¿Cuáles son las zonas más seguras para trotar?"
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
        # Llamar al servicio de IA
        result = await security_chat_real(
            prompt=user_text,
            provider=settings.LLM_PROVIDER,
            openai_key=settings.OPENAI_API_KEY,
            gemini_key=settings.GEMINI_API_KEY
        )
        
        # Extraer el texto de la respuesta
        # security_chat_real retorna un dict con "output"
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
