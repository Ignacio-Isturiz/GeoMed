"""
Servicio de chatbot para emprendedores que usa LLM real (OpenAI o Gemini)
con datos de negocios, estructura empresarial y tarifas EPM como contexto.
"""

import csv
import json
import math
import os
import unicodedata
import time
from typing import Dict, Any, List, Optional
from collections import defaultdict
from app.core.geo_data import get_coordinates

_BASE_PATH = os.path.join(os.path.dirname(__file__), "..", "..")

_NEGOCIOS_PATH = os.path.join(_BASE_PATH, "datasets", "negocios_medellin_full.csv")
_ESTRUCTURA_PATH = os.path.join(
    _BASE_PATH, "datasets", "Estructura_empresarial_Medellín_según_comunas_y_actividad_económica_20260320.csv"
)
_TARIFA_ENERGIA_PATH = os.path.join(_BASE_PATH, "datasets", "tarifas_servicio_energia_epm.csv")
_TARIFA_ACUEDUCTO_PATH = os.path.join(_BASE_PATH, "datasets", "tarifas_servicio_acueducto_epm.csv")
_TARIFA_GAS_PATH = os.path.join(_BASE_PATH, "datasets", "tarifas_servicio_gas_epm.csv")

# Mapping de comunas para búsqueda flexible
COMUNA_MAPPING = {
    "altavista": "ALTAVISTA",
    "aranjuez": "ARANJUEZ",
    "belen": "BELEN",
    "buenos aires": "BUENOS AIRES",
    "castilla": "CASTILLA",
    "doce de octubre": "DOCE DE OCTUBRE",
    "el poblado": "EL POBLADO",
    "guayabal": "GUAYABAL",
    "la america": "LA AMERICA",
    "la candelaria": "LA CANDELARIA",
    "laureles": "LAURELES-ESTADIO",
    "manrique": "MANRIQUE",
    "palmitas": "PALMITAS",
    "popular": "POPULAR",
    "robledo": "ROBLEDO",
    "san antonio": "SAN ANTONIO DE PRADO",
    "san cristobal": "SAN CRISTOBAL",
    "san javier": "SAN JAVIER",
    "santa cruz": "SANTA CRUZ",
    "santa elena": "SANTA ELENA",
    "villa hermosa": "VILLA HERMOSA",
}

COMUNA_NUMBER_TO_NAME = {
    "1": "POPULAR",
    "2": "SANTA CRUZ",
    "3": "MANRIQUE",
    "4": "ARANJUEZ",
    "5": "CASTILLA",
    "6": "DOCE DE OCTUBRE",
    "7": "ROBLEDO",
    "8": "VILLA HERMOSA",
    "9": "BUENOS AIRES",
    "10": "LA CANDELARIA",
    "11": "LAURELES-ESTADIO",
    "12": "LA AMERICA",
    "13": "SAN JAVIER",
    "14": "EL POBLADO",
    "15": "GUAYABAL",
    "16": "BELEN",
}

DEFAULT_MEDELLIN_COORDS = [6.244, -75.574]

_LOCATION_INTENT_KEYWORDS = {
    "donde",
    "dónde",
    "en que parte",
    "en qué parte",
    "en que zona",
    "en qué zona",
    "en que barrio",
    "en qué barrio",
    "mejor zona",
    "mejor barrio",
    "mejores barrios",
    "abrir",
    "abriria",
    "abriría",
    "abro",
    "abro negocio",
    "monto",
    "montar",
    "montaria",
    "montaría",
    "montar negocio",
    "instalar",
    "instalarme",
    "ubicar",
    "ubicar negocio",
    "ubicacion",
    "ubicación",
    "donde conviene",
    "dónde conviene",
    "conviene",
    "rentable",
    "rentabilidad",
    "viable",
    "negocio",
    "emprender en",
    "iniciar negocio",
    "empezar negocio",
    "local",
    "zona",
    "sector",
    "sectores",
    "barrio",
    "barrios",
    "comuna",
    "comunas",
    "viabilidad",
    "emprender",
    "emprendimiento",
    "presupuesto",
    "arriendo",
    "canon",
    "servicios",
    "costos",
    "coste",
    "costo",
}

_MAP_INTENT_KEYWORDS = {
    "mapa",
    "ubicacion",
    "ubicación",
    "donde",
    "dónde",
    "mostrar mapa",
    "muestrame en mapa",
    "muéstrame en mapa",
    "ver mapa",
    "geografico",
    "geográfico",
    "densidad",
    "distribucion",
    "distribución",
    "competencia por zona",
}

_COUNT_INTENT_KEYWORDS = {
    "cuantas",
    "cuántas",
    "cuantos",
    "cuántos",
    "cantidad",
    "numero",
    "número",
    "total",
    "hay",
}

_CONTEXT_MAX_AREAS = 40

_DATA_CACHE: Dict[str, Any] = {
    "updated_at": 0.0,
    "ttl_seconds": 600,
    "source_signature": None,
    "negocios": None,
    "estructura": None,
    "tariffs": None,
    "negocio_types": None,
}


def _normalize_text(value: str) -> str:
    normalized = unicodedata.normalize("NFD", (value or "").lower().strip())
    return "".join(c for c in normalized if unicodedata.category(c) != "Mn")


def _extract_relevant_types(
    prompt: str,
    negocios: Dict[str, Dict[str, Dict[str, int]]],
    negocio_types: Optional[set[str]] = None,
) -> set[str]:
    prompt_norm = _normalize_text(prompt)
    relevant_types: set[str] = set()

    all_types = negocio_types
    if all_types is None:
        all_types = set()
        for barrios in negocios.values():
            for b_counts in barrios.values():
                all_types.update(b_counts.keys())

    for negocio_type in all_types:
        type_norm = _normalize_text(negocio_type)
        # Match flexible para capturar singular/plural y variaciones simples.
        if (
            type_norm in prompt_norm
            or (len(type_norm) > 4 and type_norm[:-1] in prompt_norm)
            or (len(prompt_norm) > 4 and prompt_norm in type_norm)
        ):
            relevant_types.add(negocio_type)

    return relevant_types


def _normalize_comuna_for_coordinates(comuna_value: str) -> str:
    comuna_clean = (comuna_value or "").strip().upper()
    if comuna_clean in COMUNA_NUMBER_TO_NAME:
        return COMUNA_NUMBER_TO_NAME[comuna_clean]
    return comuna_clean


def _build_map_data_from_dataset(
    prompt: str,
    negocios: Dict[str, Dict[str, Dict[str, int]]],
    negocio_types: Optional[set[str]] = None,
) -> Optional[Dict[str, Any]]:
    relevant_types = _extract_relevant_types(prompt, negocios, negocio_types)
    if not relevant_types:
        return None

    area_counts = defaultdict(int)
    for comm, barrios in negocios.items():
        for barrio, barrio_counts in barrios.items():
            total = sum(barrio_counts.get(negocio_type, 0) for negocio_type in relevant_types)
            if total > 0:
                area_counts[(comm, barrio)] += total

    if not area_counts:
        return None

    sorted_rows = sorted(area_counts.items(), key=lambda item: (-item[1], item[0][0], item[0][1]))
    locations = [
        {
            "name": barrio,
            "comuna": _normalize_comuna_for_coordinates(comuna),
            "count": count,
        }
        for (comuna, barrio), count in sorted_rows
    ]

    return {
        "type": "markers",
        "locations": locations,
    }


def _detect_map_intent(prompt: str) -> bool:
    prompt_norm = _normalize_text(prompt)
    return any(keyword in prompt_norm for keyword in _MAP_INTENT_KEYWORDS)


def _detect_count_intent(prompt: str) -> bool:
    prompt_norm = _normalize_text(prompt)
    return any(keyword in prompt_norm for keyword in _COUNT_INTENT_KEYWORDS)


def _extract_mentioned_commune(prompt: str) -> Optional[str]:
    prompt_norm = _normalize_text(prompt)

    for key, formal_name in COMUNA_MAPPING.items():
        if _normalize_text(key) in prompt_norm:
            return formal_name

    for formal_name in COMUNA_MAPPING.values():
        if _normalize_text(formal_name) in prompt_norm:
            return formal_name

    # Soporte para referencia numérica "comuna 14"
    for num, name in COMUNA_NUMBER_TO_NAME.items():
        if f"comuna {num}" in prompt_norm:
            return name

    return None


def _build_fast_count_response(
    prompt: str,
    negocios: Dict[str, Dict[str, Dict[str, int]]],
    negocio_types: set[str],
    mentioned_commune: Optional[str],
    map_intent: bool,
) -> Optional[Dict[str, Any]]:
    if not _detect_count_intent(prompt):
        return None

    relevant_types = _extract_relevant_types(prompt, negocios, negocio_types)
    if not relevant_types:
        return None

    tipo_texto = ", ".join(sorted(relevant_types))

    if mentioned_commune and mentioned_commune in negocios:
        barrio_counts = []
        for barrio, counts in negocios[mentioned_commune].items():
            count = sum(counts.get(t, 0) for t in relevant_types)
            if count > 0:
                barrio_counts.append((barrio, count))

        total = sum(count for _, count in barrio_counts)
        top_barrios = sorted(barrio_counts, key=lambda x: -x[1])[:5]

        if total == 0:
            texto = f"No encontré registros de {tipo_texto} en {mentioned_commune} según el dataset disponible."
        else:
            top_txt = "; ".join(f"{b} ({c})" for b, c in top_barrios) if top_barrios else "sin detalle por barrio"
            texto = (
                f"En {mentioned_commune} hay aproximadamente {total} registros de {tipo_texto}. "
                f"Barrios con mayor concentración: {top_txt}."
            )
    else:
        comuna_counts = defaultdict(int)
        for comuna, barrios in negocios.items():
            for _, counts in barrios.items():
                comuna_counts[comuna] += sum(counts.get(t, 0) for t in relevant_types)

        total = sum(comuna_counts.values())
        top_comunas = sorted(
            [(c, n) for c, n in comuna_counts.items() if n > 0],
            key=lambda x: -x[1],
        )[:5]

        if total == 0:
            texto = f"No encontré registros de {tipo_texto} en Medellín con los datos actuales."
        else:
            top_txt = "; ".join(f"{c} ({n})" for c, n in top_comunas) if top_comunas else "sin detalle por comuna"
            texto = (
                f"En Medellín hay aproximadamente {total} registros de {tipo_texto}. "
                f"Comunas con mayor concentración: {top_txt}."
            )

    map_data = _build_map_data_from_dataset(prompt, negocios, negocio_types) if map_intent else None

    return {
        "output": texto,
        "recomendaciones_especificas": [
            "Si quieres, te comparo 2 barrios con menor competencia y mejor dinámica comercial para abrir tu negocio."
        ],
        "prediccion_costo_mensual": {},
        "map_data": map_data,
    }


def _enrich_map_locations(map_data: Optional[Dict[str, Any]]) -> Optional[Dict[str, Any]]:
    if not map_data or map_data.get("type") != "markers":
        return map_data

    locations = map_data.get("locations", [])
    enriched_locations = []
    index_by_comuna = defaultdict(int)
    coords_cache: Dict[str, List[float]] = {}

    for loc in locations:
        barrio = loc.get("name", "")
        comuna = _normalize_comuna_for_coordinates(loc.get("comuna", ""))
        # Priorizar buscar por comuna para obtener el centro
        coords = coords_cache.get(comuna)
        if not coords:
            coords = get_coordinates(comuna) or get_coordinates(barrio)
            if coords:
                coords_cache[comuna] = coords
        if not coords:
            # Nunca descartamos puntos del mapa; fallback al centro de Medellin.
            coords = DEFAULT_MEDELLIN_COORDS

        # Distribuye barrios por comuna en una espiral para evitar solapes.
        idx = index_by_comuna[comuna]
        index_by_comuna[comuna] += 1

        slots_per_ring = 8
        ring = (idx // slots_per_ring) + 1
        slot = idx % slots_per_ring
        angle = (2 * math.pi * slot / slots_per_ring) + (ring * 0.35)
        radius = 0.0035 * ring

        lat_offset = radius * math.sin(angle)
        lng_offset = radius * math.cos(angle)

        loc["lat"] = coords[0] + lat_offset
        loc["lng"] = coords[1] + lng_offset
        # El nombre para el popup será "Barrio, Comuna"
        loc["comuna"] = comuna
        loc["name"] = f"{barrio} ({comuna})" if comuna else barrio
        enriched_locations.append(loc)

    map_data["locations"] = enriched_locations
    return map_data


def _detect_business_location_intent(prompt: str) -> bool:
    prompt_norm = _normalize_text(prompt)
    return any(keyword in prompt_norm for keyword in _LOCATION_INTENT_KEYWORDS)


def _build_two_barrios_candidates(
    prompt: str,
    negocios: Dict[str, Dict[str, Dict[str, int]]],
    estructura: Dict[str, Dict[str, int]],
    negocio_types: Optional[set[str]] = None,
) -> List[Dict[str, Any]]:
    """
    Selecciona 2 barrios candidatos usando un score que combina:
    - Menor competencia directa (tipo de negocio consultado)
    - Dinamismo comercial del barrio (total negocios)
    - Actividad empresarial de la comuna
    """
    relevant_types = _extract_relevant_types(prompt, negocios, negocio_types)

    comuna_activity_totals = {
        comuna: sum(activities.values())
        for comuna, activities in estructura.items()
    }
    max_comuna_activity = max(comuna_activity_totals.values(), default=1)

    candidates: List[Dict[str, Any]] = []

    for comuna, barrios in negocios.items():
        comuna_activity_norm = comuna_activity_totals.get(comuna, 0) / max_comuna_activity
        for barrio, counts in barrios.items():
            total_barrio = sum(counts.values())
            diversidad = sum(1 for value in counts.values() if value > 0)

            if relevant_types:
                competencia_directa = sum(counts.get(t, 0) for t in relevant_types)
                if competencia_directa <= 0:
                    continue
            else:
                # Fallback para prompts sin tipo de negocio explícito.
                competencia_directa = total_barrio

            # Menos competencia directa aumenta el score, con saturación logarítmica.
            competition_factor = 1 / (1 + math.log1p(max(competencia_directa, 1)))
            activity_factor = min(total_barrio / 400.0, 1.0)
            diversity_factor = min(diversidad / 30.0, 1.0)

            score = (
                (0.55 * competition_factor)
                + (0.30 * activity_factor)
                + (0.15 * comuna_activity_norm)
                + (0.05 * diversity_factor)
            )

            candidates.append(
                {
                    "barrio": barrio,
                    "comuna": comuna,
                    "competencia_directa": competencia_directa,
                    "total_negocios_barrio": total_barrio,
                    "score": round(score, 4),
                }
            )

    candidates.sort(
        key=lambda x: (
            -x["score"],
            x["competencia_directa"],
            -x["total_negocios_barrio"],
            x["comuna"],
            x["barrio"],
        )
    )
    return candidates[:2]


def _estimate_epm_monthly_total(estrato: str, tariffs: Dict[str, Dict[str, Dict[str, float]]]) -> float:
    total_est = 0.0
    if estrato in tariffs.get("energia", {}):
        total_est += tariffs["energia"][estrato].get("cargo_promedio", 0) * 100
    if estrato in tariffs.get("acueducto", {}):
        total_est += tariffs["acueducto"][estrato].get("cargo_promedio", 0) * 20
    if estrato in tariffs.get("gas", {}):
        total_est += tariffs["gas"][estrato].get("cargo_promedio", 0) * 10
    return total_est


def _build_startup_tips(
    relevant_types: set[str],
    top_barrios: List[Dict[str, Any]],
    tariffs: Dict[str, Dict[str, Dict[str, float]]],
) -> List[str]:
    tipo_texto = ", ".join(sorted(relevant_types)) if relevant_types else "tu categoría de negocio"
    estrato_3 = _estimate_epm_monthly_total("3", tariffs)
    estrato_4 = _estimate_epm_monthly_total("4", tariffs)

    tips = [
        (
            f"Haz un piloto de 2 semanas en {top_barrios[0]['barrio']} y {top_barrios[1]['barrio']} "
            f"midiendo flujo peatonal por franja horaria y ticket promedio para validar demanda real de {tipo_texto}."
        ),
        (
            f"Usa la competencia directa del dataset para diferenciar oferta: "
            f"{top_barrios[0]['barrio']} ({top_barrios[0]['competencia_directa']}) vs "
            f"{top_barrios[1]['barrio']} ({top_barrios[1]['competencia_directa']})."
        ),
        (
            f"Calcula tu punto de equilibrio incluyendo servicios EPM: estrato 3 ~${estrato_3:,.0f}/mes "
            f"y estrato 4 ~${estrato_4:,.0f}/mes según tarifas del dataset."
        ),
    ]
    return tips


def _append_top_barrios_summary(
    base_text: str,
    top_barrios: List[Dict[str, Any]],
    relevant_types: set[str],
) -> str:
    if len(top_barrios) < 2:
        return base_text

    tipo_texto = ", ".join(sorted(relevant_types)) if relevant_types else "tu negocio"
    section = (
        "\n\nBarrios priorizados con datos reales (exactamente 2):\n"
        f"1) {top_barrios[0]['barrio']} ({top_barrios[0]['comuna']}): "
        f"{top_barrios[0]['competencia_directa']} negocios de {tipo_texto} y "
        f"{top_barrios[0]['total_negocios_barrio']} negocios totales en el barrio.\n"
        f"2) {top_barrios[1]['barrio']} ({top_barrios[1]['comuna']}): "
        f"{top_barrios[1]['competencia_directa']} negocios de {tipo_texto} y "
        f"{top_barrios[1]['total_negocios_barrio']} negocios totales en el barrio."
    )
    return f"{(base_text or '').strip()}{section}"


def _load_negocios_data() -> Dict[str, Dict[str, Dict[str, int]]]:
    """
    Carga negocios_medellin_full.csv y estructura por comuna → barrio → tipo_negocio.
    Retorna: {comuna: {barrio: {tipo_negocio: cantidad}}}
    """
    data = defaultdict(lambda: defaultdict(lambda: defaultdict(int)))
    try:
        with open(_NEGOCIOS_PATH, encoding="utf-8") as f:
            reader = csv.DictReader(f, delimiter=",")
            for row in reader:
                if not row.get("tipo_negocio"):
                    continue
                Comuna = row.get("comuna", "").strip().upper()
                barrio = row.get("barrio", "").strip()
                tipo = row.get("tipo_negocio", "").strip().lower()
                cantidad = int(row.get("cantidad_actual", "0") or "0")
                if Comuna and barrio and tipo and cantidad > 0:
                    data[Comuna][barrio][tipo] += cantidad
    except Exception as e:
        print(f"Error loading negocios data: {e}")
    return dict(data)


def _load_estructura_empresarial() -> Dict[str, Dict[str, int]]:
    """
    Carga Estructura_empresarial por comuna y actividad (año 2022).
    Retorna: {comuna: {actividad_descripcion: count}}
    """
    data = defaultdict(lambda: defaultdict(int))
    try:
        with open(_ESTRUCTURA_PATH, encoding="utf-8") as f:
            reader = csv.DictReader(f, delimiter=",")
            for row in reader:
                year = row.get("AÑO", "").strip()
                if year != "2022":  # Solo datos más recientes
                    continue
                descripcion = row.get("Descripción", "").strip()
                if not descripcion or descripcion == "Sin CIIU":
                    continue
                # Sumar los valores de cada comuna
                for comuna_key in COMUNA_MAPPING.values():
                    val_str = row.get(comuna_key, "").strip()
                    if val_str and val_str.isdigit():
                        data[comuna_key][descripcion] += int(val_str)
    except Exception as e:
        print(f"Error loading estructura empresarial: {e}")
    return dict(data)


def _load_epm_tariffs() -> Dict[str, Dict[str, Dict[str, float]]]:
    """
    Carga tarifas EPM para energía, acueducto y gas.
    Retorna: {servicio: {estrato: {campo: valor}}}
    """
    tariffs = {}
    try:
        # Energía
        tariffs["energia"] = _parse_energia_tariffs()
        # Acueducto
        tariffs["acueducto"] = _parse_acueducto_tariffs()
        # Gas
        tariffs["gas"] = _parse_gas_tariffs()
    except Exception as e:
        print(f"Error loading EPM tariffs: {e}")
    return tariffs


def _parse_energia_tariffs() -> Dict[str, Dict[str, float]]:
    """Parse tarifas_servicio_energia_epm.csv - retorna estimates por estrato."""
    result = {}
    try:
        with open(_TARIFA_ENERGIA_PATH, encoding="utf-8") as f:
            reader = csv.DictReader(f, delimiter=",")
            for row in reader:
                nivel = row.get("nivel", "").strip()
                if nivel in ["I", "II", "III", "IV", "V", "VI"]:
                    estrato_map = {"I": "1", "II": "2", "III": "3", "IV": "4", "V": "5", "VI": "6"}
                    estrato = estrato_map.get(nivel)
                    if estrato:
                        # Promediar valores para este estrato
                        try:
                            val = float(row.get("propiedadepm", "0") or "0")
                            if estrato not in result:
                                result[estrato] = []
                            result[estrato].append(val)
                        except:
                            pass
        # Calcular promedio por estrato (estimada para 100 kWh/mes)
        for estrato in result:
            result[estrato] = {"cargo_promedio": sum(result[estrato]) / len(result[estrato]) if result[estrato] else 0}
    except Exception as e:
        print(f"Error parsing energia tariffs: {e}")
    return result


def _parse_acueducto_tariffs() -> Dict[str, Dict[str, float]]:
    """Parse tarifas_servicio_acueducto_epm.csv."""
    result = {}
    try:
        with open(_TARIFA_ACUEDUCTO_PATH, encoding="utf-8") as f:
            reader = csv.DictReader(f, delimiter=",")
            for row in reader:
                if row.get("municipio", "").upper() == "MEDELLIN":
                    estrato = row.get("estrato", "").strip()
                    if estrato.startswith("Residencial"):
                        # Extraer número de estrato de texto como "Residencial,3"
                        parts = row.get("estrato", ",").split(",")
                        if len(parts) > 1:
                            est_num = parts[-1].strip()
                            if est_num.isdigit():
                                try:
                                    cargo = float(row.get("cargoporconsumo", "0") or "0")
                                    if est_num not in result:
                                        result[est_num] = []
                                    result[est_num].append(cargo)
                                except:
                                    pass
        # Promediar
        for est in result:
            result[est] = {"cargo_promedio": sum(result[est]) / len(result[est]) if result[est] else 0}
    except Exception as e:
        print(f"Error parsing acueducto tariffs: {e}")
    return result


def _parse_gas_tariffs() -> Dict[str, Dict[str, float]]:
    """Parse tarifas_servicio_gas_epm.csv."""
    result = {}
    try:
        with open(_TARIFA_GAS_PATH, encoding="utf-8") as f:
            reader = csv.DictReader(f, delimiter=",")
            for row in reader:
                sector = row.get("sector", "").strip()
                estrato = row.get("estrato", "").strip()
                if sector.lower() == "residencial" and estrato.isdigit():
                    try:
                        cargo = float(row.get("cargo_por_consumo_mayor", "0") or "0")
                        if estrato not in result:
                            result[estrato] = []
                        result[estrato].append(cargo)
                    except:
                        pass
        # Promediar
        for est in result:
            result[est] = {"cargo_promedio": sum(result[est]) / len(result[est]) if result[est] else 0}
    except Exception as e:
        print(f"Error parsing gas tariffs: {e}")
    return result


def _normalize_commune_name(name: str) -> Optional[str]:
    """Normaliza un nombre de comuna para búsqueda."""
    if not name:
        return None
    normalized = name.lower().strip()
    return COMUNA_MAPPING.get(normalized)


def _build_context_for_llm(prompt: str, negocios: Dict, estructura: Dict, tariffs: Dict) -> str:
    """Extrae contexto relevante del prompt y datasets para el LLM de forma dinámica."""
    context_lines = []

    # 1. Identificar Comuna mencionada
    mentioned_commune = None
    for key, formal_name in COMUNA_MAPPING.items():
        if key.replace("_", " ") in prompt.lower():
            mentioned_commune = formal_name
            break

    # 2. Identificar tipos de negocio mencionados DINÁMICAMENTE
    relevant_types = _extract_relevant_types(prompt, negocios)

    # Sección 1: Competencia por tipo de negocio detectado
    if relevant_types:
        context_lines.append(f"=== DATOS DE NEGOCIOS PARA: {', '.join(relevant_types).upper()} en Medellín ===")
        # Agregamos por (comuna, barrio)
        area_counts = defaultdict(int) 
        for comm, barrios in negocios.items():
            for barrio, barrio_counts in barrios.items():
                for t in relevant_types:
                    count = barrio_counts.get(t, 0)
                    if count > 0:
                        area_counts[(comm, barrio)] += count
        
        # Mostrar todos los barrios con conteo positivo
        # Formato: [BARRIO] ([COMUNA]): [COUNT]
        sorted_areas = sorted(area_counts.items(), key=lambda x: -x[1])
        for (comm, barrio), count in sorted_areas[:_CONTEXT_MAX_AREAS]:
            context_lines.append(f"  - {barrio} ({comm}): {count} negocios aprox.")
        if len(sorted_areas) > _CONTEXT_MAX_AREAS:
            context_lines.append(
                f"  - ... y {len(sorted_areas) - _CONTEXT_MAX_AREAS} barrios adicionales (disponibles para mapa)."
            )
        context_lines.append("")

    # Sección 2: Detalle por comuna si se menciona o si hay tipos relevantes
    if mentioned_commune and mentioned_commune in negocios:
        context_lines.append(f"=== DETALLE EN {mentioned_commune} ===")
        barrios_data = negocios[mentioned_commune]
        
        if relevant_types:
            for t in relevant_types:
                context_lines.append(f"Negocios de {t} por barrio:")
                for barrio, tipos in sorted(barrios_data.items(), key=lambda x: -x[1].get(t, 0))[:8]:
                    count = tipos.get(t, 0)
                    if count > 0:
                        context_lines.append(f"  - {barrio}: {count}")
        else:
            context_lines.append("Top barrios por total de negocios:")
            for barrio, tipos in sorted(barrios_data.items(), key=lambda x: -sum(x[1].values()))[:5]:
                context_lines.append(f"  - {barrio}: {sum(tipos.values())} negocios")
        context_lines.append("")

    # Sección 3: Estructura empresarial
    if mentioned_commune and mentioned_commune in estructura:
        context_lines.append(f"=== ESTRUCTURA EMPRESARIAL EN {mentioned_commune} ===")
        top_activities = sorted(estructura[mentioned_commune].items(), key=lambda x: -x[1])[:5]
        for activity, count in top_activities:
            context_lines.append(f"  - {activity}: {count} empresas")
        context_lines.append("")

    # Sección 4: Costos EPM
    if tariffs:
        context_lines.append("=== COSTOS ESTIMADOS DE SERVICIOS PÚBLICOS (EPM) ===")
        for estrato in ["3", "4", "5"]:
            total_est = 0
            if estrato in tariffs.get("energia", {}):
                total_est += tariffs["energia"][estrato].get("cargo_promedio", 0) * 100
            if estrato in tariffs.get("acueducto", {}):
                total_est += tariffs["acueducto"][estrato].get("cargo_promedio", 0) * 20
            if estrato in tariffs.get("gas", {}):
                total_est += tariffs["gas"][estrato].get("cargo_promedio", 0) * 10
            context_lines.append(f"  Estrato {estrato}: ~${total_est:,.0f}/mes")
        context_lines.append("")

    return "\n".join(context_lines)


_SYSTEM_PROMPT_TEMPLATE = """Eres MECIA Emprendedor, un asistente especializado en asesorar emprendedores de Medellín, Colombia.
Tu rol es conversar naturalmente sobre emprendimiento, negocios, ubicaciones, costos y estrategias de mercado.

CONTEXTO DE DATOS DISPONIBLES DE MEDELLÍN:
{datos_contexto}

INSTRUCCIONES DE RESPUESTA:
- Responde en español natural, amigable y motivador.
- Si el usuario pregunta por ubicaciones o cantidades de negocios en Medellín (ej: cuántas panaderías hay), DEBES incluir un campo "map_data" en el JSON.
- Si la consulta es de viabilidad, ubicación o apertura de negocio, recomienda EXACTAMENTE 2 barrios prioritarios.
- Para cada uno de esos 2 barrios, justifica con datos concretos del contexto (cantidad de negocios del tipo consultado y/o actividad empresarial de la comuna).
- En "recomendaciones_especificas" incluye mínimo 3 tips accionables para iniciar el negocio, basados en los datasets de negocios, estructura empresarial y tarifas EPM.
- El campo "map_data" debe tener el tipo "markers" y una lista de "locations".
- CADA location debe tener: "name" (Nombre del Barrio), "comuna" (Nombre de la Comuna) y "count" (cantidad de negocios).
- IMPORTANTE: Incluye TODOS los barrios que el contexto indique que tienen ese tipo de negocio. No omitas ninguno. Queremos ver la densidad total en el mapa.

FORMATO DE RESPUESTA — responde ÚNICAMENTE con este JSON:
{{
  "texto": "Respuesta conversacional...",
  "recomendaciones_especificas": ["Rec 1", "Rec 2"],
  "prediccion_costo_mensual": {{ ... }},
  "map_data": {{
    "type": "markers",
    "locations": [
      {{"name": "Nombre Barrio 1", "comuna": "POBLADO", "count": 10}},
      {{"name": "Nombre Barrio 2", "comuna": "LAURELES-ESTADIO", "count": 15}}
    ]
  }}
}}

NOTAS:
- "map_data" es opcional.
- El nombre de la "comuna" debe coincidir EXACTAMENTE con los nombres en mayúsculas (ej: EL POBLADO, BELEN, ARANJUEZ).
"""


def _build_system_prompt(prompt: str, negocios: Dict, estructura: Dict, tariffs: Dict) -> str:
    contexto = _build_context_for_llm(prompt, negocios, estructura, tariffs)
    return _SYSTEM_PROMPT_TEMPLATE.format(datos_contexto=contexto)


def _compute_source_signature() -> tuple[float, float, float]:
    return (
        os.path.getmtime(_NEGOCIOS_PATH),
        os.path.getmtime(_ESTRUCTURA_PATH),
        os.path.getmtime(_TARIFA_ENERGIA_PATH) + os.path.getmtime(_TARIFA_ACUEDUCTO_PATH) + os.path.getmtime(_TARIFA_GAS_PATH),
    )


def _get_cached_datasets() -> Dict[str, Any]:
    now = time.time()
    try:
        signature = _compute_source_signature()
    except Exception:
        signature = None

    should_reload = (
        _DATA_CACHE["negocios"] is None
        or _DATA_CACHE["estructura"] is None
        or _DATA_CACHE["tariffs"] is None
        or (_DATA_CACHE["source_signature"] != signature)
        or (now - _DATA_CACHE["updated_at"] > _DATA_CACHE["ttl_seconds"])
    )

    if should_reload:
        negocios = _load_negocios_data()
        estructura = _load_estructura_empresarial()
        tariffs = _load_epm_tariffs()

        negocio_types: set[str] = set()
        for barrios in negocios.values():
            for b_counts in barrios.values():
                negocio_types.update(b_counts.keys())

        _DATA_CACHE["negocios"] = negocios
        _DATA_CACHE["estructura"] = estructura
        _DATA_CACHE["tariffs"] = tariffs
        _DATA_CACHE["negocio_types"] = negocio_types
        _DATA_CACHE["source_signature"] = signature
        _DATA_CACHE["updated_at"] = now

    return {
        "negocios": _DATA_CACHE["negocios"],
        "estructura": _DATA_CACHE["estructura"],
        "tariffs": _DATA_CACHE["tariffs"],
        "negocio_types": _DATA_CACHE["negocio_types"] or set(),
    }


async def _call_openai(prompt: str, system_prompt: str, api_key: str) -> Dict:
    from openai import AsyncOpenAI

    client = AsyncOpenAI(api_key=api_key)
    response = await client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": prompt},
        ],
        max_tokens=2200,
        temperature=0.7,
        response_format={"type": "json_object"},
    )
    raw = response.choices[0].message.content.strip()
    return json.loads(raw)


async def _call_gemini(prompt: str, system_prompt: str, api_key: str) -> Dict:
    import google.generativeai as genai

    genai.configure(api_key=api_key)
    model = genai.GenerativeModel(
        model_name="gemini-1.5-flash",
        system_instruction=system_prompt,
    )
    response = await model.generate_content_async(prompt)
    raw = response.text.strip()
    
    # Limpiar posibles bloques de código triple backtick
    if "```json" in raw:
        raw = raw.split("```json")[1].split("```")[0].strip()
    elif "```" in raw:
        raw = raw.split("```")[1].split("```")[0].strip()
        
    return json.loads(raw.strip())


async def entrepreneur_chat_real(
    prompt: str, provider: str, openai_key: str, gemini_key: str
) -> Dict[str, Any]:
    """
    Chatbot de emprendedor con contexto de negocios, estructura empresarial y tarifas.
    Retorna recomendaciones específicas basadas en datos reales.
    """
    cached = _get_cached_datasets()
    negocios = cached["negocios"]
    estructura = cached["estructura"]
    tariffs = cached["tariffs"]
    negocio_types = cached["negocio_types"]

    map_intent = _detect_map_intent(prompt)
    location_intent = _detect_business_location_intent(prompt)
    mentioned_commune = _extract_mentioned_commune(prompt)

    fast_count_result = _build_fast_count_response(
        prompt=prompt,
        negocios=negocios,
        negocio_types=negocio_types,
        mentioned_commune=mentioned_commune,
        map_intent=map_intent,
    )
    if fast_count_result is not None:
        fast_count_result["map_data"] = _enrich_map_locations(fast_count_result.get("map_data"))
        fast_count_result["model"] = "fast-rule-engine"
        fast_count_result["provider"] = "deterministic"
        fast_count_result["mock"] = False
        return fast_count_result

    system_prompt = _build_system_prompt(prompt, negocios, estructura, tariffs)

    try:
        if provider == "openai" and openai_key:
            llm_result = await _call_openai(prompt, system_prompt, openai_key)
            model_used = "gpt-4o-mini"
        elif provider == "gemini" and gemini_key:
            llm_result = await _call_gemini(prompt, system_prompt, gemini_key)
            model_used = "gemini-1.5-flash"
        elif openai_key:
            llm_result = await _call_openai(prompt, system_prompt, openai_key)
            model_used = "gpt-4o-mini"
        elif gemini_key:
            llm_result = await _call_gemini(prompt, system_prompt, gemini_key)
            model_used = "gemini-1.5-flash"
        else:
            raise ValueError("No hay API key configurada para ningún proveedor LLM.")

        # Blindaje: construir map_data de forma determinística desde el dataset.
        deterministic_map_data = _build_map_data_from_dataset(prompt, negocios, negocio_types) if map_intent else None
        relevant_types = _extract_relevant_types(prompt, negocios, negocio_types)
        top_barrios = _build_two_barrios_candidates(prompt, negocios, estructura, negocio_types) if location_intent else []

        if location_intent and len(top_barrios) == 2:
            llm_result["texto"] = _append_top_barrios_summary(
                llm_result.get("texto", ""),
                top_barrios,
                relevant_types,
            )

            deterministic_tips = _build_startup_tips(relevant_types, top_barrios, tariffs)
            existing_tips = [t for t in llm_result.get("recomendaciones_especificas", []) if isinstance(t, str)]
            merged_tips: List[str] = []
            for tip in existing_tips + deterministic_tips:
                normalized_tip = tip.strip()
                if normalized_tip and normalized_tip not in merged_tips:
                    merged_tips.append(normalized_tip)
            llm_result["recomendaciones_especificas"] = merged_tips[:5]

        # Enriquecer map_data con coordenadas
        llm_map_data = llm_result.get("map_data") if map_intent else None
        map_data = deterministic_map_data or llm_map_data
        map_data = _enrich_map_locations(map_data)

        return {
            "output": llm_result.get("texto", ""),
            "recomendaciones_especificas": llm_result.get("recomendaciones_especificas", []),
            "prediccion_costo_mensual": llm_result.get("prediccion_costo_mensual", {}),
            "map_data": map_data,
            "model": model_used,
            "provider": provider,
            "mock": False,
        }

    except Exception as e:
        import traceback
        error_trace = traceback.format_exc()
        print(f"Error in entrepreneur_chat_real: {e}")
        print(error_trace)
        
        from app.services.llm_mock import LLMMockService
        mock = LLMMockService()
        result = mock.simulate_entrepreneur_chat(prompt)
        result["error_llm"] = str(e)
        result["error_trace"] = error_trace
        result["fallback_mock"] = True
        return result
