"""
Configuración de base de datos con SQLAlchemy
"""
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, Session
from app.core.config import get_settings
import logging
import socket
from urllib.parse import urlparse
from sqlalchemy.exc import OperationalError

settings = get_settings()
logger = logging.getLogger(__name__)


def _build_engine(database_url: str):
    connect_args = {}
    if "sqlite" in database_url:
        connect_args = {"check_same_thread": False}
    elif database_url.startswith("postgresql"):
        connect_args = {"connect_timeout": settings.DB_CONNECT_TIMEOUT}

    return create_engine(
        database_url,
        connect_args=connect_args
    )

# Crear engine de SQLAlchemy
engine = _build_engine(settings.DATABASE_URL)

# Crear SessionLocal para obtener sesiones
SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine
)

def _set_engine(database_url: str) -> None:
    global engine, SessionLocal
    engine = _build_engine(database_url)
    SessionLocal = sessionmaker(
        autocommit=False,
        autoflush=False,
        bind=engine
    )


def _can_reach_postgres(database_url: str, timeout_seconds: int = 2) -> bool:
    """Verifica conectividad TCP básica al host:puerto de PostgreSQL."""
    parsed = urlparse(database_url)
    host = parsed.hostname
    port = parsed.port or 5432

    if not host:
        return False

    try:
        with socket.create_connection((host, port), timeout=timeout_seconds):
            return True
    except OSError:
        return False


def get_db() -> Session:
    """
    Dependencia para obtener sesión de base de datos.
    Se usa con FastAPI Depends().
    
    Yields:
        Sesión de SQLAlchemy
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def init_db():
    """
    Inicializa la base de datos creando todas las tablas.
    Se llama una sola vez al arrancar la aplicación.
    """
    from app.models.user import Base
    from app.models.conversation import Conversation, Message  # Ensure models are imported

    should_fallback = (
        settings.DB_FALLBACK_TO_LOCAL
        and settings.LOCAL_DATABASE_URL
        and settings.LOCAL_DATABASE_URL != settings.DATABASE_URL
    )

    if (
        should_fallback
        and settings.DATABASE_URL.startswith("postgresql")
        and settings.DB_USE_PRECHECK
    ):
        if not _can_reach_postgres(settings.DATABASE_URL, timeout_seconds=settings.DB_PRECHECK_TIMEOUT):
            logger.warning(
                "Sin conectividad a PostgreSQL en red actual. Usando fallback local %s.",
                settings.LOCAL_DATABASE_URL,
            )
            _set_engine(settings.LOCAL_DATABASE_URL)

    try:
        Base.metadata.create_all(bind=engine)
    except OperationalError as exc:
        if not should_fallback:
            raise

        logger.warning(
            "No se pudo conectar a DATABASE_URL. Activando fallback local a %s. Error: %s",
            settings.LOCAL_DATABASE_URL,
            str(exc),
        )
        _set_engine(settings.LOCAL_DATABASE_URL)
        Base.metadata.create_all(bind=engine)
