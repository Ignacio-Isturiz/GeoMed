"""
Módulo de seguridad: autenticación con JWT y hashing de contraseñas
Principio SOLID: Single Responsibility - cada función tiene una responsabilidad única
"""
from datetime import datetime, timedelta
from typing import Optional
from jose import JWTError, jwt
import bcrypt
from app.core.config import get_settings


class SecurityManager:
    """
    Clase que gestiona toda la seguridad de la aplicación.
    Aplica Single Responsibility: solo se encarga de seguridad.
    """
    
    def __init__(self):
        self.settings = get_settings()
    
    def hash_password(self, password: str) -> str:
        """
        Hashea una contraseña de forma irreversible.
        Nota: Bcrypt tiene límite de 72 bytes, así que truncamos por seguridad.
        
        Args:
            password: Contraseña en texto plano
            
        Returns:
            Contraseña hasheada
        """
        # Truncar a 72 bytes para cumplir con límite de bcrypt
        password_truncated = password.encode('utf-8')[:72]
        salt = bcrypt.gensalt()
        hashed = bcrypt.hashpw(password_truncated, salt)
        return hashed.decode('utf-8')
    
    def verify_password(self, plain_password: str, hashed_password: str) -> bool:
        """
        Verifica si una contraseña coincide con su hash.
        
        Args:
            plain_password: Contraseña en texto plano
            hashed_password: Contraseña hasheada
            
        Returns:
            True si coinciden, False en caso contrario
        """
        # Truncar a 72 bytes como en hashing
        password_truncated = plain_password.encode('utf-8')[:72]
        hashed_password_bytes = hashed_password.encode('utf-8')
        return bcrypt.checkpw(password_truncated, hashed_password_bytes)
    
    def create_access_token(self, subject: str, expires_delta: Optional[timedelta] = None) -> str:
        """
        Crea un JWT para acceso (corta duración).
        
        Args:
            subject: Identificador del usuario (generalmente el email)
            expires_delta: Timedelta custom (si no se proporciona, usa la config)
            
        Returns:
            Token JWT codificado
        """
        if expires_delta:
            expire = datetime.utcnow() + expires_delta
        else:
            expire = datetime.utcnow() + timedelta(
                minutes=self.settings.ACCESS_TOKEN_EXPIRE_MINUTES
            )
        
        to_encode = {"exp": expire, "sub": subject, "type": "access"}
        encoded_jwt = jwt.encode(
            to_encode,
            self.settings.SECRET_KEY,
            algorithm=self.settings.ALGORITHM
        )
        return encoded_jwt
    
    def create_refresh_token(self, subject: str) -> str:
        """
        Crea un JWT para refresh (larga duración).
        
        Args:
            subject: Identificador del usuario
            
        Returns:
            Token JWT codificado para refresh
        """
        expire = datetime.utcnow() + timedelta(days=self.settings.REFRESH_TOKEN_EXPIRE_DAYS)
        to_encode = {"exp": expire, "sub": subject, "type": "refresh"}
        encoded_jwt = jwt.encode(
            to_encode,
            self.settings.SECRET_KEY,
            algorithm=self.settings.ALGORITHM
        )
        return encoded_jwt
    
    def create_reset_token(self, subject: str) -> str:
        """
        Crea un token temporal para reseteo de contraseña.
        
        Args:
            subject: Email del usuario
            
        Returns:
            Token JWT con corta duración
        """
        expire = datetime.utcnow() + timedelta(
            hours=self.settings.EMAIL_RESET_TOKEN_EXPIRE_HOURS
        )
        to_encode = {"exp": expire, "sub": subject, "type": "reset"}
        encoded_jwt = jwt.encode(
            to_encode,
            self.settings.SECRET_KEY,
            algorithm=self.settings.ALGORITHM
        )
        return encoded_jwt
    
    def verify_token(self, token: str, token_type: str = "access") -> Optional[str]:
        """
        Verifica y decodifica un JWT.
        
        Args:
            token: Token JWT a verificar
            token_type: Tipo de token esperado (access, refresh, reset)
            
        Returns:
            El subject (email/id) si es válido, None si no
            
        Raises:
            JWTError: Si el token es inválido
        """
        try:
            payload = jwt.decode(
                token,
                self.settings.SECRET_KEY,
                algorithms=[self.settings.ALGORITHM]
            )
            token_subject: str = payload.get("sub")
            token_type_in_payload: str = payload.get("type")
            
            if token_subject is None or token_type_in_payload != token_type:
                return None
                
            return token_subject
        except JWTError:
            return None


# Instancia singleton para usar en la aplicación
security_manager = SecurityManager()
