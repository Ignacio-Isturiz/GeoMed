"""
Servicio de datasets: lógica de negocio para manejo de datos
Responsable de leer y procesar archivos de datos (CSV, etc)
"""
from pathlib import Path
import csv
from typing import List, Dict, Any, Optional
import logging

logger = logging.getLogger(__name__)


def _pick_first(row: Dict[str, Any], keys: list[str], default: str = "") -> str:
    """Devuelve el primer valor existente en una lista de posibles encabezados."""
    for key in keys:
        if key in row and row[key] is not None:
            return str(row[key]).strip()
    return default


def _is_blank_or_na(value: Any) -> bool:
    if value is None:
        return True
    text = str(value).strip().lower()
    return text in {"", "n/a", "na", "none", "null", "nan", "-"}


def _to_int(value: Any, default: int = 0) -> int:
    """Convierte valores numéricos con distintos separadores a int."""
    if value is None:
        return default

    text = str(value).strip().replace('"', '')
    if not text:
        return default

    normalized = text.replace('.', '').replace(',', '')
    try:
        return int(float(normalized))
    except (ValueError, TypeError):
        return default


def _to_float(value: Any, default: float = 0.0) -> float:
    """Convierte texto con %, comas o puntos a float."""
    if value is None:
        return default

    text = str(value).strip().replace('"', '').replace('%', '')
    if not text:
        return default

    if ',' in text and '.' in text:
        normalized = text.replace('.', '').replace(',', '.')
    elif ',' in text:
        normalized = text.replace(',', '.')
    else:
        normalized = text

    try:
        return float(normalized)
    except (ValueError, TypeError):
        return default


class DatasetsService:
    """
    Servicio para gestionar y servir datos de datasets.
    Encapsula la lógica de lectura y procesamiento de archivos.
    """
    
    def __init__(self):
        """Inicializa rutas de datasets"""
        # Ruta relativa a datasets
        self.datasets_path = Path(__file__).parent.parent.parent / "datasets"

    def _get_empresarial_file(self) -> Path:
        return (
            self.datasets_path /
            "Estructura_empresarial_Medellín_según_comunas_y_actividad_económica_20260320.csv"
        )

    def _get_estratificacion_file(self) -> Path:
        return self.datasets_path / "reporte_de_estratificacion_y_cobertura (2).csv"

    def _get_negocios_medellin_file(self) -> Path:
        return self.datasets_path / "negocios_medellin_full.csv"

    @staticmethod
    def _normalize_tarifa_dataset(dataset: str) -> str:
        normalized = (dataset or "").strip().lower().replace("_", "-")
        aliases = {
            "gas": "gas",
            "tarifas-servicio-gas-epm": "gas",
            "tarifas-servicio-gas-epm.csv": "gas",
            "acueducto": "acueducto",
            "tarifas-servicio-acueducto-epm": "acueducto",
            "tarifas-servicio-acueducto-epm.csv": "acueducto",
            "energia": "energia",
            "energía": "energia",
            "tarifas-servicio-energia-epm": "energia",
            "tarifas-servicio-energia-epm.csv": "energia",
        }
        return aliases.get(normalized, normalized)

    def _get_tarifa_file(self, dataset: str) -> Path:
        key = self._normalize_tarifa_dataset(dataset)
        mapping = {
            "gas": "tarifas_servicio_gas_epm.csv",
            "acueducto": "tarifas_servicio_acueducto_epm.csv",
            "energia": "tarifas_servicio_energia_epm.csv",
        }
        if key not in mapping:
            raise ValueError("Dataset de tarifas no soportado")
        return self.datasets_path / mapping[key]

    @staticmethod
    def _mes_index(mes: str) -> int:
        order = {
            "enero": 1,
            "febrero": 2,
            "marzo": 3,
            "abril": 4,
            "mayo": 5,
            "junio": 6,
            "julio": 7,
            "agosto": 8,
            "septiembre": 9,
            "setiembre": 9,
            "octubre": 10,
            "noviembre": 11,
            "diciembre": 12,
        }
        return order.get((mes or "").strip().lower(), 99)

    @staticmethod
    def _tarifa_referencia(row: Dict[str, Any]) -> float:
        candidates = [
            row.get("consumo_menor", 0.0),
            row.get("consumo_general", 0.0),
            row.get("propiedadepm", 0.0),
            row.get("punta", 0.0),
            row.get("fuera_punta", 0.0),
            row.get("cargo_fijo", 0.0),
        ]
        for value in candidates:
            if value and value > 0:
                return float(value)
        return 0.0

    def _load_tarifa_rows(
        self,
        dataset: str,
    ) -> tuple[List[Dict[str, Any]], List[int], List[str], List[str], List[str]]:
        csv_path = self._get_tarifa_file(dataset)
        if not csv_path.exists():
            raise FileNotFoundError(f"Dataset no encontrado en {csv_path}")

        key = self._normalize_tarifa_dataset(dataset)
        rows: List[Dict[str, Any]] = []
        years: set[int] = set()
        months: set[str] = set()
        sectors: set[str] = set()
        estratos: set[str] = set()

        with open(csv_path, 'r', encoding='utf-8-sig', newline='') as f:
            reader = csv.DictReader(f)
            for raw in reader:
                year = _to_int(_pick_first(raw, ["year", "año", "anio"], "0"), 0)
                mes = _pick_first(raw, ["mes", "Mes"], "")
                sector = _pick_first(raw, ["sector", "tipodetarifa", "tipodedato"], "")
                estrato = _pick_first(raw, ["estrato", "nivel", "rangodeconsumo"], "")
                servicio = _pick_first(raw, ["servicio", "tipodetarifa", "tipodeinformacion"], key)

                mes = "" if _is_blank_or_na(mes) else mes
                sector = "" if _is_blank_or_na(sector) else sector
                estrato = "" if _is_blank_or_na(estrato) else estrato
                servicio = key if _is_blank_or_na(servicio) else servicio

                row = {
                    "dataset": key,
                    "servicio": servicio,
                    "sector": sector,
                    "estrato": estrato,
                    "year": year,
                    "mes": mes,
                    "cargo_fijo": _to_float(_pick_first(raw, ["cargo_fijo", "cargofijo"], "0"), 0.0),
                    "consumo_menor": _to_float(
                        _pick_first(raw, ["cargo_por_consumo_menor", "cargoporconsumomenor"], "0"),
                        0.0,
                    ),
                    "consumo_mayor": _to_float(
                        _pick_first(raw, ["cargo_por_consumo_mayor", "cargoporconsumomayor"], "0"),
                        0.0,
                    ),
                    "consumo_general": _to_float(
                        _pick_first(raw, ["cargo_por_consumo", "cargoporconsumo"], "0"),
                        0.0,
                    ),
                    "propiedadepm": _to_float(_pick_first(raw, ["propiedadepm"], "0"), 0.0),
                    "punta": _to_float(_pick_first(raw, ["punta"], "0"), 0.0),
                    "fuera_punta": _to_float(_pick_first(raw, ["fueradepunta"], "0"), 0.0),
                }
                row["tarifa_referencia"] = self._tarifa_referencia(row)

                rows.append(row)
                if year:
                    years.add(year)
                if mes:
                    months.add(mes)
                if sector:
                    sectors.add(sector)
                if estrato:
                    estratos.add(estrato)

        ordered_months = sorted(list(months), key=self._mes_index)
        return rows, sorted(list(years)), ordered_months, sorted(list(sectors)), sorted(list(estratos))

    def get_tarifas_data(
        self,
        dataset: str,
        year: Optional[int] = None,
        mes: Optional[str] = None,
        limit: int = 300,
    ) -> Dict[str, Any]:
        rows, years, months, sectors, estratos = self._load_tarifa_rows(dataset)
        key = self._normalize_tarifa_dataset(dataset)
        filtered = [
            row for row in rows
            if (year is None or row["year"] == year)
            and (mes is None or row["mes"].lower() == mes.lower())
        ]
        return {
            "dataset": key,
            "available": {
                "years": years,
                "months": months,
                "sectors": sectors,
                "estratos": estratos,
            },
            "count": len(filtered),
            "data": filtered[:limit],
        }

    def get_tarifas_summary(self, dataset: str, year: Optional[int] = None) -> Dict[str, Any]:
        rows, years, months, sectors, estratos = self._load_tarifa_rows(dataset)
        key = self._normalize_tarifa_dataset(dataset)
        filtered = [row for row in rows if (year is None or row["year"] == year)]

        if not filtered:
            return {
                "dataset": key,
                "year": year,
                "available_years": years,
                "total_registros": 0,
                "tarifa_promedio": 0,
                "tarifa_maxima": 0,
                "tarifa_minima": 0,
                "months": months,
                "sectors": sectors,
                "estratos": estratos,
            }

        refs = [row["tarifa_referencia"] for row in filtered]
        return {
            "dataset": key,
            "year": year,
            "available_years": years,
            "total_registros": len(filtered),
            "tarifa_promedio": round(sum(refs) / len(refs), 2),
            "tarifa_maxima": max(refs),
            "tarifa_minima": min(refs),
            "months": months,
            "sectors": sectors,
            "estratos": estratos,
        }

    def get_tarifas_por_estrato(self, dataset: str, year: Optional[int] = None) -> List[Dict[str, Any]]:
        rows, _, _, _, _ = self._load_tarifa_rows(dataset)
        filtered = [row for row in rows if (year is None or row["year"] == year)]

        grouped: Dict[str, Dict[str, Any]] = {}
        for row in filtered:
            key = row["estrato"] or "N/A"
            if key not in grouped:
                grouped[key] = {
                    "estrato": key,
                    "sum_tarifa": 0.0,
                    "registros": 0,
                }
            grouped[key]["sum_tarifa"] += row["tarifa_referencia"]
            grouped[key]["registros"] += 1

        result: List[Dict[str, Any]] = []
        for value in grouped.values():
            registros = value["registros"] or 1
            result.append(
                {
                    "estrato": value["estrato"],
                    "tarifa_promedio": round(value["sum_tarifa"] / registros, 2),
                    "registros": value["registros"],
                }
            )

        return sorted(result, key=lambda item: item["tarifa_promedio"], reverse=True)

    def get_tarifas_tendencia(
        self,
        dataset: str,
        year: Optional[int] = None,
        limit: int = 24,
    ) -> List[Dict[str, Any]]:
        rows, _, _, _, _ = self._load_tarifa_rows(dataset)
        filtered = [row for row in rows if (year is None or row["year"] == year)]

        grouped: Dict[tuple[int, str], Dict[str, Any]] = {}
        for row in filtered:
            key = (row["year"], row["mes"])
            if key not in grouped:
                grouped[key] = {
                    "year": row["year"],
                    "mes": row["mes"],
                    "sum_tarifa": 0.0,
                    "registros": 0,
                }
            grouped[key]["sum_tarifa"] += row["tarifa_referencia"]
            grouped[key]["registros"] += 1

        ordered = sorted(
            grouped.values(),
            key=lambda item: (item["year"], self._mes_index(item["mes"])),
        )

        result: List[Dict[str, Any]] = []
        for item in ordered[:limit]:
            registros = item["registros"] or 1
            result.append(
                {
                    "year": item["year"],
                    "mes": item["mes"],
                    "periodo": f"{item['mes']} {item['year']}",
                    "tarifa_promedio": round(item["sum_tarifa"] / registros, 2),
                    "registros": item["registros"],
                }
            )

        return result

    def _load_empresarial_rows(self) -> tuple[List[Dict[str, Any]], List[str], List[int]]:
        """
        Carga y normaliza el dataset empresarial.

        Returns:
            Tupla (rows, comunas, years)
        """
        csv_path = self._get_empresarial_file()
        if not csv_path.exists():
            raise FileNotFoundError(f"Dataset no encontrado en {csv_path}")

        rows: List[Dict[str, Any]] = []
        years: set[int] = set()

        with open(csv_path, 'r', encoding='utf-8-sig', newline='') as f:
            reader = csv.DictReader(f)
            fieldnames = reader.fieldnames or []

            excluded = {"AÑO", "ANO", "CIIU", "Descripción", "Descripcion"}
            comuna_columns = [name for name in fieldnames if name not in excluded]

            for row in reader:
                anio = _to_int(_pick_first(row, ["AÑO", "ANO"], "0"), 0)
                if anio:
                    years.add(anio)

                ciiu = _pick_first(row, ["CIIU"], "")
                descripcion = _pick_first(row, ["Descripción", "Descripcion"], "")

                comunas: Dict[str, int] = {
                    comuna: _to_int(row.get(comuna, 0), 0)
                    for comuna in comuna_columns
                }

                total_empresas = sum(comunas.values())
                top_comuna = max(comunas, key=comunas.get) if comunas else None

                rows.append(
                    {
                        "anio": anio,
                        "ciiu": ciiu,
                        "descripcion": descripcion,
                        "total_empresas": total_empresas,
                        "top_comuna": top_comuna,
                        "top_comuna_total": comunas.get(top_comuna, 0) if top_comuna else 0,
                        "comunas": comunas,
                    }
                )

        return rows, comuna_columns, sorted(list(years))

    def get_empresarial_years(self) -> List[int]:
        _, _, years = self._load_empresarial_rows()
        return years

    def get_empresarial_summary(self, year: Optional[int] = None) -> Dict[str, Any]:
        rows, comuna_columns, years = self._load_empresarial_rows()
        filtered = [row for row in rows if (year is None or row["anio"] == year)]

        if not filtered:
            return {
                "year": year,
                "available_years": years,
                "total_actividades": 0,
                "total_empresas": 0,
                "total_comunas": len(comuna_columns),
                "actividad_top": None,
                "comuna_top": None,
            }

        total_empresas = sum(row["total_empresas"] for row in filtered)
        actividad_top = max(filtered, key=lambda item: item["total_empresas"])

        comuna_totales: Dict[str, int] = {comuna: 0 for comuna in comuna_columns}
        for row in filtered:
            for comuna, value in row["comunas"].items():
                comuna_totales[comuna] += value

        comuna_top = max(comuna_totales, key=comuna_totales.get) if comuna_totales else None

        return {
            "year": year,
            "available_years": years,
            "total_actividades": len(filtered),
            "total_empresas": total_empresas,
            "total_comunas": len(comuna_columns),
            "actividad_top": {
                "ciiu": actividad_top["ciiu"],
                "descripcion": actividad_top["descripcion"],
                "total_empresas": actividad_top["total_empresas"],
            },
            "comuna_top": {
                "nombre": comuna_top,
                "total_empresas": comuna_totales.get(comuna_top, 0) if comuna_top else 0,
            },
        }

    def get_empresarial_top_actividades(
        self,
        year: Optional[int] = None,
        limit: int = 5,
    ) -> List[Dict[str, Any]]:
        rows, _, _ = self._load_empresarial_rows()
        filtered = [row for row in rows if (year is None or row["anio"] == year)]

        ordered = sorted(filtered, key=lambda item: item["total_empresas"], reverse=True)
        top = ordered[:limit]

        return [
            {
                "anio": row["anio"],
                "ciiu": row["ciiu"],
                "descripcion": row["descripcion"],
                "total_empresas": row["total_empresas"],
                "top_comuna": row["top_comuna"],
                "top_comuna_total": row["top_comuna_total"],
            }
            for row in top
        ]

    def get_empresarial_top_comunas(
        self,
        year: Optional[int] = None,
        limit: int = 5,
    ) -> List[Dict[str, Any]]:
        rows, comuna_columns, _ = self._load_empresarial_rows()
        filtered = [row for row in rows if (year is None or row["anio"] == year)]

        comuna_totales: Dict[str, int] = {comuna: 0 for comuna in comuna_columns}
        for row in filtered:
            for comuna, value in row["comunas"].items():
                comuna_totales[comuna] += value

        ordered = sorted(comuna_totales.items(), key=lambda item: item[1], reverse=True)

        return [
            {
                "comuna": comuna,
                "total_empresas": total,
            }
            for comuna, total in ordered[:limit]
        ]

    def get_emprendedor_overview(
        self,
        year: Optional[int] = None,
        limit: int = 5,
    ) -> Dict[str, Any]:
        return {
            "criminalidad": self.get_criminalidad_summary(),
            "empresarial": self.get_empresarial_summary(year),
            "top_actividades": self.get_empresarial_top_actividades(year=year, limit=limit),
            "top_comunas": self.get_empresarial_top_comunas(year=year, limit=limit),
            "years": self.get_empresarial_years(),
        }

    def _load_estratificacion_rows(self) -> tuple[List[Dict[str, Any]], List[str], List[int], List[str]]:
        """Carga y normaliza el dataset de estratificacion y cobertura."""
        csv_path = self._get_estratificacion_file()
        if not csv_path.exists():
            raise FileNotFoundError(f"Dataset no encontrado en {csv_path}")

        rows: List[Dict[str, Any]] = []
        servicios: set[str] = set()
        estratos: set[int] = set()
        periodos: set[str] = set()

        with open(csv_path, 'r', encoding='utf-8-sig', newline='') as f:
            reader = csv.DictReader(f)

            for row in reader:
                servicio = _pick_first(row, ["servicio", "Servicio"], "")
                if _is_blank_or_na(servicio):
                    continue
                estrato = _to_int(_pick_first(row, ["estrato", "Estrato"], "0"), 0)
                suscriptores = _to_int(_pick_first(row, ["suscriptores", "Suscriptores"], "0"), 0)
                cobertura = _to_float(_pick_first(row, ["cobertura", "Cobertura"], "0"), 0.0)
                periodo = _pick_first(row, ["periodo", "Periodo"], "")

                servicios.add(servicio)
                if estrato:
                    estratos.add(estrato)
                if periodo:
                    periodos.add(periodo)

                rows.append(
                    {
                        "servicio": servicio,
                        "estrato": estrato,
                        "suscriptores": suscriptores,
                        "cobertura": cobertura,
                        "periodo": periodo,
                    }
                )

        return rows, sorted(list(servicios)), sorted(list(estratos)), sorted(list(periodos))

    def get_estratificacion_data(
        self,
        servicio: Optional[str] = None,
        estrato: Optional[int] = None,
        periodo: Optional[str] = None,
        limit: int = 200,
    ) -> Dict[str, Any]:
        rows, servicios, estratos, periodos = self._load_estratificacion_rows()

        filtered = [
            row for row in rows
            if (servicio is None or row["servicio"].lower() == servicio.lower())
            and (estrato is None or row["estrato"] == estrato)
            and (periodo is None or row["periodo"] == periodo)
        ]

        return {
            "filters": {
                "servicio": servicio,
                "estrato": estrato,
                "periodo": periodo,
                "limit": limit,
            },
            "available": {
                "servicios": servicios,
                "estratos": estratos,
                "periodos": periodos,
            },
            "count": len(filtered),
            "data": filtered[:limit],
        }

    def get_estratificacion_summary(self, periodo: Optional[str] = None) -> Dict[str, Any]:
        rows, servicios, estratos, periodos = self._load_estratificacion_rows()
        filtered = [row for row in rows if (periodo is None or row["periodo"] == periodo)]

        if not filtered:
            return {
                "periodo": periodo,
                "available_periodos": periodos,
                "total_registros": 0,
                "total_suscriptores": 0,
                "cobertura_promedio": 0,
                "cobertura_maxima": 0,
                "cobertura_minima": 0,
                "servicios": servicios,
                "estratos": estratos,
            }

        coberturas = [row["cobertura"] for row in filtered]
        total_suscriptores = sum(row["suscriptores"] for row in filtered)

        return {
            "periodo": periodo,
            "available_periodos": periodos,
            "total_registros": len(filtered),
            "total_suscriptores": total_suscriptores,
            "cobertura_promedio": round(sum(coberturas) / len(coberturas), 2),
            "cobertura_maxima": max(coberturas),
            "cobertura_minima": min(coberturas),
            "servicios": servicios,
            "estratos": estratos,
        }

    def get_estratificacion_por_servicio(self, periodo: Optional[str] = None) -> List[Dict[str, Any]]:
        rows, _, _, _ = self._load_estratificacion_rows()
        filtered = [row for row in rows if (periodo is None or row["periodo"] == periodo)]

        grouped: Dict[str, Dict[str, Any]] = {}
        for row in filtered:
            key = row["servicio"]
            if key not in grouped:
                grouped[key] = {
                    "servicio": key,
                    "total_suscriptores": 0,
                    "sum_cobertura": 0.0,
                    "registros": 0,
                }

            grouped[key]["total_suscriptores"] += row["suscriptores"]
            grouped[key]["sum_cobertura"] += row["cobertura"]
            grouped[key]["registros"] += 1

        result: List[Dict[str, Any]] = []
        for value in grouped.values():
            registros = value["registros"] or 1
            result.append(
                {
                    "servicio": value["servicio"],
                    "total_suscriptores": value["total_suscriptores"],
                    "cobertura_promedio": round(value["sum_cobertura"] / registros, 2),
                    "registros": value["registros"],
                }
            )

        return sorted(result, key=lambda item: item["total_suscriptores"], reverse=True)

    def get_estratificacion_por_estrato(self, periodo: Optional[str] = None) -> List[Dict[str, Any]]:
        rows, _, _, _ = self._load_estratificacion_rows()
        filtered = [row for row in rows if (periodo is None or row["periodo"] == periodo)]

        grouped: Dict[int, Dict[str, Any]] = {}
        for row in filtered:
            key = row["estrato"]
            if key not in grouped:
                grouped[key] = {
                    "estrato": key,
                    "total_suscriptores": 0,
                    "sum_cobertura": 0.0,
                    "registros": 0,
                }

            grouped[key]["total_suscriptores"] += row["suscriptores"]
            grouped[key]["sum_cobertura"] += row["cobertura"]
            grouped[key]["registros"] += 1

        result: List[Dict[str, Any]] = []
        for value in grouped.values():
            registros = value["registros"] or 1
            result.append(
                {
                    "estrato": value["estrato"],
                    "total_suscriptores": value["total_suscriptores"],
                    "cobertura_promedio": round(value["sum_cobertura"] / registros, 2),
                    "registros": value["registros"],
                }
            )

        return sorted(result, key=lambda item: item["estrato"])

    def get_estratificacion_top_cobertura(
        self,
        periodo: Optional[str] = None,
        limit: int = 5,
    ) -> List[Dict[str, Any]]:
        rows, _, _, _ = self._load_estratificacion_rows()
        filtered = [row for row in rows if (periodo is None or row["periodo"] == periodo)]
        ordered = sorted(filtered, key=lambda item: item["cobertura"], reverse=True)
        return ordered[:limit]

    def _load_negocios_medellin_rows(
        self,
    ) -> tuple[List[Dict[str, Any]], List[str], List[str], List[str], List[str], List[str]]:
        """Carga y normaliza el dataset de negocios por comuna y barrio."""
        csv_path = self._get_negocios_medellin_file()
        if not csv_path.exists():
            raise FileNotFoundError(f"Dataset no encontrado en {csv_path}")

        rows: List[Dict[str, Any]] = []
        comunas: set[str] = set()
        barrios: set[str] = set()
        categorias: set[str] = set()
        tipos: set[str] = set()
        fechas: set[str] = set()

        with open(csv_path, 'r', encoding='utf-8-sig', newline='') as f:
            reader = csv.DictReader(f)

            for raw in reader:
                comuna = _pick_first(raw, ["comuna"], "")
                barrio = _pick_first(raw, ["barrio"], "")
                tipo_negocio = _pick_first(raw, ["tipo_negocio"], "")
                categoria = _pick_first(raw, ["categoria"], "")
                fecha = _pick_first(raw, ["fecha_recoleccion"], "")

                if _is_blank_or_na(comuna) or _is_blank_or_na(barrio):
                    continue

                row = {
                    "id": _to_int(_pick_first(raw, ["id"], "0"), 0),
                    "comuna": comuna,
                    "barrio": barrio,
                    "tipo_negocio": "" if _is_blank_or_na(tipo_negocio) else tipo_negocio,
                    "categoria": "" if _is_blank_or_na(categoria) else categoria,
                    "cantidad_actual": _to_int(_pick_first(raw, ["cantidad_actual"], "0"), 0),
                    "fecha_recoleccion": "" if _is_blank_or_na(fecha) else fecha,
                }

                rows.append(row)
                comunas.add(row["comuna"])
                barrios.add(row["barrio"])
                if row["categoria"]:
                    categorias.add(row["categoria"])
                if row["tipo_negocio"]:
                    tipos.add(row["tipo_negocio"])
                if row["fecha_recoleccion"]:
                    fechas.add(row["fecha_recoleccion"])

        return (
            rows,
            sorted(list(comunas), key=lambda value: _to_int(value, 9999)),
            sorted(list(barrios)),
            sorted(list(categorias)),
            sorted(list(tipos)),
            sorted(list(fechas), reverse=True),
        )

    def get_negocios_medellin_data(
        self,
        comuna: Optional[str] = None,
        barrio: Optional[str] = None,
        categoria: Optional[str] = None,
        tipo_negocio: Optional[str] = None,
        fecha_recoleccion: Optional[str] = None,
        limit: int = 200,
    ) -> Dict[str, Any]:
        rows, comunas, barrios, categorias, tipos, fechas = self._load_negocios_medellin_rows()

        filtered = [
            row for row in rows
            if (comuna is None or row["comuna"] == comuna)
            and (barrio is None or row["barrio"].lower() == barrio.lower())
            and (categoria is None or row["categoria"].lower() == categoria.lower())
            and (tipo_negocio is None or row["tipo_negocio"].lower() == tipo_negocio.lower())
            and (fecha_recoleccion is None or row["fecha_recoleccion"] == fecha_recoleccion)
        ]

        return {
            "filters": {
                "comuna": comuna,
                "barrio": barrio,
                "categoria": categoria,
                "tipo_negocio": tipo_negocio,
                "fecha_recoleccion": fecha_recoleccion,
                "limit": limit,
            },
            "available": {
                "comunas": comunas,
                "barrios": barrios,
                "categorias": categorias,
                "tipos_negocio": tipos,
                "fechas_recoleccion": fechas,
            },
            "count": len(filtered),
            "data": filtered[:limit],
        }

    def get_negocios_medellin_summary(
        self,
        comuna: Optional[str] = None,
        fecha_recoleccion: Optional[str] = None,
    ) -> Dict[str, Any]:
        rows, comunas, barrios, categorias, tipos, fechas = self._load_negocios_medellin_rows()
        filtered = [
            row for row in rows
            if (comuna is None or row["comuna"] == comuna)
            and (fecha_recoleccion is None or row["fecha_recoleccion"] == fecha_recoleccion)
        ]

        if not filtered:
            return {
                "comuna": comuna,
                "fecha_recoleccion": fecha_recoleccion,
                "available": {
                    "comunas": comunas,
                    "barrios": barrios,
                    "categorias": categorias,
                    "tipos_negocio": tipos,
                    "fechas_recoleccion": fechas,
                },
                "total_registros": 0,
                "total_cantidad": 0,
                "barrios_unicos": 0,
                "categorias_unicas": 0,
                "tipos_unicos": 0,
            }

        return {
            "comuna": comuna,
            "fecha_recoleccion": fecha_recoleccion,
            "available": {
                "comunas": comunas,
                "barrios": barrios,
                "categorias": categorias,
                "tipos_negocio": tipos,
                "fechas_recoleccion": fechas,
            },
            "total_registros": len(filtered),
            "total_cantidad": sum(row["cantidad_actual"] for row in filtered),
            "barrios_unicos": len({row["barrio"] for row in filtered}),
            "categorias_unicas": len({row["categoria"] for row in filtered if row["categoria"]}),
            "tipos_unicos": len({row["tipo_negocio"] for row in filtered if row["tipo_negocio"]}),
        }

    def get_negocios_medellin_top_barrios(
        self,
        comuna: Optional[str] = None,
        fecha_recoleccion: Optional[str] = None,
        limit: int = 10,
    ) -> List[Dict[str, Any]]:
        rows, _, _, _, _, _ = self._load_negocios_medellin_rows()
        filtered = [
            row for row in rows
            if (comuna is None or row["comuna"] == comuna)
            and (fecha_recoleccion is None or row["fecha_recoleccion"] == fecha_recoleccion)
        ]

        grouped: Dict[str, Dict[str, Any]] = {}
        for row in filtered:
            key = f"{row['comuna']}::{row['barrio']}"
            if key not in grouped:
                grouped[key] = {
                    "comuna": row["comuna"],
                    "barrio": row["barrio"],
                    "total_cantidad": 0,
                    "registros": 0,
                }
            grouped[key]["total_cantidad"] += row["cantidad_actual"]
            grouped[key]["registros"] += 1

        ordered = sorted(grouped.values(), key=lambda item: item["total_cantidad"], reverse=True)
        return ordered[:limit]

    def get_negocios_medellin_top_tipos(
        self,
        comuna: Optional[str] = None,
        categoria: Optional[str] = None,
        fecha_recoleccion: Optional[str] = None,
        limit: int = 10,
    ) -> List[Dict[str, Any]]:
        rows, _, _, _, _, _ = self._load_negocios_medellin_rows()
        filtered = [
            row for row in rows
            if (comuna is None or row["comuna"] == comuna)
            and (categoria is None or row["categoria"].lower() == categoria.lower())
            and (fecha_recoleccion is None or row["fecha_recoleccion"] == fecha_recoleccion)
        ]

        grouped: Dict[str, Dict[str, Any]] = {}
        for row in filtered:
            tipo = row["tipo_negocio"] or "N/A"
            if tipo not in grouped:
                grouped[tipo] = {
                    "tipo_negocio": tipo,
                    "total_cantidad": 0,
                    "registros": 0,
                    "categoria": row["categoria"] or "N/A",
                }
            grouped[tipo]["total_cantidad"] += row["cantidad_actual"]
            grouped[tipo]["registros"] += 1

        ordered = sorted(grouped.values(), key=lambda item: item["total_cantidad"], reverse=True)
        return ordered[:limit]

    def get_negocios_medellin_filters(self) -> Dict[str, Any]:
        _, comunas, barrios, categorias, tipos, fechas = self._load_negocios_medellin_rows()
        return {
            "comunas": comunas,
            "barrios": barrios,
            "categorias": categorias,
            "tipos_negocio": tipos,
            "fechas_recoleccion": fechas,
        }
    
    def get_criminalidad_data(self) -> List[Dict[str, Any]]:
        """
        Lee el archivo de criminalidad y devuelve lista de datos.
        
        Returns:
            Lista de diccionarios con data de criminalidad
            
        Raises:
            FileNotFoundError: Si el archivo no existe
            ValueError: Si hay error al parsear el CSV
        """
        csv_path = self.datasets_path / "Criminalidad_por_Comuna_data.csv"
        
        try:
            if not csv_path.exists():
                logger.error(f"Archivo no encontrado: {csv_path}")
                raise FileNotFoundError(f"Dataset no encontrado en {csv_path}")
            
            data = []
            # utf-8-sig elimina BOM, común en CSV exportados desde Excel
            with open(csv_path, 'r', encoding='utf-8-sig') as f:
                # El CSV usa punto y coma como delimitador
                reader = csv.DictReader(f, delimiter=';')
                
                for row in reader:
                    # Soporta variaciones de encabezados del dataset
                    nombre = _pick_first(row, ["Nombre", "NOMBRE", "Comuna"])
                    total_casos_raw = _pick_first(
                        row,
                        ["[TotalCasos]", "([TotalCasos])", "TotalCasos", "TOTAL_CASOS"],
                        "0"
                    )
                    tasa_raw = _pick_first(
                        row,
                        ["TasaCriminalidad", "Tasa Criminalidad", "tasa_criminalidad"],
                        "0"
                    )

                    # Normaliza formatos numéricos: miles con punto y decimales con coma
                    total_casos_clean = total_casos_raw.replace(".", "").replace(",", "")
                    tasa_clean = tasa_raw.replace(".", "").replace(",", ".")

                    processed_row = {
                        "nombre": nombre,
                        "total_casos": int(total_casos_clean or 0),
                        "tasa_criminalidad": float(tasa_clean or 0)
                    }
                    data.append(processed_row)
            
            logger.info(f"Se cargaron {len(data)} registros de criminalidad")
            return data
            
        except FileNotFoundError as e:
            logger.error(f"FileNotFoundError: {e}")
            raise
        except (ValueError, KeyError) as e:
            logger.error(f"Error al procesar CSV: {e}")
            raise ValueError(f"Error al parsear el dataset de criminalidad: {e}")
        except Exception as e:
            logger.error(f"Error inesperado: {e}")
            raise Exception(f"Error al leer dataset: {e}")
    
    def get_criminalidad_summary(self) -> Dict[str, Any]:
        """
        Devuelve resumen estadístico de los datos de criminalidad.
        
        Returns:
            Diccionario con estadísticas agregadas
        """
        try:
            data = self.get_criminalidad_data()
            
            if not data:
                return {
                    "total_comunas": 0,
                    "total_casos": 0,
                    "tasa_promedio": 0,
                    "tasa_maxima": 0,
                    "tasa_minima": 0,
                    "comuna_mas_afectada": None
                }
            
            total_casos = sum(d["total_casos"] for d in data)
            tasas = [d["tasa_criminalidad"] for d in data]
            
            summary = {
                "total_comunas": len(data),
                "total_casos": total_casos,
                "tasa_promedio": round(sum(tasas) / len(tasas), 2),
                "tasa_maxima": max(tasas),
                "tasa_minima": min(tasas),
                "comuna_mas_afectada": max(data, key=lambda x: x["tasa_criminalidad"])["nombre"]
            }
            
            return summary
            
        except Exception as e:
            logger.error(f"Error al calcular summary: {e}")
            raise
