"""
Rutas (endpoints) de autenticación
Capa de presentación: solo se encarga de validar entrada/salida HTTP
"""
from fastapi import APIRouter, Depends, Header, status
from typing import Optional

from app.core.dependencies import get_auth_service, get_token_from_header, get_current_user
from app.services.auth import AuthService
from app.models.user import User
from app.schemas.user import (
    UserRegister,
    UserLogin,
    UserPasswordReset,
    UserPasswordResetConfirm,
    TokenResponse,
    RefreshTokenRequest,
    AccessTokenResponse,
    UserResponse
)

router = APIRouter(prefix="/api/auth", tags=["auth"])


@router.post(
    "/register",
    response_model=TokenResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Registrar nuevo usuario",
    description="Crea una nueva cuenta y devuelve tokens de autenticación"
)
async def register(
    user_data: UserRegister,
    auth_service: AuthService = Depends(get_auth_service)
):
    """
    Registra un nuevo usuario en el sistema.
    
    - **email**: Email válido único
    - **full_name**: Nombre completo (mínimo 2 caracteres)
    - **password**: Contraseña (mínimo 8 caracteres)
    - **role**: "emprendedor" o "ciudadano"
    
    Devuelve tokens JWT para autenticación automática.
    """
    user, access_token, refresh_token = await auth_service.register(user_data)
    
    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "bearer",
        "user": UserResponse.from_orm(user)
    }


@router.post(
    "/login",
    response_model=TokenResponse,
    summary="Iniciar sesión",
    description="Autentica un usuario y devuelve tokens JWT"
)
async def login(
    login_data: UserLogin,
    auth_service: AuthService = Depends(get_auth_service)
):
    """
    Autentica un usuario con email y contraseña.
    
    Devuelve:
    - **access_token**: Token JWT para acceso (corta duración)
    - **refresh_token**: Token para renovar el access_token
    - **user**: Información del usuario
    """
    user, access_token, refresh_token = await auth_service.login(login_data)
    
    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "bearer",
        "user": UserResponse.from_orm(user)
    }


@router.post(
    "/refresh",
    response_model=AccessTokenResponse,
    summary="Renovar access token",
    description="Genera un nuevo access token usando un refresh token válido"
)
async def refresh_token(
    request: RefreshTokenRequest,
    auth_service: AuthService = Depends(get_auth_service)
):
    """
    Genera un nuevo access token.
    
    El refresh_token tiene mayor duración y se usa para obtener
    nuevos access tokens sin que el usuario vuelva a autenticarse.
    """
    access_token = await auth_service.refresh_access_token(request.refresh_token)
    
    return {
        "access_token": access_token,
        "token_type": "bearer"
    }


@router.post(
    "/password-reset-request",
    status_code=status.HTTP_200_OK,
    summary="Solicitar reseteo de contraseña",
    description="Envía un email con un enlace para resetear la contraseña"
)
async def request_password_reset(
    data: UserPasswordReset,
    auth_service: AuthService = Depends(get_auth_service)
):
    """
    Solicita un reseteo de contraseña.
    
    Se envía un token al email del usuario para confirmar la identidad.
    Este token debe usarse en el endpoint de confirmación.
    
    En una aplicación real, aquí se enviaría un email con el token.
    """
    reset_token = await auth_service.request_password_reset(data.email)
    
    # En producción, aquí se enviaría un email al usuario
    # Por ahora devolvemos el token para testing
    return {
        "message": "Si el email existe en el sistema, recibirá un link de reseteo",
        "reset_token": reset_token  # Esto solo es para desarrollo/testing
    }


@router.post(
    "/password-reset-confirm",
    response_model=UserResponse,
    summary="Confirmar reseteo de contraseña",
    description="Completa el reseteo de contraseña con el token valido"
)
async def reset_password_confirm(
    data: UserPasswordResetConfirm,
    auth_service: AuthService = Depends(get_auth_service)
):
    """
    Completa el reseteo de contraseña.
    
    El cliente debe proporcionar:
    - **token**: Token recibido por email
    - **new_password**: Nueva contraseña (mínimo 8 caracteres)
    """
    user = await auth_service.reset_password(data.token, data.new_password)
    
    return UserResponse.from_orm(user)


@router.get(
    "/me",
    response_model=UserResponse,
    summary="Obtener usuario actual",
    description="Devuelve la información del usuario autenticado"
)
async def get_me(
    authorization: Optional[str] = Header(None),
    auth_service: AuthService = Depends(get_auth_service)
):
    """
    Obtiene los datos del usuario autenticado actualmente.
    
    Requiere enviar el token JWT en el header:
    Authorization: Bearer <access_token>
    """
    token = await get_token_from_header(authorization)
    user = await auth_service.get_user_by_token(token)
    
    if not user:
        from app.core.exceptions import InvalidTokenException
        raise InvalidTokenException()
    
    return UserResponse.from_orm(user)
