# MECIA - Sistema de Información para Emprendedores y Ciudadanos en Medellín

Plataforma integral que combina inteligencia artificial, análisis de datos y seguridad para emprendedores y ciudadanos en Medellín.

## 🚀 Inicio Rápido con Docker

Para facilitar la configuración, el proyecto incluye configuración Docker completa.

1. **Clona el repositorio y configura:**
   ```bash
   git clone <url-del-repositorio>
   cd MECIA
   cp DOCKER/.env.example .env
   # Edita .env con tus claves API
   ```

2. **Ejecuta con Docker:**
   ```bash
   ./setup.sh
   ```
   O para desarrollo con hot reload automático:
   ```bash
   cd DOCKER
   docker-compose -f docker-compose.dev.yml up
   ```

3. **Accede a la aplicación:**
   - Frontend: http://localhost:3000
   - API Docs: http://localhost:8000/docs

Ver [DOCKER/README.md](DOCKER/README.md) para la estructura Docker, [DOCKER/MODES.md](DOCKER/MODES.md) para modos de desarrollo, y [DOCKER/DOCKER_README.md](DOCKER/DOCKER_README.md) para instrucciones detalladas.

## 🏗️ Arquitectura del Proyecto

### Backend (FastAPI)
- ✅ API REST con autenticación JWT
- ✅ Arquitectura profesional (SOLID)
- ✅ Base de datos con SQLAlchemy
- ✅ Sistema de roles (Emprendedor/Ciudadano)

### Frontend (React + Vite)
- ✅ Componentes de autenticación (wireframes)
- ✅ Rutas protegidas
- ✅ Integración con API
- ✅ Estructura lista para development

## 🎯 Funcionalidades

### ✅ Sistema de Autenticación (COMPLETADO)

**Backend:**
- Registro de usuarios
- Login/Logout con JWT
- Recuperación de contraseña
- Tokens de acceso y refresh
- Validación de datos con Pydantic

**Frontend:**
- Formularios de autenticación (wireframes)
- Rutas protegidas automáticas
- Servicio de autenticación
- Integración con API

### 👨‍💼 EMPRENDEDOR - Funcionalidades Planeadas

1. **Chatbot de Clasificación**
   - Análisis de tipo de negocio
   - Diccionario de palabras para validar queries
   - Feedback personalizado

2. **Recomendación de Zonas**
   - Mapa interactivo de Medellín
   - Análisis de seguridad por zona
   - Información de servicios disponibles
   - Comparativa con negocios similares

3. **Dashboard de Datos**
   - Gráficas de seguridad
   - Información de competencia
   - Análisis de viabilidad
   - Datos de servicios e infraestructura

### 👥 CIUDADANO - Funcionalidades Planeadas

1. **Feed de Noticias**
   - Novedades de Medellín
   - Alertas de seguridad
   - Información local

2. **Chatbot de Seguridad**
   - Recomendaciones personalizadas
   - Análisis de zona antes de salir
   - Rutas seguras

3. **Módulo de Servicios**
   - Facturación actual
   - Análisis de gastos históricos
   - Predicciones de consumo

4. **Módulo de Seguridad**
   - Información por zona
   - Mapas de seguridad
   - Recomendaciones

5. **Premium Features**
   - Historial de conversaciones
   - Integración con Telegram Bot
   - Audio para discapacidad visual
   - Recordar contexto de chats

## 🚀 Inicio Rápido

### Backend

```bash
cd BACKEND
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
uvicorn app.main:app --reload
```

**API en:** http://localhost:8000
**Docs:** http://localhost:8000/api/docs

### Frontend

```bash
cd FRONTEND
npm install
cp .env.example .env.local
npm run dev
```

**Frontend en:** http://localhost:5173

## 📋 Endpoints Principales

```
POST   /api/auth/register              # Registro
POST   /api/auth/login                 # Login
POST   /api/auth/refresh               # Renovar token
GET    /api/auth/me                    # Usuario actual
POST   /api/auth/password-reset-request # Reset contraseña
POST   /api/auth/password-reset-confirm # Confirmar reset
```

## 🔐 Autenticación

1. Usuario se registra o inicia sesión
2. Recibe `access_token` y `refresh_token`  
3. Envía token en header: `Authorization: Bearer <token>`
4. Si expira, usa refresh para obtener uno nuevo

## 🎨 Stack Tecnológico

**Backend:**
- FastAPI, SQLAlchemy, Pydantic, PyJWT, Passlib

**Frontend:**
- React 18, Vite, React Router, Tailwind CSS

## 👥 Roles

| Rol | Acceso |
|-----|--------|
| **EMPRENDEDOR** | Dashboard de emprendedor, Chatbot, Mapas, Análisis |
| **CIUDADANO** | Dashboard ciudadano, Noticias, Chatbot seguridad |

## 📚 Documentación

- [Backend](./BACKEND/README.md) - API y arquitectura
- [Frontend](./FRONTEND/README.md) - Componentes y rutas

## 🗺️ Estado del Proyecto

```
✅ Autenticación JWT completa
✅ Base de datos con roles
✅ Frontend con wireframes
🚧 Estilos UI/UX
🚧 Chatbot integración IA
🚧 Mapas interactivos
🚧 Análisis de datos
🚧 Email service
```

---

**MECIA - Emprendimiento Seguro para Medellín** 🚀

EMPRENDEDOR:
Se abrirá un chatbot. El chatbot mostrará un ejemplo de como puede ser el prompt, depende del prompt hará una clasificación del negocio. Ejemplo:


<img width="421" height="472" alt="image" src="https://github.com/user-attachments/assets/1e2f41cf-5dca-4183-8b3b-e75faa4875f5" />




Debemos agregar un diccionario de palabras para que la IA sea un poco más sólida y diga algo como: “”No estoy entrenado para responder esta pregunta, vuelve a formular tú prompt y vuelve a intentarlo”.

 Esto generará un mapa de la zona, le indicará la mejor zona, gráficas, noticias de la zona e información de negocios cercanos (si es de comida rápida, ropa, etc.). Además también soltaría datos de seguridad de la zona y así poder que el emprendedor llegue a una conclusión donde haya tomado en cuenta los servicios y la seguridad de su negocio. 

CIUDADANO:
Se abrirá una dashboard donde en principio salga una apartado de noticias con novedades, noticias de Medellín. Otro sitio con un chatbot enfocado para ver si el usuario va a salir y de recomendaciones de seguridad. Sidebar con los dos módulos (servicios y seguridad). En el módulo de servicios adjuntar la factura actual de sus servicios y que le dé recomendaciones, según el historial de sus gastos pueda soltar una “predicción”, más que una predicción sería como un cálculo tomando en cuenta el histórico.
Agregar un apartado donde diga “Ir a telegram”, esto para hacer uso de la herramienta sin estar en la web.

Dependiendo de la pregunta del ciudadano al modelo, el modelo generará imágenes o información visual sobre la pregunta. Volvemos al EJEMPLO de la fiesta, el modelo podría crear un mapa de la zona o un mapa de las zonas más seguras e inseguras.

PLUS GANADOR
Crear un apartado donde el ciudadano/empresario pueda ver el historial de conversaciones. El modelo NO RECUERDA pero sí lo guarda.

Función para personas con discapacidad visual. Dependiendo de donde el usuario esté parado generar una voz que diga lo que dice donde está ubicado. Esto lo podríamos hacer generando un audio apenas entrar a la página y que salta un modal con la pregunta de si tiene dificultad visual o no.
