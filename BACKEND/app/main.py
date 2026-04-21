"""
Aplicación principal de FastAPI
Punto de entrada de la API
"""
from fastapi import FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import logging

from app.core.config import get_settings
from app.core.database import init_db
from app.routers import auth, datasets, news, llm

# Configurar logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Obtener configuración
settings = get_settings()

# Crear aplicación FastAPI
app = FastAPI(
    title=settings.APP_NAME,
    description="API de autenticación para MECIA - Emprendedores y Ciudadanos",
    version="1.0.0",
    docs_url="/api/docs",
    openapi_url="/api/openapi.json"
)

# Configurar CORS para permitir requests del frontend (DEBE ser ANTES de los routers)
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        settings.FRONTEND_URL,
        "http://localhost:3000",
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:5174",
        "http://127.0.0.1:5174",
        "*"
    ],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
    allow_headers=["*"],
    expose_headers=["*"],
)

# Inicializar base de datos
@app.on_event("startup")
async def startup_event():
    """Se ejecuta cuando inicia la aplicación"""
    logger.info("Inicializando base de datos...")
    init_db()
    logger.info("Base de datos inicializada")


# Incluir routers
app.include_router(auth.router)
app.include_router(datasets.router)
app.include_router(news.router)
app.include_router(llm.router)


# Health check
@app.get("/api/health", tags=["health"])
async def health_check():
    """Verificar que la API está en línea"""
    return {"status": "healthy", "service": settings.APP_NAME}


# Root endpoint
@app.get("/", tags=["info"])
async def root():
    """Información de la API"""
    return {
        "name": settings.APP_NAME,
        "version": "1.0.0",
        "docs": "/api/docs",
        "auth_endpoints": {
            "register": "POST /api/auth/register",
            "login": "POST /api/auth/login",
            "refresh": "POST /api/auth/refresh",
            "password_reset": "POST /api/auth/password-reset-request",
            "password_reset_confirm": "POST /api/auth/password-reset-confirm",
            "me": "GET /api/auth/me"
        }
    }


# Manejador global de excepciones
@app.exception_handler(Exception)
async def global_exception_handler(request, exc):
    """Maneja excepciones no capturadas"""
    logger.error(f"Excepción no manejada: {str(exc)}")
    
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={"detail": "Error interno del servidor"}
    )


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=8000,
        reload=settings.DEBUG
    )
