import asyncio
import json
from app.services.security_llm_service import security_chat_real
from app.core.config import get_settings
from pathlib import Path
import os

async def main():
    # Ensure working dir is project backend so .env is loaded by pydantic BaseSettings
    os.chdir(Path(__file__).resolve().parent)
    settings = get_settings()
    res = await security_chat_real(prompt='Hola, ¿qué zonas son más seguras?', provider='gemini', openai_key=settings.OPENAI_API_KEY, gemini_key=settings.GEMINI_API_KEY)
    print(json.dumps(res, indent=2, ensure_ascii=False))

if __name__ == '__main__':
    asyncio.run(main())
