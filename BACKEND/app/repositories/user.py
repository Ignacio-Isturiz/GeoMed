"""
Capa de repositorio: acceso a datos
Aplica Repository Pattern y Dependency Inversion Principle de SOLID
Permite cambiar la implementación de BD sin afectar la lógica de negocio
"""
from abc import ABC, abstractmethod
from typing import Optional
from sqlalchemy.orm import Session
from sqlalchemy import select
import uuid

from app.models.user import User
from app.core.exceptions import UserNotFoundException, UserAlreadyExistsException


class IUserRepository(ABC):
    """
    Interfaz para el repositorio de usuarios.
    Define los métodos que debe implementar cualquier repositorio de usuarios.
    """
    
    @abstractmethod
    async def get_by_email(self, email: str) -> Optional[User]:
        """Obtiene un usuario por email"""
        pass
    
    @abstractmethod
    async def get_by_id(self, user_id: str) -> Optional[User]:
        """Obtiene un usuario por ID"""
        pass
    
    @abstractmethod
    async def create(self, email: str, full_name: str, hashed_password: str, role: str) -> User:
        """Crea un nuevo usuario"""
        pass
    
    @abstractmethod
    async def update(self, user_id: str, **kwargs) -> User:
        """Actualiza un usuario"""
        pass


class UserRepository(IUserRepository):
    """
    Implementación concreta del repositorio de usuarios con SQLAlchemy.
    Single Responsibility: solo se encarga del acceso a datos.
    """
    
    def __init__(self, db: Session):
        """
        Args:
            db: Sesión de SQLAlchemy inyectada por FastAPI
        """
        self.db = db
    
    async def get_by_email(self, email: str) -> Optional[User]:
        """
        Busca un usuario por email.
        
        Args:
            email: Email del usuario
            
        Returns:
            Usuario si existe, None en caso contrario
        """
        user = self.db.query(User).filter(User.email == email).first()
        return user
    
    async def get_by_id(self, user_id: str) -> Optional[User]:
        """
        Busca un usuario por ID.
        
        Args:
            user_id: ID del usuario
            
        Returns:
            Usuario si existe, None en caso contrario
        """
        user = self.db.query(User).filter(User.id == user_id).first()
        return user
    
    async def create(
        self,
        email: str,
        full_name: str,
        hashed_password: str,
        role: str
    ) -> User:
        """
        Crea un nuevo usuario.
        
        Args:
            email: Email único
            full_name: Nombre completo
            hashed_password: Contraseña hasheada
            role: Rol del usuario (emprendedor/ciudadano)
            
        Returns:
            Usuario creado
            
        Raises:
            UserAlreadyExistsException: Si el email ya existe
        """
        # Verificar que el usuario no exista
        existing_user = await self.get_by_email(email)
        if existing_user:
            raise UserAlreadyExistsException()
        
        # Crear nuevo usuario
        user = User(
            id=str(uuid.uuid4()),
            email=email,
            full_name=full_name,
            hashed_password=hashed_password,
            role=role
        )
        self.db.add(user)
        self.db.commit()
        self.db.refresh(user)
        
        return user
    
    async def update(self, user_id: str, **kwargs) -> User:
        """
        Actualiza un usuario.
        
        Args:
            user_id: ID del usuario a actualizar
            **kwargs: Campos a actualizar
            
        Returns:
            Usuario actualizado
            
        Raises:
            UserNotFoundException: Si no existe el usuario
        """
        user = await self.get_by_id(user_id)
        if not user:
            raise UserNotFoundException()
        
        for key, value in kwargs.items():
            if hasattr(user, key):
                setattr(user, key, value)
        
        self.db.commit()
        self.db.refresh(user)
        
        return user
