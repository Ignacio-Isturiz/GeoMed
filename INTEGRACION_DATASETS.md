# IntegraciÃ³n del Dashboard de Criminalidad

Este documento explica cÃ³mo se ha implementado y cÃ³mo integrar el nuevo Dashboard de Criminalidad en los dashboards existentes.

## Estructura Creada

### Backend

#### 1. Servicio de Datasets (`app/services/movilidad_datasets_service.py`)
- **Responsabilidad**: LÃ³gica de negocio para lectura y procesamiento de CSV
- **MÃ©todos principales**:
  - `get_criminalidad_data()`: Lee el CSV y retorna lista de diccionarios con campos procesados
  - `get_criminalidad_summary()`: Calcula estadÃ­sticas agregadas (total, promedio, mÃ¡xima, mÃ­nima, etc.)

#### 2. Router de Datasets (`app/routers/movilidad_datasets.py`)
- **Endpoint GET** `/api/datasets/criminalidad`
  - Retorna lista completa de datos de criminalidad por comuna
  - Response: `{ success: true, data: [...], count: N }`

- **Endpoint GET** `/api/datasets/criminalidad/resumen`
  - Retorna estadÃ­sticas agregadas
  - Response: `{ success: true, data: { total_comunas, total_casos, tasa_promedio, ... } }`

#### 3. Registro en main.py
- Se agregÃ³ el import: `from app.routers import auth, movilidad_datasets`
- Se registrÃ³ el router: `app.include_router(movilidad_datasets.router)`

### Frontend

#### 1. Servicio (`src/services/movilidadDatasetsService.js`)
- **MÃ©todos**:
  - `getCriminalidadData()`: Consume GET `/api/datasets/criminalidad`
  - `getCriminalidadSummary()`: Consume GET `/api/datasets/criminalidad/resumen`
- Manejo de errores incorporado
- Usa configuraciÃ³n de API desde `api.js`

#### 2. Componente (`src/components/CriminalidadDashboard.jsx`)
- Componente React reutilizable
- **CaracterÃ­sticas**:
  - Carga datos automaticamente al montar
  - Muestra 5 tarjetas de resumen (comunas, casos, tasas)
  - Tabla interactiva con datos ordenables por cualquier columna
  - CÃ³digo de colores: Rojo si tasa > promedio, Verde si tasa < promedio
  - Manejo de estados: loading, error, success
  - BotÃ³n para reintentar si falla la carga
  - Responsivo (grid 1 col mobile, 5 cols desktop)

## CÃ³mo Integrar en los Dashboards Existentes

### OpciÃ³n 1: Agregar al Dashboard de Ciudadano

En `src/pages/CiudadanoDashboard.jsx`:

```jsx
import CriminalidadDashboard from '../components/CriminalidadDashboard';

// Dentro del return, agregar donde corresponda:
<div style={{ marginTop: '2rem' }}>
  <CriminalidadDashboard />
</div>
```

### Opción 2: Agregar al Dashboard principal

En `src/pages/CiudadanoDashboard.jsx`:

```jsx
import CriminalidadDashboard from '../components/CriminalidadDashboard';

// Dentro del return, agregar donde corresponda:
<div style={{ marginTop: '2rem' }}>
  <CriminalidadDashboard />
</div>
```

### OpciÃ³n 3: Crear PÃ¡gina Dedicada

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
â”œâ”€â”€ app/
â”‚   â”œâ”€â”€ services/
â”‚   â”‚   â”œâ”€â”€ auth.py          (existente)
â”‚   â”‚   â””â”€â”€ datasets.py      (NUEVO)
â”‚   â”œâ”€â”€ routers/
â”‚   â”‚   â”œâ”€â”€ auth.py          (existente)
â”‚   â”‚   â””â”€â”€ datasets.py      (NUEVO)
â”‚   â””â”€â”€ main.py              (modificado - se agregÃ³ datasets router)

FRONTEND/
├── src/
│   ├── services/
│   │   ├── authService.js       (existente)
│   │   └── datasetsService.js   (NUEVO)
│   ├── components/
│   │   └── CriminalidadDashboard.jsx (NUEVO)
│   └── pages/
│       └── CiudadanoDashboard.jsx    (existente)
```

## ValidaciÃ³n

- No se modificaron archivos existentes excepto `main.py` (solo se agregÃ³ 1 import y 1 lÃ­nea de incluir router)
- Endpoints de autenticaciÃ³n siguen funcionando
- CORS estÃ¡ configurado correctamente
- El componente maneja errores y estados de carga
- Los datos se sirven en formato JSON estÃ¡ndar
- El CSV se parsea correctamente con delimitador `;`

## PrÃ³ximos Pasos Opcionales

1. **GrÃ¡ficas**: Usar `recharts` o `chart.js` para visualizar datos
```bash
npm install recharts
```

2. **Filtros**: Agregar filtros por rango de tasa o nÃºmero de casos

3. **Exportar**: BotÃ³n para descargar datos en CSV o PDF

4. **BÃºsqueda**: Input para buscar comunas especÃ­ficas

5. **PaginaciÃ³n**: Si el dataset crece mucho

