"""
Dependencias de FastAPI: inyección de dependencias
Aplica Dependency Inversion Principle de SOLID
"""
from fastapi import Depends, HTTPException, status, Header
from sqlalchemy.orm import Session
from typing import Optional

from app.core.database import get_db
from app.repositories.user import UserRepository
from app.services.auth import AuthService
from app.core.security import security_manager
from app.models.user import User
from app.core.exceptions import InvalidTokenException

import logging

logger = logging.getLogger(__name__)


def get_user_repository(db: Session = Depends(get_db)) -> UserRepository:
    """
    Proporciona una instancia del repositorio de usuarios.
    
    Args:
        db: Sesión de BD inyectada
        
    Returns:
        Instancia del repositorio
    """
    return UserRepository(db)


def get_auth_service(
    user_repository: UserRepository = Depends(get_user_repository)
) -> AuthService:
    """
    Proporciona una instancia del servicio de autenticación.
    
    Args:
        user_repository: Repositorio inyectado
        
    Returns:
        Instancia del servicio
    """
    return AuthService(
        user_repository=user_repository,
        security_manager=security_manager
    )



# Extractor de token del header (helper)
async def get_token_from_header(
    authorization: Optional[str] = Header(None),
) -> Optional[str]:
    """
    Extrae el token JWT del header Authorization.
    """
    if not authorization:
        logger.warning("No Authorization header provided")
        return None
    
    parts = authorization.split()
    if len(parts) != 2:
        logger.warning(f"Invalid Authorization header format: {len(parts)} parts")
        return None
        
    if parts[0].lower() != "bearer":
        logger.warning(f"Invalid Authorization prefix: {parts[0]}")
        return None
    
    return parts[1]


async def get_current_user(
    token: str = Depends(get_token_from_header),
    auth_service: AuthService = Depends(get_auth_service)
) -> User:
    """
    Obtiene el usuario actual desde el token en Authorization header.
    """
    if not token:
        logger.error("Token extraction failed (None value)")
        raise InvalidTokenException()
    
    user = await auth_service.get_user_by_token(token)
    
    if not user:
        logger.error("User not found for provided token or token expired/invalid")
        raise InvalidTokenException()
    
    if not user.is_active:
        logger.warning(f"Inactive user attempted access: {user.email}")
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Usuario inactivo"
        )
    
    return user
