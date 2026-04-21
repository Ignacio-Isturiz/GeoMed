"""
Excepciones personalizadas de la aplicación
Principio: Claridad en el manejo de errores
"""
from fastapi import HTTPException, status


class UserAlreadyExistsException(HTTPException):
    """Usuario ya existe en la base de datos"""
    def __init__(self):
        super().__init__(
            status_code=status.HTTP_409_CONFLICT,
            detail="El usuario con este email ya existe"
        )


class UserNotFoundException(HTTPException):
    """Usuario no encontrado"""
    def __init__(self):
        super().__init__(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Usuario no encontrado"
        )


class InvalidCredentialsException(HTTPException):
    """Credenciales inválidas"""
    def __init__(self):
        super().__init__(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Email o contraseña incorrectos",
            headers={"WWW-Authenticate": "Bearer"}
        )


class InvalidTokenException(HTTPException):
    """Token inválido o expirado"""
    def __init__(self):
        super().__init__(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token inválido o expirado",
            headers={"WWW-Authenticate": "Bearer"}
        )


class InactiveUserException(HTTPException):
    """Usuario inactivo"""
    def __init__(self):
        super().__init__(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Usuario inactivo"
        )


class PasswordResetTokenNotFoundException(HTTPException):
    """Token de reset de contraseña no válido"""
    def __init__(self):
        super().__init__(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Token de reset inválido o expirado"
        )
