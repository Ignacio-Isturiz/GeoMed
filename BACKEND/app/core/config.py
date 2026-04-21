"""
Configuración central de la aplicación
"""
from pydantic_settings import BaseSettings
from functools import lru_cache
import os


class Settings(BaseSettings):
    """
    Configuración de la aplicación siguiendo principios SOLID.
    Todas las variables de entorno se definen aquí, centralizando la configuración.
    """
    
    # Configuración de la aplicación
    APP_NAME: str = "MECIA Auth API"
    DEBUG: bool = os.getenv("DEBUG", "False").lower() == "true"
    
    # Configuración de base de datos
    DATABASE_URL: str = os.getenv("DATABASE_URL", "postgresql://mecia_user:mecia_password@db:5432/mecia")
    LOCAL_DATABASE_URL: str = os.getenv("LOCAL_DATABASE_URL", "sqlite:///./mecia.db")
    DB_FALLBACK_TO_LOCAL: bool = os.getenv("DB_FALLBACK_TO_LOCAL", "False").lower() == "true"
    DB_CONNECT_TIMEOUT: int = int(os.getenv("DB_CONNECT_TIMEOUT", "8"))
    DB_PRECHECK_TIMEOUT: int = int(os.getenv("DB_PRECHECK_TIMEOUT", "8"))
    DB_USE_PRECHECK: bool = os.getenv("DB_USE_PRECHECK", "False").lower() == "true"
    
    # Configuración JWT (tokens de seguridad)
    SECRET_KEY: str = os.getenv(
        "SECRET_KEY",
        "tu-clave-secreta-super-segura-en-produccion-cambiar-esto"
    )
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7
    
    # Configuración de email (para recuperación de contraseña)
    SMTP_SERVER: str = os.getenv("SMTP_SERVER", "smtp.gmail.com")
    SMTP_PORT: int = int(os.getenv("SMTP_PORT", "587"))
    SMTP_USER: str = os.getenv("SMTP_USER", "")
    SMTP_PASSWORD: str = os.getenv("SMTP_PASSWORD", "")
    FROM_EMAIL: str = os.getenv("FROM_EMAIL", "noreply@mecia.com")
    
    # Configuración de CORS para frontend
    FRONTEND_URL: str = os.getenv("FRONTEND_URL", "http://localhost:5173")

    # Configuración de NewsAPI
    NEWS_API_KEY: str = os.getenv("NEWS_API_KEY", "")
    NEWS_API_BASE_URL: str = os.getenv("NEWS_API_BASE_URL", "https://newsapi.org/v2")

    # Configuración de LLM real
    OPENAI_API_KEY: str = os.getenv("OPENAI_API_KEY", "")
    GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY", "")
    # "openai" | "gemini" | "mock"
    LLM_PROVIDER: str = os.getenv("LLM_PROVIDER", "openai")

    # Bot de Telegram (ciudadano)
    TELEGRAM_BOT_TOKEN: str = os.getenv("TELEGRAM_BOT_TOKEN", "")
    
    # Validación de email
    EMAIL_RESET_TOKEN_EXPIRE_HOURS: int = 24
    
    class Config:
        env_file = ".env"
        case_sensitive = True


@lru_cache()
def get_settings() -> Settings:
    """
    Dependencia singleton para obtener configuración.
    Se cachea para evitar crear múltiples instancias.
    
    Returns:
        Settings: Instancia con la configuración de la aplicación
    """
    return Settings()
