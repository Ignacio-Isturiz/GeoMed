"""
Servicio de análisis de facturas EPM con GPT-4o Vision.
Usa los datasets de tarifas de energía, acueducto y gas como contexto.
"""

import base64
import csv
import json
import os
from typing import Dict, Any

from openai import AsyncOpenAI

_DATASETS_DIR = os.path.join(os.path.dirname(__file__), "..", "..", "datasets")

_ENERGIA_PATH = os.path.join(_DATASETS_DIR, "tarifas_servicio_energia_epm.csv")
_ACUEDUCTO_PATH = os.path.join(_DATASETS_DIR, "tarifas_servicio_acueducto_epm.csv")
_GAS_PATH = os.path.join(_DATASETS_DIR, "tarifas_servicio_gas_epm.csv")


def _load_latest_tarifas_energia(n: int = 30) -> str:
    """Carga las últimas n filas de tarifas de energía para estratos residenciales."""
    lines = []
    try:
        with open(_ENERGIA_PATH, encoding="utf-8-sig") as f:
            reader = csv.DictReader(f)
            rows = [r for r in reader if "residencial" in r.get("tipodetarifa", "").lower()
                    or "con contribución" in r.get("tipodedato", "").lower()
                    or "sin contribución" in r.get("tipodedato", "").lower()]
            for r in rows[-n:]:
                lines.append(
                    f"  Energía | {r.get('tipodetarifa','')} | Nivel {r.get('nivel','')} | "
                    f"Prop.cliente: ${r.get('propiedaddelcliente','0')} kWh | "
                    f"{r.get('mes','')} {r.get('year','')}"
                )
    except Exception as e:
        lines.append(f"  (Error cargando tarifas energía: {e})")
    return "\n".join(lines) if lines else "  (Sin datos de energía)"


def _load_latest_tarifas_acueducto(n: int = 30) -> str:
    """Carga las últimas n filas de tarifas de acueducto residencial en Medellín."""
    lines = []
    try:
        with open(_ACUEDUCTO_PATH, encoding="utf-8-sig") as f:
            reader = csv.DictReader(f)
            rows = [r for r in reader
                    if r.get("sector", "").lower() == "residencial"
                    and r.get("municipio", "").lower() in ("medellín", "medellin")]
            for r in rows[-n:]:
                lines.append(
                    f"  Acueducto | Estrato {r.get('estrato','')} | {r.get('servicio','')} | "
                    f"Cargo fijo: ${r.get('cargofijo','0')} | "
                    f"Por consumo: ${r.get('cargoporconsumo','0')} m³ | "
                    f"{r.get('mes','')} {r.get('year','')}"
                )
    except Exception as e:
        lines.append(f"  (Error cargando tarifas acueducto: {e})")
    return "\n".join(lines) if lines else "  (Sin datos de acueducto)"


def _load_latest_tarifas_gas(n: int = 20) -> str:
    """Carga las últimas n filas de tarifas de gas residencial."""
    lines = []
    try:
        with open(_GAS_PATH, encoding="utf-8-sig") as f:
            reader = csv.DictReader(f)
            rows = [r for r in reader if r.get("sector", "").lower() == "residencial"]
            for r in rows[-n:]:
                lines.append(
                    f"  Gas | Estrato {r.get('estrato','')} | "
                    f"Cargo fijo: ${r.get('cargo_fijo','0')} | "
                    f"Por consumo menor: ${r.get('cargo_por_consumo_menor','0')} m³ | "
                    f"{r.get('mes','')} {r.get('year','')}"
                )
    except Exception as e:
        lines.append(f"  (Error cargando tarifas gas: {e})")
    return "\n".join(lines) if lines else "  (Sin datos de gas)"


def _build_system_prompt() -> str:
    energia = _load_latest_tarifas_energia()
    acueducto = _load_latest_tarifas_acueducto()
    gas = _load_latest_tarifas_gas()

    return f"""Eres MECIA Servicios, un analista experto en facturas EPM de Medellín.
Recibirás una o varias imágenes de una factura EPM (energía, acueducto, gas, o combinada).

TARIFAS REALES EPM (datos oficiales más recientes):
ENERGÍA ($/kWh por estrato y nivel):
{energia}

ACUEDUCTO Y ALCANTARILLADO ($/m³ por estrato):
{acueducto}

GAS NATURAL ($/m³ por estrato):
{gas}

CONSUMOS PROMEDIO MENSUALES EN MEDELLÍN (referencia por estrato):
- Energía: Estrato 1-2: 80-120 kWh | Estrato 3-4: 150-200 kWh | Estrato 5-6: 250-400 kWh
- Agua: Estrato 1-2: 8-12 m³ | Estrato 3-4: 14-20 m³ | Estrato 5-6: 22-35 m³
- Gas: Estrato 1-2: 6-10 m³ | Estrato 3-4: 10-15 m³ | Estrato 5-6: 15-22 m³

REGLAS ESTRICTAS — DEBES CUMPLIRLAS TODAS:
1. Lee y extrae los NÚMEROS EXACTOS de la factura: kWh o m³ consumidos, valor total a pagar, estrato, período.
2. Compara el consumo real leído vs el promedio para ese estrato. Calcula el % de diferencia.
3. Cada recomendación DEBE mencionar cifras reales de la factura. Ejemplo correcto: "Consumiste 245 kWh, un 22% sobre el promedio del estrato 4 (200 kWh). Reducir 45 kWh equivale a apagar el calentador eléctrico 2 horas/día menos."
4. NUNCA escribas recomendaciones genéricas sin números (como "apaga las luces" o "cierra los grifos"). Cada recomendación debe tener el dato de consumo o el valor en pesos.
5. Predicción: calcula con las tarifas EPM reales: (consumo actual − reducción estimada) × tarifa del estrato + cargo fijo. Muestra la operación.
6. Si no puedes leer un dato de la imagen, escríbelo como "no legible" en lugar de inventarlo.

RESPONDE ÚNICAMENTE CON ESTE JSON (sin texto fuera del JSON):
{{
  "resumen": "Titular, servicio, período, consumo exacto leído y valor total exacto de la factura",
  "datos_extraidos": {{
    "servicio": "energía | acueducto | gas | combinada",
    "estrato": "número leído o 'no legible'",
    "consumo": "número exacto con unidad (ej: 245 kWh)",
    "valor_actual": "valor exacto en pesos (ej: $198.450)",
    "periodo": "mes y año"
  }},
  "analisis_consumo": "Comparación numérica: consumo real vs promedio del estrato. Porcentaje de desviación y qué lo puede estar causando.",
  "recomendaciones": [
    "Recomendación con cifras reales de esta factura",
    "Recomendación con cifras reales de esta factura",
    "Recomendación con cifras reales de esta factura"
  ],
  "prediccion": {{
    "valor_estimado": "monto en pesos (ej: $162.000)",
    "ahorro_estimado": "diferencia en pesos vs factura actual (ej: $36.450)",
    "calculo": "Paso a paso: consumo reducido × tarifa EPM estrato X + cargo fijo = resultado"
  }}
}}"""


async def analyze_bill(images: list[tuple[bytes, str]], api_key: str) -> Dict[str, Any]:
    """
    Analiza una o varias imágenes de la misma factura EPM con GPT-4o Vision.
    images: lista de (image_bytes, content_type)
    Retorna análisis, recomendaciones y predicción de próxima factura.
    """
    from openai import AsyncOpenAI
    import json

    image_contents = []
    for i, (image_bytes, content_type) in enumerate(images):
        b64_image = base64.b64encode(image_bytes).decode("utf-8")
        if len(images) > 1:
            image_contents.append({"type": "text", "text": f"Imagen {i + 1} de {len(images)}:"})
        image_contents.append({
            "type": "image_url",
            "image_url": {
                "url": f"data:{content_type};base64,{b64_image}",
                "detail": "high",
            },
        })

    client = AsyncOpenAI(api_key=api_key)
    response = await client.chat.completions.create(
        model="gpt-4o",
        messages=[
            {"role": "system", "content": _build_system_prompt()},
            {
                "role": "user",
                "content": [
                    {
                        "type": "text",
                        "text": f"Analiza {'estas ' + str(len(images)) + ' imágenes' if len(images) > 1 else 'esta imagen'} de factura(s) EPM como un solo documento y responde en el formato JSON indicado.",
                    },
                    *image_contents,
                ],
            },
        ],
        max_tokens=1200,
        temperature=0.3,
    )

    raw = response.choices[0].message.content.strip()

    # Limpiar posibles bloques markdown ```json ... ```
    if raw.startswith("```"):
        raw = raw.split("```")[1]
        if raw.startswith("json"):
            raw = raw[4:]
        raw = raw.strip()

    try:
        result = json.loads(raw)
    except json.JSONDecodeError:
        result = {"resumen": raw, "recomendaciones": [], "prediccion": {}, "datos_extraidos": {}}

    result["model"] = "gpt-4o"
    result["mock"] = False
    return result
