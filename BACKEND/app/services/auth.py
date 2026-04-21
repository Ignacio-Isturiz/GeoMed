"""
Servicio de autenticación: lógica de negocio
Aplica Single Responsibility Principle: solo se encarga de la lógica de autenticación
Depende de inyección: repositorio, gestor de seguridad, gestor de email
"""
from typing import Optional
from app.repositories.user import IUserRepository
from app.core.security import SecurityManager
from app.models.user import User
from app.schemas.user import UserRegister, UserLogin
from app.core.exceptions import (
    InvalidCredentialsException,
    UserAlreadyExistsException,
    UserNotFoundException,
    InvalidTokenException,
    PasswordResetTokenNotFoundException
)


class AuthService:
    """
    Servicio de autenticación.
    Encapsula toda la lógica de negocio de autenticación.
    Depende de abstracciones (inyección de dependencias).
    """
    
    def __init__(
        self,
        user_repository: IUserRepository,
        security_manager: SecurityManager
    ):
        """
        Args:
            user_repository: Implementación del repositorio de usuarios
            security_manager: Gestor de seguridad (JWT y hashing)
        """
        self.user_repository = user_repository
        self.security_manager = security_manager
    
    async def register(self, user_data: UserRegister) -> tuple[User, str, str]:
        """
        Registra un nuevo usuario.
        
        Args:
            user_data: Datos del usuario a registrar
            
        Returns:
            Tupla con (usuario, access_token, refresh_token)
            
        Raises:
            UserAlreadyExistsException: Si el email ya está en uso
        """
        # Hashear contraseña
        hashed_password = self.security_manager.hash_password(user_data.password)
        
        # Crear usuario (el repositorio lanza excepción si existe)
        user = await self.user_repository.create(
            email=user_data.email,
            full_name=user_data.full_name,
            hashed_password=hashed_password,
            role=user_data.role
        )
        
        # Generar tokens
        access_token = self.security_manager.create_access_token(subject=user.email)
        refresh_token = self.security_manager.create_refresh_token(subject=user.email)
        
        return user, access_token, refresh_token
    
    async def login(self, login_data: UserLogin) -> tuple[User, str, str]:
        """
        Autentica un usuario y genera tokens.
        
        Args:
            login_data: Email y contraseña del usuario
            
        Returns:
            Tupla con (usuario, access_token, refresh_token)
            
        Raises:
            InvalidCredentialsException: Si las credenciales son inválidas
        """
        # Buscar usuario por email
        user = await self.user_repository.get_by_email(login_data.email)
        
        if not user:
            raise InvalidCredentialsException()
        
        # Verificar contraseña
        if not self.security_manager.verify_password(
            login_data.password,
            user.hashed_password
        ):
            raise InvalidCredentialsException()
        
        # Generar tokens
        access_token = self.security_manager.create_access_token(subject=user.email)
        refresh_token = self.security_manager.create_refresh_token(subject=user.email)
        
        return user, access_token, refresh_token
    
    async def refresh_access_token(self, refresh_token: str) -> str:
        """
        Genera un nuevo access token usando un refresh token válido.
        
        Args:
            refresh_token: Token refresh válido
            
        Returns:
            Nuevo access token
            
        Raises:
            InvalidTokenException: Si el refresh token es inválido
        """
        # Verificar token
        subject = self.security_manager.verify_token(refresh_token, token_type="refresh")
        
        if not subject:
            raise InvalidTokenException()
        
        # Generar nuevo access token
        access_token = self.security_manager.create_access_token(subject=subject)
        
        return access_token
    
    async def request_password_reset(self, email: str) -> str:
        """
        Genera un token para reset de contraseña.
        
        Args:
            email: Email del usuario
            
        Returns:
            Token para reset (normalmente se envía por email)
            
        Raises:
            UserNotFoundException: Si el usuario no existe
        """
        user = await self.user_repository.get_by_email(email)
        
        if not user:
            raise UserNotFoundException()
        
        # Generar token temporal
        reset_token = self.security_manager.create_reset_token(subject=email)
        
        return reset_token
    
    async def reset_password(self, reset_token: str, new_password: str) -> User:
        """
        Resetea la contraseña de un usuario usando un token válido.
        
        Args:
            reset_token: Token de reset válido
            new_password: Nueva contraseña
            
        Returns:
            Usuario actualizado
            
        Raises:
            PasswordResetTokenNotFoundException: Si el token es inválido
            UserNotFoundException: Si el usuario no existe
        """
        # Verificar token
        email = self.security_manager.verify_token(reset_token, token_type="reset")
        
        if not email:
            raise PasswordResetTokenNotFoundException()
        
        # Buscar usuario
        user = await self.user_repository.get_by_email(email)
        
        if not user:
            raise UserNotFoundException()
        
        # Actualizar contraseña
        hashed_password = self.security_manager.hash_password(new_password)
        updated_user = await self.user_repository.update(
            user.id,
            hashed_password=hashed_password
        )
        
        return updated_user
    
    async def get_user_by_token(self, token: str) -> Optional[User]:
        """
        Obtiene un usuario validando su access token.
        
        Args:
            token: Access token
            
        Returns:
            Usuario si el token es válido, None en caso contrario
        """
        email = self.security_manager.verify_token(token, token_type="access")
        
        if not email:
            return None
        
        user = await self.user_repository.get_by_email(email)
        return user
