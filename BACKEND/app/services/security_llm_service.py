"""
Servicio de chatbot de seguridad que usa LLM real (OpenAI o Gemini)
con los datos de criminalidad por comuna como contexto.
"""

import csv
import json
import os
from typing import Dict, Any, List

_CRIMINALIDAD_PATH = os.path.join(
    os.path.dirname(__file__), "..", "..", "datasets", "Criminalidad_por_Comuna_data.csv"
)

_STRAT_PATH = os.path.join(
    os.path.dirname(__file__), "..", "..", "datasets", "reporte_de_estratificacion_y_cobertura (2).csv"
)


def _load_criminalidad_rows() -> List[Dict]:
    """Carga el CSV y retorna lista de dicts con nombre, tasa y casos."""
    rows = []
    try:
        with open(_CRIMINALIDAD_PATH, encoding="utf-8-sig") as f:
            reader = csv.DictReader(f, delimiter=";")
            for row in reader:
                rows.append({
                    "nombre": row["Nombre"].strip(),
                    "tasa": float(row["TasaCriminalidad"].strip().replace(",", ".")),
                    "casos": int(row["([TotalCasos])"].strip()),
                })
        rows.sort(key=lambda r: r["tasa"])
    except Exception as e:
        rows = [{"nombre": f"Error: {e}", "tasa": 0, "casos": 0}]
    return rows


def _rows_to_text(rows: List[Dict]) -> str:
    return "\n".join(
        f"  - {r['nombre']}: tasa {r['tasa']:.2f} ({r['casos']} casos)"
        for r in rows
    )


_SYSTEM_PROMPT_TEMPLATE = """Eres MECIA Seguridad, un asistente ciudadano para Medellín, Colombia.
Tu rol es ayudar a los ciudadanos a tomar decisiones informadas sobre seguridad en la ciudad,
basándote en datos reales de criminalidad.

DATOS DE CRIMINALIDAD POR COMUNA (tasa por cada 100,000 habitantes — a mayor tasa, más riesgo):
{datos_comunas}

INSTRUCCIONES DE RESPUESTA:
- Responde en español natural, cercano y empático, como si hablaras con un vecino — evita sonar robótico.
- Usa 0-3 emojis por respuesta para dar calidez (ej. 😊, ⚠️, 🚶‍♀️), no abuses de ellos.
- Basa tus respuestas únicamente en los datos anteriores. No inventes zonas ni cifras.
- Si una zona es peligrosa, sugiere alternativas más seguras del dataset y evita contradicciones (no recomendar y luego listar la misma comuna como peligrosa).
- Adapta el consejo a la actividad que mencione el usuario (trotar, ir de compras, salir de noche, etc.). Si corresponde, incluye una breve sugerencia de ruta/práctica de seguridad (una frase).
- Sé natural y conversacional: puedes usar una o dos frases principales y una frase final breve de cierre. Mantén `texto` claro y útil.
- Si preguntan algo fuera de seguridad en Medellín, recuerda amablemente tu función.

FORMATO DE RESPUESTA — responde ÚNICAMENTE con este JSON, sin texto fuera de él:
{{
  "texto": "tu respuesta natural aquí",
  "mostrar_mapa": true o false,
  "comunas_destacadas": ["NOMBRE_COMUNA_1", "NOMBRE_COMUNA_2"]
}}

REGLAS PARA mostrar_mapa:
- true: cuando el usuario pide comparar comunas, rankings, zonas más/menos seguras, o menciona una comuna específica para evaluarla
- false: consejos puntuales, precauciones generales, saludos, preguntas sin referencia geográfica

REGLAS PARA comunas_destacadas:
- Lista con los nombres EXACTOS (como aparecen en los datos) de las comunas que el usuario mencionó o que son directamente relevantes para responder
- Si el usuario pregunta "¿cuáles son las más peligrosas?" → pon las 3 con mayor tasa
- Si el usuario dice "compara Laureles con Aranjuez" → ["LAURELES-ESTADIO", "ARANJUEZ"]
- Si el usuario pregunta por una sola zona → solo esa zona
- Si mostrar_mapa es false → lista vacía []
"""


def _build_system_prompt(rows: List[Dict]) -> str:
    # Include a short summary of estratification / cobertura to help the model
    strat_summary = _build_strat_summary()
    return _SYSTEM_PROMPT_TEMPLATE.format(datos_comunas=_rows_to_text(rows)) + "\n\n" + strat_summary


def _load_strat_rows() -> List[Dict]:
    rows: List[Dict] = []
    try:
        with open(_STRAT_PATH, encoding="utf-8") as f:
            reader = csv.DictReader(f)
            for row in reader:
                # Normalize and parse
                try:
                    estrato = row.get("estrato", "").strip()
                    servicio = row.get("servicio", "").strip()
                    cobertura = row.get("cobertura", "").strip()
                    suscriptores = row.get("suscriptores", "").strip()
                    rows.append({
                        "servicio": servicio,
                        "estrato": estrato,
                        "cobertura": cobertura,
                        "suscriptores": suscriptores,
                    })
                except Exception:
                    continue
    except Exception:
        rows = []
    return rows


def _build_strat_summary() -> str:
    rows = _load_strat_rows()
    if not rows:
        return ""
    # Compute simple aggregates per estrato
    counts: Dict[str, int] = {}
    coverage_examples: Dict[str, set] = {}
    for r in rows:
        e = r.get("estrato", "-")
        counts[e] = counts.get(e, 0) + 1
        coverage_examples.setdefault(e, set()).add(r.get("cobertura", ""))

    parts = []
    for e in sorted(counts.keys(), key=lambda x: (x == "" , x)):
        covs = ",".join(sorted(list(coverage_examples.get(e, [])) ) )
        parts.append(f"Estrato {e}: muestras de cobertura {covs}")

    return "DATOS DE ESTRATIFICACIÓN Y COBERTURA:\n" + "\n".join(parts)


async def _call_openai(prompt: str, rows: List[Dict], api_key: str) -> Dict:
    from openai import AsyncOpenAI

    client = AsyncOpenAI(api_key=api_key)
    response = await client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[
            {"role": "system", "content": _build_system_prompt(rows)},
            {"role": "user", "content": prompt},
        ],
        max_tokens=500,
        temperature=0.7,
        response_format={"type": "json_object"},
    )
    raw = response.choices[0].message.content.strip()
    return json.loads(raw)


async def _call_gemini(prompt: str, rows: List[Dict], api_key: str) -> Dict:
    import google.generativeai as genai

    genai.configure(api_key=api_key)
    model = genai.GenerativeModel(
        model_name="gemini-1.5-flash",
        system_instruction=_build_system_prompt(rows),
    )
    response = await model.generate_content_async(prompt)
    raw = response.text.strip()
    if raw.startswith("```"):
        raw = raw.split("```")[1]
        if raw.startswith("json"):
            raw = raw[4:]
    return json.loads(raw.strip())


async def security_chat_real(prompt: str, provider: str, openai_key: str, gemini_key: str) -> Dict[str, Any]:
    """
    Llama al LLM con el contexto de criminalidad.
    Retorna texto de respuesta + flag de mapa + datos reales del CSV.
    """
    rows = _load_criminalidad_rows()

    try:
        if provider == "openai" and openai_key:
            llm_result = await _call_openai(prompt, rows, openai_key)
            model_used = "gpt-4o-mini"
        elif provider == "gemini" and gemini_key:
            llm_result = await _call_gemini(prompt, rows, gemini_key)
            model_used = "gemini-1.5-flash"
        elif openai_key:
            llm_result = await _call_openai(prompt, rows, openai_key)
            model_used = "gpt-4o-mini"
        elif gemini_key:
            llm_result = await _call_gemini(prompt, rows, gemini_key)
            model_used = "gemini-1.5-flash"
        else:
            raise ValueError("No hay API key configurada para ningún proveedor LLM.")

        return {
            "output": llm_result.get("texto", ""),
            "mostrar_mapa": llm_result.get("mostrar_mapa", False),
            "comunas_destacadas": llm_result.get("comunas_destacadas", []),
            "datos_mapa": rows,
            "model": model_used,
            "provider": provider,
            "mock": False,
        }

    except Exception as e:
        from app.services.llm_mock import LLMMockService
        mock = LLMMockService()
        result = mock.simulate_security_chat(prompt)
        result["mostrar_mapa"] = False
        result["datos_mapa"] = rows
        result["error_llm"] = str(e)
        result["fallback_mock"] = True
        return result
