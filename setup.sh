#!/bin/bash

# Script de configuración inicial para MECIA con Docker

echo "🚀 Configuración inicial de MECIA con Docker"

# Verificar si Docker está instalado
if ! command -v docker &> /dev/null; then
    echo "❌ Docker no está instalado. Por favor instala Docker primero."
    exit 1
fi

if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose no está instalado. Por favor instala Docker Compose primero."
    exit 1
fi

# Crear .env si no existe
if [ ! -f .env ]; then
    echo "📋 Creando archivo .env desde .env.example..."
    cp DOCKER/.env.example .env
    echo "⚠️  IMPORTANTE: Edita el archivo .env con tus claves API reales antes de continuar."
    echo "   - SECRET_KEY: Genera una clave segura"
    echo "   - NEWS_API_KEY: Obtén de https://newsapi.org"
    echo "   - Configuración SMTP para emails"
    read -p "¿Has editado el .env? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "Por favor edita el .env y ejecuta el script nuevamente."
        exit 1
    fi
fi

# Construir y ejecutar
echo "🏗️  Construyendo contenedores en modo DESARROLLO..."
cd DOCKER && docker-compose -f docker-compose.dev.yml build

echo "🚀 Iniciando servicios en modo DESARROLLO..."
docker-compose -f docker-compose.dev.yml up -d

echo "⏳ Esperando a que los servicios estén listos..."
sleep 10

echo "✅ ¡MECIA está ejecutándose!"
echo "   📱 Frontend: http://localhost:3000"
echo "   🔌 API: http://localhost:8000"
echo "   📚 API Docs: http://localhost:8000/docs"
echo ""
echo "Para ver logs: cd DOCKER && docker-compose -f docker-compose.dev.yml logs -f"
echo "Para detener: cd DOCKER && docker-compose -f docker-compose.dev.yml down"
echo ""
echo "💡 Modo DESARROLLO activado: las dependencias se instalan automáticamente"
echo "   y tienes hot reload. Para modo producción usa: docker-compose up --build"