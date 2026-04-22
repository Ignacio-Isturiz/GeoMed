import logging
import pandas as pd
import numpy as np
from pathlib import Path
from typing import List, Dict, Any
from .mobility_service import MobilityService

logger = logging.getLogger(__name__)

class AnalisisService:
    def __init__(self):
        self.mobility_service = MobilityService()
        
    def _get_df(self):
        return self.mobility_service._load_data()

    def get_dashboard_summary(self) -> Dict[str, Any]:
        df = self._get_df()
        if df is None:
            return self._get_mock_summary()

        try:
            # 1. Criticidad por día de la semana (Lunes-Viernes)
            df['es_semana'] = ~df['dia'].isin(['Sabado', 'Domingo'])
            df_semana = df[df['es_semana']]
            
            # Top 10 corredores críticos entre semana
            grouped_corredores = df_semana.groupby('corredor').agg({
                'criticidad': 'mean',
                'velocidad_km_h': 'mean',
                'intensidad': 'mean'
            })
            max_c = grouped_corredores['criticidad'].max() or 1
            grouped_corredores['criticidad'] = (grouped_corredores['criticidad'] / max_c) * 10
            top_corredores = grouped_corredores.sort_values(by='criticidad', ascending=False).head(10).reset_index()

            # 2. Comunas con más presión en hora pico (6-9, 16-19)
            df_pico = df[df['hora'].isin([6,7,8,9,16,17,18,19])]
            presion_comunas = df_pico.groupby('nombre_comuna').agg({
                'intensidad': 'sum',
                'criticidad': 'mean'
            }).sort_values(by='intensidad', ascending=False).head(5).reset_index()

            # 3. Tendencia de Anomalías (Hora por Hora)
            # Baseline: promedio por hora
            # Current: máximo por hora (simulando picos detectados)
            hourly_trend = df.groupby('hora').agg({
                'criticidad': ['mean', 'max']
            }).reset_index()
            hourly_trend.columns = ['hora', 'base', 'peak']
            anomaly_trend = hourly_trend.to_dict(orient='records')

            # 4. Zonas con baja velocidad y alto flujo
            umbral_intensidad = df['intensidad'].quantile(0.8)
            zonas_criticas = df[(df['velocidad_km_h'] < 20) & (df['intensidad'] > umbral_intensidad)]
            puntos_congestión = zonas_criticas.groupby(['corredor', 'nombre_comuna']).size().reset_index(name='frecuencia').sort_values('frecuencia', ascending=False).head(3)

            # 5. Recomendaciones estratégicas por categoría
            prioridades = self._calculate_priorities_categorized(df)

            return {
                "top_corredores": top_corredores.to_dict(orient='records'),
                "presion_comunas": presion_comunas.to_dict(orient='records'),
                "puntos_congestion": puntos_congestión.to_dict(orient='records'),
                "anomaly_trend": anomaly_trend,
                "prioridades": prioridades,
                "stats_generales": {
                    "velocidad_promedio": float(df['velocidad_km_h'].mean()),
                    "intensidad_total": int(df['intensidad'].sum()),
                    "criticidad_max": float(df['criticidad'].max())
                }
            }
        except Exception as e:
            logger.error(f"Error calculando dashboard summary: {e}")
            return self._get_mock_summary()

    def _calculate_priorities_categorized(self, df):
        # Lógica para las 3 categorías del wireframe
        
        # 1. Rutas Alternas (Comunas con mayor intensidad acumulada)
        rutas_alternas = df.groupby('nombre_comuna')['intensidad'].sum().idxmax()
        
        # 2. Gestión Semafórica (Corredores con mayor desviación de velocidad - flujo interrumpido)
        gestion_semaforica = df.groupby('corredor')['velocidad_km_h'].std().idxmax()
        
        # 3. Transporte Sostenible (Zonas con velocidad promedio muy baja)
        transporte_sostenible = df.groupby('nombre_comuna')['velocidad_km_h'].mean().idxmin()
        
        return {
            "rutas_alternas": {"zona": rutas_alternas, "sugerencia": f"Priorizar {rutas_alternas} para rutas alternas."},
            "gestion_semaforica": {"zona": gestion_semaforica, "sugerencia": f"Revisar semáforos {gestion_semaforica}."},
            "transporte_sostenible": {"zona": transporte_sostenible, "sugerencia": f"Promocionar en {transporte_sostenible}."}
        }

    def _get_mock_summary(self):
        return {
            "top_corredores": [
                {"corredor": "Avenida Regional", "criticidad": 8.5, "velocidad_km_h": 12, "intensidad": 45000},
                {"corredor": "Autopista Sur", "criticidad": 8.0, "velocidad_km_h": 15, "intensidad": 38000},
                {"corredor": "Calle 33", "criticidad": 7.5, "velocidad_km_h": 18, "intensidad": 32000},
            ],
            "presion_comunas": [
                {"nombre_comuna": "La Candelaria", "intensidad": 120000},
                {"nombre_comuna": "Poblado", "intensidad": 95000},
                {"nombre_comuna": "Belén", "intensidad": 80000},
                {"nombre_comuna": "Laureles", "intensidad": 75000},
                {"nombre_comuna": "Aranjuez", "intensidad": 70000}
            ],
            "anomaly_trend": [{"hora": i, "base": 20 + np.sin(i/3)*10, "peak": 25 + np.sin(i/3)*12 + (5 if i==18 else 0)} for i in range(24)],
            "prioridades": {
                "rutas_alternas": {"zona": "Comuna 4", "sugerencia": "Priorizar Comuna 4 para Rutas Alternas"},
                "gestion_semaforica": {"zona": "Corredor 8", "sugerencia": "Revisar semáforos Corredor 8"},
                "transporte_sostenible": {"zona": "Comuna 7", "sugerencia": "Promocionar en Comuna 7"}
            },
            "stats_generales": {"velocidad_promedio": 24.5, "intensidad_total": 450000, "criticidad_max": 10.0}
        }
