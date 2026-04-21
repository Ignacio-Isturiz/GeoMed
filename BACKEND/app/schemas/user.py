"""
Esquemas Pydantic para validación de datos
Aplica el principio de separación entre modelos de BD y DTOs (Data Transfer Objects)
"""
from pydantic import BaseModel, EmailStr, Field
from typing import Optional
from datetime import datetime


class UserBase(BaseModel):
    """Base para todos los esquemas de usuario"""
    email: EmailStr
    full_name: str = Field(..., min_length=2, max_length=100)


class UserRegister(UserBase):
    """Schema para registro de usuarios"""
    password: str = Field(..., min_length=8, max_length=72)  # Bcrypt tiene límite de 72 bytes
    role: str = Field(default="ciudadano", pattern="^(emprendedor|ciudadano)$")


class UserLogin(BaseModel):
    """Schema para login"""
    email: EmailStr
    password: str


class UserPasswordReset(BaseModel):
    """Schema para solicitar reset de contraseña"""
    email: EmailStr


class UserPasswordResetConfirm(BaseModel):
    """Schema para confirmar reset de contraseña"""
    token: str
    new_password: str = Field(..., min_length=8, max_length=72)  # Bcrypt tiene límite de 72 bytes


class UserResponse(UserBase):
    """Schema para respuesta de usuario (sin contraseña)"""
    id: str
    role: str
    is_active: bool
    is_verified: bool
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True


class TokenResponse(BaseModel):
    """Schema para respuesta con tokens"""
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    user: UserResponse


class RefreshTokenRequest(BaseModel):
    """Schema para solicitud de refresh token"""
    refresh_token: str


class AccessTokenResponse(BaseModel):
    """Schema para nuevo access token"""
    access_token: str
    token_type: str = "bearer"
