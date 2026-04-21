# Backend MECIA

## Bot de Telegram (Ciudadano)

El bot de Telegram usa exactamente la misma logica del chatbot ciudadano del dashboard:

- Servicio compartido: `app.services.security_llm_service.security_chat_real`
- Proveedor LLM: `LLM_PROVIDER` (`openai` o `gemini`)
- API keys: `OPENAI_API_KEY` y/o `GEMINI_API_KEY`

### 1) Configurar variables de entorno

En `.env` agrega:

```env
TELEGRAM_BOT_TOKEN=tu-token-de-botfather
LLM_PROVIDER=openai
OPENAI_API_KEY=tu-openai-api-key
GEMINI_API_KEY=tu-gemini-api-key
```

### 2) Instalar dependencias

```bash
pip install -r requirements.txt
```

### 3) Ejecutar bot

```bash
python run_telegram_bot.py
```

Comandos en Telegram:

- `/start`
- `/help`

Mensajes de texto normales se procesan con el mismo motor de respuestas del perfil ciudadano.
