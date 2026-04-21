# Dockerfile para el frontend de MECIA

# Stage 1: Solo instalar dependencias (usado en desarrollo)
FROM node:20-alpine AS deps

WORKDIR /app
COPY package*.json ./
RUN npm ci

# Stage 2: Compilar para producción
FROM deps AS builder
COPY . .
RUN npm run build

# Stage 3: Servir con nginx (producción)
FROM nginx:alpine AS production

COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
