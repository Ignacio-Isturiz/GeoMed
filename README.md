# GEOMED - Sistema de Información Ciudadana para Medellín

Plataforma integral que combina inteligencia artificial, análisis de datos y seguridad para apoyar decisiones ciudadanas en Medellín.

## 🚀 Inicio Rápido con Docker

Para facilitar la configuración, el proyecto incluye configuración Docker completa.

1. **Clona el repositorio y configura:**
   ```bash
   git clone <url-del-repositorio>
   cd GEOMED
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
- ✅ Flujo de usuario único

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

### 👥 Funcionalidades Ciudadanas

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

5. **Funciones Extendidas**
   - Historial de conversaciones
   - Integración con Telegram Bot

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

## 📚 Documentación

- [Backend](./BACKEND/README.md) - API y arquitectura
- [Frontend](./FRONTEND/README.md) - Componentes y rutas

## 🗺️ Estado del Proyecto

```
✅ Autenticación JWT completa
✅ Base de datos operativa
✅ Frontend con wireframes
🚧 Estilos UI/UX
🚧 Chatbot integración IA
🚧 Mapas interactivos
🚧 Análisis de datos
🚧 Email service
```

---

**GEOMED - Inteligencia Ciudadana para Medellín** 🚀

CHAT CIUDADANO:
Se abrirá un chatbot para consultas de seguridad y contexto urbano. Ejemplo:


<img width="421" height="472" alt="image" src="https://github.com/user-attachments/assets/1e2f41cf-5dca-4183-8b3b-e75faa4875f5" />




El modelo puede generar un mapa de la zona, resúmenes y visualizaciones para apoyar decisiones de movilidad y seguridad.

CIUDADANO:
Se abrirá una dashboard donde en principio salga una apartado de noticias con novedades, noticias de Medellín. Otro sitio con un chatbot enfocado para ver si el usuario va a salir y de recomendaciones de seguridad. Sidebar con los dos módulos (servicios y seguridad). En el módulo de servicios adjuntar la factura actual de sus servicios y que le dé recomendaciones, según el historial de sus gastos pueda soltar una “predicción”, más que una predicción sería como un cálculo tomando en cuenta el histórico.
Agregar un apartado donde diga “Ir a telegram”, esto para hacer uso de la herramienta sin estar en la web.

Dependiendo de la pregunta del ciudadano al modelo, el modelo generará imágenes o información visual sobre la pregunta. Volvemos al EJEMPLO de la fiesta, el modelo podría crear un mapa de la zona o un mapa de las zonas más seguras e inseguras.

PLUS
Crear un apartado donde el ciudadano pueda ver el historial de conversaciones. El modelo NO RECUERDA pero sí lo guarda.
