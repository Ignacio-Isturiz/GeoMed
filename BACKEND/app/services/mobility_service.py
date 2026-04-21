import logging
import threading
from pathlib import Path
from typing import List, Dict, Any

logger = logging.getLogger(__name__)

try:
    import pandas as pd
    import numpy as np
except ImportError:
    logger.error("❌ ERROR: pandas y numpy no están instalados.")
    logger.error("Ejecuta: pip install pandas numpy")
    pd = None
    np = None

class MobilityService:
    def __init__(self):
        self.datasets_path = Path(__file__).parent.parent.parent / "datasets"
        self.mobility_file = self.datasets_path / "velocidad_e_intensidad_vehicular_en_medellin_clean.csv"
        self.aforos_file = self.datasets_path / "Aforos_Vehiculares_clean.csv"
        self._cached_data = None
        self._comuna_coords = None
        self._load_lock = threading.Lock()

    def _load_data(self):
        if pd is None:
            logger.warning("Pandas no está disponible, usando datos mock.")
            return None
        
        if self._cached_data is not None:
            return self._cached_data

        with self._load_lock:
            if self._cached_data is not None:
                return self._cached_data

            try:
                logger.info(f"🔍 Intentando cargar dataset desde: {self.mobility_file}")
                
                if not self.mobility_file.exists():
                    logger.error(f"❌ Archivo NO encontrado en: {self.mobility_file}")
                    return None

                # Load everything first to identify columns
                df_raw = pd.read_csv(
                    self.mobility_file, 
                    sep=None, 
                    engine='python', 
                    encoding='utf-8-sig',
                    nrows=100 # Quick check first
                )
                
                # Normalize headers: remove spaces, lowercase
                raw_cols = {c.strip().lower(): c for c in df_raw.columns}
                
                # Mapping of required data
                mapping = {
                    'hora': next((raw_cols[k] for k in ['hora', 'hour', 'h'] if k in raw_cols), None),
                    'velocidad': next((raw_cols[k] for k in ['velocidad_km_h', 'velocidad', 'speed'] if k in raw_cols), None),
                    'intensidad': next((raw_cols[k] for k in ['intensidad', 'intensity', 'volumen'] if k in raw_cols), None),
                    'corredor': next((raw_cols[k] for k in ['corredor', 'via', 'calle'] if k in raw_cols), None),
                    'comuna': next((raw_cols[k] for k in ['nombre_comuna', 'comuna', 'zona'] if k in raw_cols), None),
                    'longitud': next((raw_cols[k] for k in ['longitud', 'lon', 'lng', 'x', 'coordenadax'] if k in raw_cols), None),
                    'latitud': next((raw_cols[k] for k in ['latitud', 'lat', 'y', 'coordenaday'] if k in raw_cols), None)
                }
                
                logger.info(f"🎯 Mapeo de columnas detectado: {mapping}")
                
                # Reload with mapped columns
                actual_cols = list(dict.fromkeys(v for v in mapping.values() if v is not None))
                self._cached_data = pd.read_csv(
                    self.mobility_file, 
                    usecols=actual_cols,
                    sep=None, 
                    engine='python', 
                    encoding='utf-8-sig'
                )

                # Defensive: avoid duplicate labels that can break downstream reindex/groupby ops.
                if self._cached_data.columns.duplicated().any():
                    self._cached_data = self._cached_data.loc[:, ~self._cached_data.columns.duplicated(keep='first')]
                
                # Rename to standard names
                reverse_mapping = {}
                for std_name, src_name in mapping.items():
                    if src_name is None:
                        continue
                    if src_name not in reverse_mapping:
                        reverse_mapping[src_name] = std_name
                self._cached_data = self._cached_data.rename(columns=reverse_mapping)

                if self._cached_data.columns.duplicated().any():
                    self._cached_data = self._cached_data.loc[:, ~self._cached_data.columns.duplicated(keep='first')]
                
                # Fallback names if some mapping failed
                if 'comuna' not in self._cached_data.columns and 'nombre_comuna' in self._cached_data.columns:
                     self._cached_data = self._cached_data.rename(columns={'nombre_comuna': 'comuna'})

                logger.info(f"✅ Archivo cargado. Filas iniciales: {len(self._cached_data)}")
                
                # Basic cleaning
                for col in ['velocidad', 'intensidad', 'hora', 'latitud', 'longitud']:
                    if col in self._cached_data.columns:
                        self._cached_data[col] = pd.to_numeric(self._cached_data[col], errors='coerce')
                
                required_clean_cols = [c for c in ['velocidad', 'intensidad'] if c in self._cached_data.columns]
                if len(required_clean_cols) < 2:
                    logger.error("❌ No se encontraron columnas mínimas para analítica (velocidad/intensidad).")
                    return None

                self._cached_data = self._cached_data.dropna(subset=required_clean_cols)
                
                if len(self._cached_data) == 0:
                    logger.warning("⚠️ El dataset está vacío tras la limpieza. Usando mock.")
                    self._cached_data = None
                    return None
                
                # Rename back to expected names for existing logic
                if 'velocidad' in self._cached_data.columns and 'velocidad_km_h' not in self._cached_data.columns:
                    self._cached_data = self._cached_data.rename(columns={'velocidad': 'velocidad_km_h'})

                if 'comuna' in self._cached_data.columns:
                    if 'nombre_comuna' in self._cached_data.columns:
                        self._cached_data['nombre_comuna'] = self._cached_data['nombre_comuna'].fillna(self._cached_data['comuna'])
                        self._cached_data = self._cached_data.drop(columns=['comuna'])
                    else:
                        self._cached_data = self._cached_data.rename(columns={'comuna': 'nombre_comuna'})

                if self._cached_data.columns.duplicated().any():
                    self._cached_data = self._cached_data.loc[:, ~self._cached_data.columns.duplicated(keep='first')]
                
                # Calculate Criticality Index
                self._cached_data['criticidad'] = self._cached_data['intensidad'] / (self._cached_data['velocidad_km_h'] + 1)
                
                logger.info(f"📊 Dataset listo para analítica: {len(self._cached_data)} filas.")
            except Exception as e:
                logger.error(f"❌ Error crítico cargando datasets: {e}")
                self._cached_data = None
                return None
            
        return self._cached_data

    def _get_comuna_coords(self):
        if pd is None:
            return {}
        if self._comuna_coords is None:
            try:
                if not self.aforos_file.exists():
                    return {}
                    
                df_aforos = pd.read_csv(self.aforos_file, sep=None, engine='python', encoding='utf-8-sig')
                
                # Normalize column names to avoid case issues
                df_aforos.columns = [c.upper() for c in df_aforos.columns]
                
                if 'NOMBRE_COMUNA' in df_aforos.columns and 'COORDENADAX' in df_aforos.columns:
                    self._comuna_coords = df_aforos.groupby('NOMBRE_COMUNA').agg({
                        'COORDENADAX': 'mean',
                        'COORDENADAY': 'mean'
                    }).to_dict(orient='index')
                    logger.info("📍 Coordenadas de comunas cargadas exitosamente.")
            except Exception as e:
                logger.error(f"Error cargando coordenadas: {e}")
                return {}
        return self._comuna_coords

    def get_summary_by_hour(self):
        df = self._load_data()
        if df is None:
            # Mock Data for Hackathon presentation
            return [{"hora": i, "velocidad_km_h": 30 + (i % 5), "intensidad": 5000 + (i * 100), "criticidad": 1.2 + (i/24)} for i in range(24)]
        
        # Ensure hora is numeric to avoid grouping issues with strings like "08" vs "8"
        df_hour = df.copy()
        df_hour['hora'] = pd.to_numeric(df_hour['hora'], errors='coerce')
        df_hour = df_hour.dropna(subset=['hora'])
        
        summary = df_hour.groupby('hora').agg({
            'velocidad_km_h': 'mean',
            'intensidad': 'sum',
            'criticidad': 'mean'
        }).sort_index().reset_index()
        
        logger.info(f"⏰ Resumen por hora generado: {len(summary)} franjas horarias.")
        return summary.to_dict(orient='records')

    def get_summary_by_comuna(self):
        df = self._load_data()
        coords = self._get_comuna_coords() if pd is not None else {}
        
        if df is None:
            # Mock Data with real Comunas names
            mock_comunas = [
                {"nombre_comuna": "Laureles Estadio", "lat": 6.248, "lng": -75.589, "criticidad": 1.8},
                {"nombre_comuna": "El Poblado", "lat": 6.208, "lng": -75.567, "criticidad": 2.1},
                {"nombre_comuna": "Belén", "lat": 6.232, "lng": -75.594, "criticidad": 1.4},
                {"nombre_comuna": "La Candelaria", "lat": 6.244, "lng": -75.564, "criticidad": 2.5},
                {"nombre_comuna": "Aranjuez", "lat": 6.273, "lng": -75.562, "criticidad": 1.6},
            ]
            for item in mock_comunas:
                item["velocidad_km_h"] = 25.5
                item["intensidad"] = 12500
            return mock_comunas

        summary = df.groupby('nombre_comuna').agg({
            'velocidad_km_h': 'mean',
            'intensidad': 'sum',
            'criticidad': 'mean'
        }).sort_values(by='criticidad', ascending=False).reset_index()
        
        result = []
        for _, row in summary.iterrows():
            item = row.to_dict()
            c_name = item['nombre_comuna']
            match = None
            for k in coords.keys():
                if c_name.lower() in k.lower():
                    match = coords[k]
                    break
            
            if match:
                item['lat'] = match['COORDENADAY']
                item['lng'] = match['COORDENADAX']
            else:
                item['lat'] = 6.244
                item['lng'] = -75.574
            result.append(item)
        return result

    def get_top_critical_corridors(self, limit: int = 10):
        df = self._load_data()
        if df is None:
            # Realistic Mock for worst performing corridors
            return [
                {"corredor": "Avenida Regional", "velocidad_km_h": 12.5, "intensidad": 45000, "criticidad": 3.3, "lat": 6.250, "lng": -75.567},
                {"corredor": "Autopista Sur", "velocidad_km_h": 15.2, "intensidad": 38000, "criticidad": 2.4, "lat": 6.220, "lng": -75.580},
                {"corredor": "Calle 80", "velocidad_km_h": 18.0, "intensidad": 25000, "criticidad": 1.9, "lat": 6.270, "lng": -75.590},
                {"corredor": "Autopista Norte", "velocidad_km_h": 22.1, "intensidad": 22000, "criticidad": 1.5, "lat": 6.290, "lng": -75.560},
                {"corredor": "Vía Las Palmas", "velocidad_km_h": 35.5, "intensidad": 18000, "criticidad": 0.8, "lat": 6.200, "lng": -75.550},
            ]
            
        # Group and try to get coords if they exist in the raw data
        # Note: we need to ensure the columns exist in _cached_data
        summary = df.groupby('corredor').agg({
            'velocidad_km_h': 'mean',
            'intensidad': 'sum',
            'criticidad': 'mean'
        }).sort_values(by='criticidad', ascending=False).head(limit).reset_index()
        
        # We'll use a fixed coordinate for corridors for now as we don't have 
        # individual sensor coords in the current cached DF, but we can approximate by Comuna
        # For a hackathon, we'll return the corridors with their stats
        return summary.to_dict(orient='records')

    def get_recommendations(self):
        # Recommendations stay pretty similar, but we ensure they work without DF
        df = self._load_data()
        if df is None:
            peak_hour = 18
            peak_comuna = "La Candelaria"
        else:
            peak_hour = df.groupby('hora')['criticidad'].mean().idxmax()
            peak_comuna = df.groupby('nombre_comuna')['criticidad'].mean().idxmax()
        
        return [
            {
                "id": 1,
                "title": "Hora Pico Crítica Detectada",
                "description": f"Se ha detectado que la hora {peak_hour}:00 es la más crítica. Se recomienda escalonar horarios de salida.",
                "type": "warning"
            },
            {
                "id": 2,
                "title": "Zona de Alta Congestión",
                "description": f"La comuna {peak_comuna} presenta los mayores índices de criticidad vial. Considere rutas alternativas.",
                "type": "info"
            },
            {
                "id": 3,
                "title": "Promoción de Teletrabajo",
                "description": "Análisis sugiere fomentar el teletrabajo en corredores del Río durante picos de intensidad.",
                "type": "success"
            }
        ]

    def get_geo_points(self, limit: int = 12000):
        df = self._load_data()
        if df is None:
            return []

        required_geo_cols = {'latitud', 'longitud', 'criticidad'}
        if not required_geo_cols.issubset(set(df.columns)):
            logger.warning("⚠️ Dataset sin columnas geográficas completas para /api/movilidad.")
            return []

        geo_df = df.copy()
        geo_df = geo_df.dropna(subset=['latitud', 'longitud'])

        for col in ['latitud', 'longitud', 'hora', 'criticidad', 'velocidad_km_h', 'intensidad']:
            if col in geo_df.columns:
                geo_df[col] = pd.to_numeric(geo_df[col], errors='coerce')

        geo_df = geo_df.dropna(subset=['latitud', 'longitud', 'criticidad'])

        grouped = (
            geo_df.groupby(['corredor', 'nombre_comuna', 'hora', 'latitud', 'longitud'], dropna=False)
            .agg({
                'velocidad_km_h': 'mean',
                'intensidad': 'sum',
                'criticidad': 'mean',
            })
            .reset_index()
            .sort_values('criticidad', ascending=False)
        )

        if limit and limit > 0:
            grouped = grouped.head(limit)

        return grouped.to_dict(orient='records')
