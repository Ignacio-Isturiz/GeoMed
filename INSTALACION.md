# MECIA - Guía de Instalación y Ejecución Rápida

## 🎯 Resumen

Se ha implementado:
- ✅ Backend completo en FastAPI con autenticación JWT
- ✅ Arquitectura profesional con principios SOLID
- ✅ Frontend con wireframes de autenticación listos
- ✅ Sistema de login, registro y recuperación de contraseña
- ⚠️ Falta: `npm install react-router-dom` en frontend

## 🚀 Instrucciones de Ejecución

### Paso 1: Backend

```bash
cd /home/ignacio/MECIA/BACKEND

# Crear entorno virtual
python3 -m venv venv
source venv/bin/activate

# Instalar dependencias
pip install -r requirements.txt

# Crea un archivo .env (puedes copiar de .env.example)
cp .env.example .env

# ¡Ejecutar!
uvicorn app.main:app --reload
```

**Backend disponible en: http://localhost:8000**
**Documentación en: http://localhost:8000/api/docs**

### Paso 2: Frontend

```bash
cd /home/ignacio/MECIA/FRONTEND

# Instalar dependencias base
npm install

# ⚠️ IMPORTANTE: Instalar React Router (no estaba en package.json)
npm install react-router-dom

# Copiar variables de entorno
cp .env.example .env.local

# ¡Ejecutar!
npm run dev
```

**Frontend disponible en: http://localhost:5173**

## 🧪 Prueba Rápida

### Registrarse
1. Abre http://localhost:5173/register
2. Llena el formulario y presiona "Registrarse"

```json
{
  "email": "test@example.com",
  "full_name": "Juan Pérez",
  "password": "password123",
  "role": "ciudadano"
}
```

### Iniciar Sesión
1. Abre http://localhost:5173/login
2. Usa las credenciales del registro anterior

### Ver Dashboard
- Si eres ciudadano: http://localhost:5173/ciudadano/dashboard
- Si eres emprendedor: http://localhost:5173/emprendedor/dashboard

## 📡 Llamadas a API (con curl)

```bash
# Registrar
curl -X POST http://localhost:8000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email":"test@example.com",
    "full_name":"Juan Pérez",
    "password":"password123",
    "role":"ciudadano"
  }'

# Login
curl -X POST http://localhost:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email":"test@example.com",
    "password":"password123"
  }'

# Obtener usuario actual (reemplaza TOKEN con el access_token recibido)
curl -X GET http://localhost:8000/api/auth/me \
  -H "Authorization: Bearer TOKEN"
```

## 🔑 Variables de Entorno

### Backend (.env)
```env
DATABASE_URL=sqlite:///./mecia.db
SECRET_KEY=tu-clave-secreta-super-segura
DEBUG=True
FRONTEND_URL=http://localhost:5173
```

### Frontend (.env.local)
```env
VITE_API_URL=http://localhost:8000
```

## 📂 Estructura Principal

```
BACKEND/
├── app/
│   ├── core/          # Configuración y seguridad
│   ├── models/        # Modelos de BD (User)
│   ├── schemas/       # Validación (UserRegister, UserLogin, etc)
│   ├── repositories/  # Acceso a datos
│   ├── services/      # Lógica de negocio (AuthService)
│   ├── routers/       # Endpoints API
│   └── main.py
└── requirements.txt

FRONTEND/
├── src/
│   ├── components/auth/   # FormulariosFrontEnd
│   ├── pages/            # Páginas
│   ├── services/         # authService.js
│   ├── router/           # Configuración de rutas
│   ├── config/           # api.js
│   └── App.jsx
└── package.json
```

## 🎨 Próximas Tareas para Frontend

El frontend tiene toda la estructura, ahora necesita:

1. **Estilos** con Tailwind CSS
2. **Validaciones mejoradas** en los formularios
3. **Loading states** y feedback visual
4. **Diseño de dashboards**
5. **Componentes específicos** para emprendedor/ciudadano

## 🐛 Troubleshooting

### Error: "Cannot find module 'react-router-dom'"
**Solución:** 
```bash
npm install react-router-dom
```

### Error: "PORT 8000 is already in use"
**Solución:**
```bash
lsof -i :8000
kill -9 <PID>
```

### Frontend no conecta con backend
**Verifica:**
- `.env.local` tiene `VITE_API_URL=http://localhost:8000`
- Backend está corriendo en `http://localhost:8000`
- CORS está habilitado (está configurado en FastAPI)

### Base de datos no se crea
**Verifica:**
- La carpeta `/BACKEND` tiene permisos de escritura
- `DATABASE_URL` en `.env` es correcto
- FastAPI se inició sin errores

## 📚 Documentación Completa

- [Backend README](./BACKEND/README.md) - Arquitectura, endpoints, despliegue
- [Frontend README](./FRONTEND/README.md) - Estructura, componentes, flujo

## ✉️ Resumen de Propósito

**EMPRENDEDOR:**
- Chatbot para clasificar tipo de negocio
- Mapa con mejores zonas para emprender
- Análisis de seguridad y servicios
- Información de competencia

**CIUDADANO:**
- Feed de noticias de Medellín
- Chatbot de recomendaciones de seguridad
- Módulo de servicios y gastos
- Módulo de seguridad por zona

---

**¡Listo para comenzar!** 🚀
