"""Servicio de análisis y recomendaciones con modelos LLM."""

from typing import Dict, Any, List, Optional
import time
import csv
import os

# Ruta al dataset de criminalidad
_CRIMINALIDAD_PATH = os.path.join(
    os.path.dirname(__file__), "..", "..", "datasets", "Criminalidad_por_Comuna_data.csv"
)

# Aliases y variaciones comunes para detectar comunas en el texto del usuario
_ALIASES: Dict[str, str] = {
    "CANDELARIA": "LA CANDELARIA",
    "CENTRO": "LA CANDELARIA",
    "EL CENTRO": "LA CANDELARIA",
    "POBLADO": "EL POBLADO",
    "EL POBLADO": "EL POBLADO",
    "BELEN": "BELEN",
    "BELÉN": "BELEN",
    "AMERICA": "LA AMERICA",
    "LA AMERICA": "LA AMERICA",
    "GUAYABAL": "GUAYABAL",
    "SAN JAVIER": "SAN JAVIER",
    "JAVIER": "SAN JAVIER",
    "SAN CRISTOBAL": "SAN CRISTOBAL",
    "SAN CRISTÓBAL": "SAN CRISTOBAL",
    "CRISTOBAL": "SAN CRISTOBAL",
    "ARANJUEZ": "ARANJUEZ",
    "ROBLEDO": "ROBLEDO",
    "CASTILLA": "CASTILLA",
    "MANRIQUE": "MANRIQUE",
    "SANTA CRUZ": "SANTA CRUZ",
    "BUENOS AIRES": "BUENOS AIRES",
    "POPULAR": "POPULAR",
    "VILLA HERMOSA": "VILLA HERMOSA",
    "VILLAHERMOSA": "VILLA HERMOSA",
    "ALTAVISTA": "ALTAVISTA",
    "PALMITAS": "PALMITAS",
    "SANTA ELENA": "SANTA ELENA",
    "SAN ANTONIO DE PRADO": "SAN ANTONIO DE PRADO",
    "SAN ANTONIO": "SAN ANTONIO DE PRADO",
    "PRADO": "SAN ANTONIO DE PRADO",
    "DOCE DE OCTUBRE": "DOCE DE OCTUBRE",
    "12 DE OCTUBRE": "DOCE DE OCTUBRE",
    "LAURELES": "LAURELES",
}


def _load_criminalidad() -> Dict[str, Dict[str, float]]:
    """Carga y parsea el CSV de criminalidad por comuna."""
    data: Dict[str, Dict[str, float]] = {}
    try:
        with open(_CRIMINALIDAD_PATH, encoding="utf-8") as f:
            reader = csv.DictReader(f, delimiter=";")
            for row in reader:
                nombre = row["Nombre"].strip().upper()
                total_str = row["([TotalCasos])"].strip().replace(".", "").replace(",", "")
                tasa_str = row["TasaCriminalidad"].strip().replace(",", ".")
                data[nombre] = {
                    "total": int(total_str),
                    "tasa": float(tasa_str),
                }
    except Exception:
        pass
    return data


def _nivel_seguridad(tasa: float) -> str:
    if tasa < 10:
        return "muy_segura"
    if tasa < 30:
        return "segura"
    if tasa < 100:
        return "moderada"
    if tasa < 300:
        return "peligrosa"
    return "muy_peligrosa"


def _detectar_comunas(prompt_upper: str, data: Dict) -> List[str]:
    """Detecta nombres de comunas mencionados en el prompt."""
    found: List[str] = []
    # Primero buscar aliases (más específicos primero)
    for alias in sorted(_ALIASES.keys(), key=len, reverse=True):
        commune = _ALIASES[alias]
        if alias in prompt_upper and commune not in found:
            found.append(commune)
    # Luego buscar nombres directos que no hayan sido encontrados
    for commune in data:
        if commune in prompt_upper and commune not in found:
            found.append(commune)
    return found


def _safer_alternatives(exclude: List[str], data: Dict, n: int = 3) -> List[str]:
    """Retorna las n comunas más seguras excluyendo las indicadas."""
    sorted_communes = sorted(
        [(k, v["tasa"]) for k, v in data.items() if k not in exclude],
        key=lambda x: x[1],
    )
    return [c[0] for c in sorted_communes[:n]]


def _build_response(commune: str, info: Dict, data: Dict) -> str:
    tasa = info["tasa"]
    nivel = _nivel_seguridad(tasa)
    nombre_display = commune.title()

    if nivel == "muy_segura":
        return (
            f"¡Buena elección! {nombre_display} es una de las zonas más tranquilas de Medellín, "
            f"con una tasa de criminalidad de solo {tasa:.1f} por cada 100,000 habitantes. "
            f"Puedes moverte con confianza por ahí. ¡Disfruta tu actividad! 😊"
        )
    if nivel == "segura":
        return (
            f"{nombre_display} es una zona bastante segura (tasa: {tasa:.1f}). "
            f"Se ubica entre las comunas más tranquilas de la ciudad. "
            f"Puedes ir sin problema, con los cuidados normales de siempre."
        )
    if nivel == "moderada":
        alts = _safer_alternatives([commune], data, 2)
        alts_str = " o ".join(a.title() for a in alts)
        return (
            f"{nombre_display} tiene un nivel de seguridad moderado (tasa: {tasa:.1f}). "
            f"No es la zona más riesgosa, pero te recomiendo estar atento/a a tus pertenencias "
            f"y preferir horarios diurnos. Como alternativa más segura podrías considerar {alts_str}."
        )
    if nivel == "peligrosa":
        alts = _safer_alternatives([commune], data, 3)
        alts_str = ", ".join(a.title() for a in alts[:-1]) + f" o {alts[-1].title()}"
        return (
            f"¡Ten cuidado! {nombre_display} tiene una tasa de criminalidad bastante alta ({tasa:.1f}). ⚠️ "
            f"Si vas a esa zona, ve acompañado/a y evita calles poco iluminadas. 🚶‍♀️🌙 "
            f"Como alternativa más segura podrías considerar {alts_str}."
        )
    # muy_peligrosa
    alts = _safer_alternatives([commune], data, 3)
    alts_str = ", ".join(a.title() for a in alts)
    return (
        f"⚠️ {nombre_display} presenta el mayor índice de criminalidad en Medellín ({tasa:.1f}). "
        f"Te recomiendo fuertemente considerar otras zonas. "
        f"Opciones mucho más seguras serían: {alts_str}. "
        f"Si aun así necesitas ir, hazlo con alguien de confianza y en horas de alta actividad."
    )


def _build_general_response(data: Dict) -> str:
    # Produce a more natural, less robotic greeting. Only include explicit lists
    # when the user asks for them; otherwise offer to provide a summary on request.
    return (
        "Hola, con gusto te ayudo con información de seguridad en Medellín. 🏙️\n\n"
        "Puedo darte una recomendación concreta según la zona o, si prefieres, mostrar un breve resumen de las comunas más seguras y las que presentan más incidencia. "
        "Dime a dónde piensas ir o si quieres el resumen y te lo doy de forma clara y práctica."
    )


class LLMMockService:
    """Simula respuestas de uno o dos modelos para desarrollo inicial de frontend."""

    def __init__(self) -> None:
        self._models: List[Dict[str, Any]] = [
            {
                "id": "gpt-4o-mini-sim",
                "provider": "openai-mock",
                "status": "simulado",
                "latency_ms": 450,
            },
            {
                "id": "llama-3.1-8b-sim",
                "provider": "meta-mock",
                "status": "simulado",
                "latency_ms": 620,
            },
        ]

    def list_models(self) -> List[Dict[str, Any]]:
        return self._models

    def simulate_chat(self, prompt: str, model: str) -> Dict[str, Any]:
        selected = next((m for m in self._models if m["id"] == model), self._models[0])
        latency = selected["latency_ms"]

        time.sleep(min(latency / 1000.0, 0.9))

        reply = (
            "Respuesta simulada para desarrollo: "
            f"analizamos tu prompt y sugerimos validar demanda, competencia y costos. "
            f"Prompt recibido: {prompt[:120]}"
        )

        return {
            "model": selected["id"],
            "provider": selected["provider"],
            "latency_ms": latency,
            "output": reply,
            "tokens": {
                "input_est": max(6, len(prompt.split()) * 2),
                "output_est": 58,
                "total_est": max(6, len(prompt.split()) * 2) + 58,
            },
            "mock": True,
        }

    def simulate_zone_recommendation(self, business_type: str, comuna: str | None = None) -> Dict[str, Any]:
        comuna_target = comuna or "11"
        time.sleep(0.4)

        return {
            "model": "llama-3.1-8b-sim",
            "business_type": business_type,
            "recommended_comuna": comuna_target,
            "confidence": 0.78,
            "rationale": [
                "Alta densidad comercial para categorias similares.",
                "Flujo peatonal estimado favorable segun historicos del dataset.",
                "Competencia moderada en negocios del mismo tipo.",
            ],
            "mock": True,
        }

    def simulate_security_chat(self, prompt: str) -> Dict[str, Any]:
        """Responde preguntas de seguridad basadas en el dataset de criminalidad."""
        data = _load_criminalidad()
        time.sleep(0.6)

        prompt_upper = prompt.upper()
        mentioned = _detectar_comunas(prompt_upper, data)

        if not mentioned:
            response = _build_general_response(data)
        elif len(mentioned) == 1:
            commune = mentioned[0]
            if commune in data:
                activity = self._detect_activity(prompt_upper)
                response = _build_response(commune, data[commune], data)
                # Add lightweight NLP info: tailor to activity and suggest a safe route
                if activity:
                    response += f"\n\nConsejo para {activity}: procura hacerlo en horarios con más gente y por vías principales. {self._route_suggestion()}"
                else:
                    response += f"\n\n{self._route_suggestion()}"
                # Offer estrato info on request
                response += "\n\nSi quieres, puedo añadir información por estrato (cobertura y acceso a servicios)."
            else:
                response = _build_general_response(data)
        else:
            # Varias comunas mencionadas: comparar
            parts = []
            for commune in mentioned:
                if commune in data:
                    tasa = data[commune]["tasa"]
                    nivel = _nivel_seguridad(tasa)
                    etiqueta = {
                        "muy_segura": "muy segura ✅",
                        "segura": "segura ✅",
                        "moderada": "moderada ⚠️",
                        "peligrosa": "peligrosa ❗",
                        "muy_peligrosa": "muy peligrosa 🚨",
                    }[nivel]
                    parts.append(f"**{commune.title()}**: {etiqueta} (tasa: {tasa:.1f})")
            alts = _safer_alternatives(mentioned, data, 2)
            comparacion = "\n".join(parts)
            alts_str = " o ".join(a.title() for a in alts)
            safest = min(mentioned, key=lambda c: data.get(c, {}).get("tasa", 9999))
            response = (
                f"Comparando las zonas que mencionas:\n\n{comparacion}\n\n"
                f"De las opciones, **{safest.title()}** es la más segura de las que nombraste. "
                f"Si quieres una alternativa aún más tranquila, considera {alts_str}."
            )

        return {
            "output": response,
                "comunas_detectadas": mentioned,
            "data_source": "Criminalidad_por_Comuna_data.csv",
            "mock": True,
        }

    def simulate_entrepreneur_chat(self, prompt: str) -> Dict[str, Any]:
        """Simula respuesta del chatbot de emprendedor."""
        time.sleep(0.8)
        
        # Respuesta base
        texto = (
            "Como asesor MECIA, he analizado tu idea. "
            f"Emprender con '{prompt[:50]}...' en Medellín es una gran iniciativa. "
            "Basado en los datos de la zona, veo una oportunidad interesante pero con competencia moderada."
        )
        
        return {
            "texto": texto,
            "recomendaciones_especificas": [
                "Realizar un estudio de mercado detallado en la comuna elegida.",
                "Validar los costos de servicios públicos (EPM) para el estrato del local.",
                "Analizar la competencia directa en un radio de 500 metros.",
                "Considerar una estrategia de marketing digital local."
            ],
            "prediccion_costo_mensual": {
                "energia_estimada": 120000,
                "agua_estimada": 85000,
                "gas_estimada": 45000,
                "total_servicios": 250000,
                "nota": "Estimación inicial mock para un local pequeño."
            },
            "model": "gpt-4o-mini-sim",
            "provider": "openai-mock",
            "mock": True
        }
