import logging
import pandas as pd
import numpy as np
from pathlib import Path
from typing import List, Dict, Any
import openai
import google.generativeai as genai
from app.core.config import get_settings
from .mobility_service import MobilityService

logger = logging.getLogger(__name__)

class AnalisisService:
    def __init__(self):
        self.mobility_service = MobilityService()
        self.settings = get_settings()
        
    def _get_df(self):
        return self.mobility_service._load_data()

    def get_dashboard_summary(self) -> Dict[str, Any]:
        df = self._get_df()
        if df is None:
            return self._get_mock_summary()

        try:
            # 1. Criticidad por día de la semana (Lunes-Viernes)
            if 'dia' in df.columns:
                df['es_semana'] = ~df['dia'].isin(['Sabado', 'Domingo'])
            else:
                # Si no hay columna de día, asumimos que todos son días laborales para el análisis
                df['es_semana'] = True
            
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

            # 3. Tendencia de Anomalías (Hora por Hora) - Z-Score
            # Calculamos la media y desviación estándar de intensidad por hora
            hourly_stats = df.groupby('hora')['intensidad'].agg(['mean', 'std']).reset_index()
            hourly_stats['std'] = hourly_stats['std'].replace(0, 1) # Evitar división por cero
            
            # Para la gráfica, base es media, peak es el máximo detectado
            hourly_trend = df.groupby('hora').agg({'intensidad': ['mean', 'max']}).reset_index()
            hourly_trend.columns = ['hora', 'base', 'peak']
            # Normalizamos para que encaje visualmente (ej. entre 0 y 40 como en el wireframe original)
            max_int = hourly_trend['peak'].max() or 1
            hourly_trend['base'] = (hourly_trend['base'] / max_int) * 35
            hourly_trend['peak'] = (hourly_trend['peak'] / max_int) * 35
            anomaly_trend = hourly_trend.to_dict(orient='records')

            # 4. Zonas con baja velocidad y alto flujo (Puntos Críticos por Corredor)
            umbral_flujo = df['intensidad'].quantile(0.75)
            umbral_vel = df['velocidad_km_h'].quantile(0.25)
            zonas_criticas = df[(df['velocidad_km_h'] <= umbral_vel) & (df['intensidad'] >= umbral_flujo)]
            
            puntos_congestión = zonas_criticas.groupby('corredor').agg({
                'velocidad_km_h': 'mean',
                'intensidad': 'mean',
                'criticidad': 'mean'
            }).reset_index().sort_values('criticidad', ascending=False).head(3)
            
            puntos_congestión['descripcion'] = puntos_congestión.apply(
                lambda x: f"{int(x['velocidad_km_h'])} km/h - {int(x['intensidad'])} veh", axis=1
            )

            # 5. Recomendaciones estratégicas por categoría (Por corredor)
            prioridades = self._calculate_priorities_categorized(df)

            # 6. Lista completa de corredores para el selector
            todos_corredores = sorted(df['corredor'].unique().tolist())

            return {
                "top_corredores": top_corredores.to_dict(orient='records'),
                "presion_comunas": presion_comunas.to_dict(orient='records'),
                "puntos_congestion": puntos_congestión.to_dict(orient='records'),
                "anomaly_trend": anomaly_trend,
                "prioridades": prioridades,
                "todos_corredores": todos_corredores,
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
        # 1. Rutas Alternas (Corredores con mayor intensidad promedio)
        rutas_alternas = df.groupby('corredor')['intensidad'].mean().idxmax()
        
        # 2. Gestión Semafórica (Corredores con mayor desviación de velocidad - flujo interrumpido)
        gestion_semaforica = df.groupby('corredor')['velocidad_km_h'].std().idxmax()
        
        # 3. Transporte Sostenible (Corredores con velocidad promedio muy baja)
        transporte_sostenible = df.groupby('corredor')['velocidad_km_h'].mean().idxmin()
        
        return {
            "rutas_alternas": {"zona": rutas_alternas, "sugerencia": f"Implementar desvíos temporales en {rutas_alternas} por sobrecarga constante."},
            "gestion_semaforica": {"zona": gestion_semaforica, "sugerencia": f"Optimizar tiempos de semáforo en {gestion_semaforica} por inestabilidad de flujo."},
            "transporte_sostenible": {"zona": transporte_sostenible, "sugerencia": f"Priorizar carriles exclusivos de bicicleta/bus en {transporte_sostenible}."}
        }

    def analyze_corridor_hour(self, corredor: str, hora: int) -> Dict[str, Any]:
        """Analiza un corredor específico a una hora determinada usando lógica estadística e 'IA'."""
        df = self._get_df()
        if df is None:
            return {
                "status": "warning",
                "message": f"Análisis preventivo para {corredor} a las {hora}:00. Mantenga precaución.",
                "alternatives": ["Ruta Alterna 1", "Ruta Alterna 2"]
            }

        try:
            # Filtrar datos para el corredor (Insensible a mayúsculas/minúsculas y espacios)
            corredor_clean = corredor.strip().lower()
            df_target = df[df['corredor'].str.lower() == corredor_clean]
            
            if df_target.empty:
                # Intentar búsqueda parcial si la exacta falla
                df_target = df[df['corredor'].str.lower().str.contains(corredor_clean, na=False)]
            
            if df_target.empty:
                logger.warning(f"⚠️ No se encontraron datos para el corredor: '{corredor}'")
                return {"status": "clear", "message": f"No hay datos suficientes en el dataset para '{corredor}'.", "alternatives": []}

            # Estadísticas base para ese corredor (promedio histórico)
            hist_avg = df_target['intensidad'].mean()
            df_hour = df_target[df_target['hora'] == hora]
            
            current_val = df_hour['intensidad'].mean() if not df_hour.empty else 0
            current_vel = df_hour['velocidad_km_h'].mean() if not df_hour.empty else 0
            
            # Cálculo de tendencia para la gráfica (24 horas de ese corredor)
            df_corredor = df[df['corredor'] == corredor]
            trend = df_corredor.groupby('hora').agg({'intensidad': ['mean', 'max']}).reset_index()
            trend.columns = ['hora', 'base', 'peak']
            
            # Normalización
            max_c = trend['peak'].max() or 1
            trend['base'] = (trend['base'] / max_c) * 35
            trend['peak'] = (trend['peak'] / max_c) * 35
            anomaly_trend = trend.to_dict(orient='records')

            # Cálculo de estado
            ratio = current_val / hist_avg if hist_avg > 0 else 1
            
            status = "clear"
            if ratio > 1.3 or (current_vel > 0 and current_vel < 15):
                status = "critical"
            elif ratio > 1.1 or (current_vel > 0 and current_vel < 25):
                status = "warning"

            # Generar recomendación real usando el LLM configurado
            ai_recommendation = self._call_llm(corredor, hora, current_vel, current_val, hist_avg, ratio)

            return {
                "status": status,
                "recommendations": ai_recommendation,
                "anomaly_trend": anomaly_trend
            }
        except Exception as e:
            logger.error(f"Error en análisis inteligente: {e}")
            return {"status": "error", "message": "No fue posible generar el análisis detallado.", "alternatives": []}

    def _call_llm(self, corredor, hora, velocidad, flujo, promedio, ratio) -> Dict[str, Any]:
        """Llama al LLM configurado para generar una recomendación humana."""
        prompt = f"""
        Como experto en movilidad de Medellín, analiza:
        - Corredor: {corredor} a las {hora}:00h
        - Velocidad: {int(velocidad)} km/h (Histórico: {int(promedio)})
        - Congestión: {ratio:.2f}x sobre lo normal

        Genera un análisis técnico dividido en estas 4 claves:
        1. rutas_alternas: Acción inmediata de desvío.
        2. gestion_semaforica: Estrategia de tiempos de semáforo.
        3. transporte_sostenible: Alternativa de movilidad limpia.
        4. resumen_critico: Un resumen detallado para el corredor {corredor}.

        Responde ESTRICTAMENTE en este formato JSON:
        {{
            "rutas_alternas": "...",
            "gestion_semaforica": "...",
            "transporte_sostenible": "...",
            "resumen_critico": "..."
        }}
        """
        
        try:
            # Priorizamos AI_API_KEY si el usuario la proporcionó
            effective_key = self.settings.AI_API_KEY or self.settings.OPENAI_API_KEY
            
            logger.info(f"🤖 Intentando generar recomendación con {self.settings.LLM_PROVIDER}...")

            if self.settings.LLM_PROVIDER == "openai" and effective_key:
                client = openai.OpenAI(api_key=effective_key)
                response = client.chat.completions.create(
                    model="gpt-3.5-turbo",
                    messages=[{"role": "system", "content": "Eres un asistente de movilidad experto en Medellín."},
                              {"role": "user", "content": prompt}],
                    response_format={"type": "json_object"}
                )
                import json
                result = json.loads(response.choices[0].message.content)
                logger.info("✅ Recomendación OpenAI generada con éxito.")
                return result
            
            effective_gemini_key = self.settings.AI_API_KEY or self.settings.GEMINI_API_KEY
            if self.settings.LLM_PROVIDER == "gemini" and effective_gemini_key:
                genai.configure(api_key=effective_gemini_key)
                model = genai.GenerativeModel('gemini-pro')
                response = model.generate_content(prompt)
                import json
                # Limpieza básica por si Gemini devuelve markdown
                text = response.text.replace('```json', '').replace('```', '').strip()
                result = json.loads(text)
                logger.info("✅ Recomendación Gemini generada con éxito.")
                return result

            effective_anthropic_key = self.settings.AI_API_KEY or self.settings.ANTHROPIC_API_KEY
            if self.settings.LLM_PROVIDER == "anthropic" and effective_anthropic_key:
                import anthropic
                client = anthropic.Anthropic(api_key=effective_anthropic_key)
                response = client.messages.create(
                    model="claude-3-haiku-20240307",
                    max_tokens=500,
                    system="Eres un asistente de movilidad experto en Medellín. Responde siempre en formato JSON.",
                    messages=[{"role": "user", "content": prompt}]
                )
                import json
                # Extraer texto del primer bloque de contenido
                text = response.content[0].text
                result = json.loads(text)
                logger.info("✅ Recomendación Anthropic generada con éxito.")
                return result
                
        except Exception as e:
            logger.error(f"❌ Error llamando al LLM ({self.settings.LLM_PROVIDER}): {str(e)}")
            if "invalid_api_key" in str(e).lower() or "401" in str(e):
                return {"message": "Error de Autenticación: La API Key configurada no es válida.", "alternatives": ["Revisar archivo .env"]}
            if "insufficient_quota" in str(e).lower():
                return {"message": "Error de Cuota: La API Key no tiene créditos disponibles.", "alternatives": ["Recargar créditos en el proveedor"]}
            
        # Fallback si falla la IA
        status_text = "Crítico" if ratio > 1.3 else ("Advertencia" if ratio > 1.1 else "Normal")
        return {
            "rutas_alternas": f"Evitar {corredor} y buscar vías colectoras cercanas.",
            "gestion_semaforica": "Sincronización en tiempo real requerida por flujo alto.",
            "transporte_sostenible": "Se recomienda usar Sistema Metro o carriles Solo Bus.",
            "resumen_critico": f"Estado {status_text} en {corredor} a las {hora}:00. Velocidad de {int(velocidad)} km/h."
        }

    def _get_mock_summary(self):
        return {
            "top_corredores": [
                {"corredor": "Avenida Regional", "criticidad": 8.5, "velocidad_km_h": 12, "intensidad": 45000},
                {"corredor": "Autopista Sur", "criticidad": 8.0, "velocidad_km_h": 15, "intensidad": 38000},
                {"corredor": "Calle 33", "criticidad": 7.5, "velocidad_km_h": 18, "intensidad": 32000},
                {"corredor": "Avenida 80", "criticidad": 7.0, "velocidad_km_h": 20, "intensidad": 31000},
                {"corredor": "San Juan", "criticidad": 6.8, "velocidad_km_h": 22, "intensidad": 29000},
                {"corredor": "Avenida Oriental", "criticidad": 6.5, "velocidad_km_h": 24, "intensidad": 28500},
                {"corredor": "Avenida El Poblado", "criticidad": 6.2, "velocidad_km_h": 25, "intensidad": 27000},
                {"corredor": "Vía Las Palmas", "criticidad": 5.9, "velocidad_km_h": 28, "intensidad": 25000},
                {"corredor": "Carrera 65", "criticidad": 5.5, "velocidad_km_h": 30, "intensidad": 24000},
                {"corredor": "Avenida Guayabal", "criticidad": 5.2, "velocidad_km_h": 32, "intensidad": 22000},
            ],
            "presion_comunas": [
                {"nombre_comuna": "La Candelaria", "intensidad": 120000, "criticidad": 9.2},
                {"nombre_comuna": "Poblado", "intensidad": 95000, "criticidad": 8.5},
                {"nombre_comuna": "Belén", "intensidad": 80000, "criticidad": 7.8},
                {"nombre_comuna": "Laureles", "intensidad": 75000, "criticidad": 7.4},
                {"nombre_comuna": "Aranjuez", "intensidad": 70000, "criticidad": 6.9}
            ],
            "puntos_congestion": [
                {"corredor": "Avenida Regional", "velocidad_km_h": 12, "intensidad": 45000, "criticidad": 9.5, "descripcion": "12 km/h - 45000 veh"},
                {"corredor": "Autopista Sur", "velocidad_km_h": 15, "intensidad": 38000, "criticidad": 8.8, "descripcion": "15 km/h - 38000 veh"},
                {"corredor": "Calle 33", "velocidad_km_h": 18, "intensidad": 32000, "criticidad": 8.0, "descripcion": "18 km/h - 32000 veh"},
            ],
            "anomaly_trend": [{"hora": i, "base": 15 + np.sin(i/3)*10, "peak": 18 + np.sin(i/3)*12 + (8 if i==18 else 0)} for i in range(24)],
            "prioridades": {
                "rutas_alternas": {"zona": "Avenida Regional", "sugerencia": "Implementar desvíos temporales en Avenida Regional por sobrecarga constante."},
                "gestion_semaforica": {"zona": "San Juan", "sugerencia": "Optimizar tiempos de semáforo en San Juan por inestabilidad de flujo."},
                "transporte_sostenible": {"zona": "Avenida Oriental", "sugerencia": "Priorizar carriles exclusivos de bicicleta/bus en Avenida Oriental."}
            },
            "todos_corredores": [
                "Avenida Regional", "Autopista Sur", "Calle 33", "Avenida 80", "San Juan", 
                "Avenida Oriental", "Avenida El Poblado", "Vía Las Palmas", "Carrera 65", "Avenida Guayabal"
            ],
            "stats_generales": {"velocidad_promedio": 24.5, "intensidad_total": 450000, "criticidad_max": 10.0}
        }
