# Integración del Dashboard de Criminalidad

Este documento explica cómo se ha implementado y cómo integrar el nuevo Dashboard de Criminalidad en los dashboards existentes.

## Estructura Creada

### Backend

#### 1. Servicio de Datasets (`app/services/datasets.py`)
- **Responsabilidad**: Lógica de negocio para lectura y procesamiento de CSV
- **Métodos principales**:
  - `get_criminalidad_data()`: Lee el CSV y retorna lista de diccionarios con campos procesados
  - `get_criminalidad_summary()`: Calcula estadísticas agregadas (total, promedio, máxima, mínima, etc.)

#### 2. Router de Datasets (`app/routers/datasets.py`)
- **Endpoint GET** `/api/datasets/criminalidad`
  - Retorna lista completa de datos de criminalidad por comuna
  - Response: `{ success: true, data: [...], count: N }`

- **Endpoint GET** `/api/datasets/criminalidad/resumen`
  - Retorna estadísticas agregadas
  - Response: `{ success: true, data: { total_comunas, total_casos, tasa_promedio, ... } }`

#### 3. Registro en main.py
- Se agregó el import: `from app.routers import auth, datasets`
- Se registró el router: `app.include_router(datasets.router)`

### Frontend

#### 1. Servicio (`src/services/datasetsService.js`)
- **Métodos**:
  - `getCriminalidadData()`: Consume GET `/api/datasets/criminalidad`
  - `getCriminalidadSummary()`: Consume GET `/api/datasets/criminalidad/resumen`
- Manejo de errores incorporado
- Usa configuración de API desde `api.js`

#### 2. Componente (`src/components/CriminalidadDashboard.jsx`)
- Componente React reutilizable
- **Características**:
  - Carga datos automaticamente al montar
  - Muestra 5 tarjetas de resumen (comunas, casos, tasas)
  - Tabla interactiva con datos ordenables por cualquier columna
  - Código de colores: Rojo si tasa > promedio, Verde si tasa < promedio
  - Manejo de estados: loading, error, success
  - Botón para reintentar si falla la carga
  - Responsivo (grid 1 col mobile, 5 cols desktop)

## Cómo Integrar en los Dashboards Existentes

### Opción 1: Agregar al Dashboard de Ciudadano

En `src/pages/CiudadanoDashboard.jsx`:

```jsx
import CriminalidadDashboard from '../components/CriminalidadDashboard';

// Dentro del return, agregar donde corresponda:
<div style={{ marginTop: '2rem' }}>
  <CriminalidadDashboard />
</div>
```

### Opción 2: Agregar al Dashboard de Emprendedor

En `src/pages/EmprendedorDashboard.jsx`:

```jsx
import CriminalidadDashboard from '../components/CriminalidadDashboard';

// Dentro del return, agregar donde corresponda:
<div style={{ marginTop: '2rem' }}>
  <CriminalidadDashboard />
</div>
```

### Opción 3: Crear Página Dedicada

Crear `src/pages/CriminalidadPage.jsx`:

```jsx
import CriminalidadDashboard from '../components/CriminalidadDashboard';

export default function CriminalidadPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <CriminalidadDashboard />
    </div>
  );
}
```

Luego agregar a la ruta en `src/router/index.jsx`:

```jsx
import CriminalidadPage from '../pages/CriminalidadPage';

// En las rutas:
{
  path: '/criminalidad',
  element: <CriminalidadPage />
}
```

## Pruebas de Endpoints

### Probar en curl o Postman:

```bash
# Obtener todos los datos
GET http://localhost:8000/api/datasets/criminalidad

# Obtener resumen
GET http://localhost:8000/api/datasets/criminalidad/resumen
```

### Response esperado (datos):
```json
{
  "success": true,
  "data": [
    {
      "nombre": "PALMITAS",
      "total_casos": 110,
      "tasa_criminalidad": 13.42
    },
    ...
  ],
  "count": N
}
```

### Response esperado (resumen):
```json
{
  "success": true,
  "data": {
    "total_comunas": 16,
    "total_casos": 8500,
    "tasa_promedio": 5.45,
    "tasa_maxima": 13.42,
    "tasa_minima": 0.5,
    "comuna_mas_afectada": "PALMITAS"
  }
}
```

## Estructura de Carpetas Resultante

```
BACKEND/
├── app/
│   ├── services/
│   │   ├── auth.py          (existente)
│   │   └── datasets.py      (NUEVO)
│   ├── routers/
│   │   ├── auth.py          (existente)
│   │   └── datasets.py      (NUEVO)
│   └── main.py              (modificado - se agregó datasets router)

FRONTEND/
├── src/
│   ├── services/
│   │   ├── authService.js       (existente)
│   │   └── datasetsService.js   (NUEVO)
│   ├── components/
│   │   └── CriminalidadDashboard.jsx (NUEVO)
│   └── pages/
│       ├── CiudadanoDashboard.jsx    (existente)
│       └── EmprendedorDashboard.jsx  (existente)
```

## Validación

- No se modificaron archivos existentes excepto `main.py` (solo se agregó 1 import y 1 línea de incluir router)
- Endpoints de autenticación siguen funcionando
- CORS está configurado correctamente
- El componente maneja errores y estados de carga
- Los datos se sirven en formato JSON estándar
- El CSV se parsea correctamente con delimitador `;`

## Próximos Pasos Opcionales

1. **Gráficas**: Usar `recharts` o `chart.js` para visualizar datos
```bash
npm install recharts
```

2. **Filtros**: Agregar filtros por rango de tasa o número de casos

3. **Exportar**: Botón para descargar datos en CSV o PDF

4. **Búsqueda**: Input para buscar comunas específicas

5. **Paginación**: Si el dataset crece mucho
