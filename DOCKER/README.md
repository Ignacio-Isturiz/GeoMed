# 📁 Directorio DOCKER

Este directorio contiene toda la configuración Docker para el proyecto MECIA.

## 📂 Estructura

```
DOCKER/
├── DOCKERFRONT/               # Configuración Docker del frontend
│   ├── Dockerfile            # Dockerfile para React + Nginx
│   ├── .dockerignore         # Archivos ignorados en build
│   └── nginx.conf            # Configuración Nginx para SPA
├── DOCKERBACK/               # Configuración Docker del backend
│   ├── Dockerfile            # Dockerfile para FastAPI
│   └── .dockerignore         # Archivos ignorados en build
├── docker-compose.yml        # Orquestación de servicios (producción)
├── docker-compose.dev.yml    # 🆕 Orquestación con hot reload (desarrollo)
├── dev-mode.sh              # 🆕 Script selector de modo
├── .env.example             # Plantilla de variables de entorno
├── DOCKER_README.md         # Documentación completa
├── MODES.md                 # 🆕 Explicación de modos producción/desarrollo
└── README.md                # Esta descripción
```

## 🚀 Inicio Rápido

Desde la raíz del proyecto:

```bash
./setup.sh
```

O manualmente:

```bash
cp DOCKER/.env.example .env
# Editar .env
cd DOCKER
docker-compose up --build
```

## 📋 Servicios

- **db**: PostgreSQL 15 con datos persistentes
- **backend**: API FastAPI en puerto 8000
- **frontend**: React SPA en puerto 3000

Ver [DOCKER_README.md](DOCKER_README.md) para instrucciones detalladas.