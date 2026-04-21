"""
Rutas (endpoints) de datasets
Capa de presentación: se encarga de validar entrada/salida HTTP
"""
from fastapi import APIRouter, HTTPException, Query, status
import logging

from app.services.datasets import DatasetsService

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/datasets", tags=["datasets"])


@router.get(
    "/criminalidad",
    status_code=status.HTTP_200_OK,
    summary="Obtener datos de criminalidad",
    description="Devuelve todos los datos de criminalidad por comuna"
)
async def get_criminalidad_data():
    """
    Obtiene los datos de criminalidad de todas las comunas.
    
    Returns:
        Lista de datos con estructura:
        - nombre: Nombre de la comuna
        - total_casos: Total de casos registrados
        - tasa_criminalidad: Tasa de criminalidad
    """
    try:
        service = DatasetsService()
        data = service.get_criminalidad_data()
        
        return {
            "success": True,
            "data": data,
            "count": len(data)
        }
    except FileNotFoundError as e:
        logger.error(f"Dataset no encontrado: {e}")
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Dataset de criminalidad no encontrado"
        )
    except ValueError as e:
        logger.error(f"Error en formato de datos: {e}")
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Error al procesar el dataset"
        )
    except Exception as e:
        logger.error(f"Error inesperado: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error al obtener datos de criminalidad"
        )


@router.get(
    "/criminalidad/resumen",
    status_code=status.HTTP_200_OK,
    summary="Obtener resumen de criminalidad",
    description="Devuelve estadísticas agregadas de criminalidad"
)
async def get_criminalidad_summary():
    """
    Obtiene un resumen estadístico de los datos de criminalidad.
    
    Returns:
        Diccionario con estadísticas:
        - total_comunas: Cantidad de comunas
        - total_casos: Total de casos registrados
        - tasa_promedio: Promedio de tasa de criminalidad
        - tasa_maxima: Máxima tasa de criminalidad
        - tasa_minima: Mínima tasa de criminalidad
        - comuna_mas_afectada: Comuna con más criminalidad
    """
    try:
        service = DatasetsService()
        summary = service.get_criminalidad_summary()
        
        return {
            "success": True,
            "data": summary
        }
    except FileNotFoundError as e:
        logger.error(f"Dataset no encontrado: {e}")
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Dataset de criminalidad no encontrado"
        )
    except Exception as e:
        logger.error(f"Error inesperado: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error al obtener resumen de criminalidad"
        )


@router.get(
    "/empresarial/years",
    status_code=status.HTTP_200_OK,
    summary="Obtener años disponibles del dataset empresarial"
)
async def get_empresarial_years():
    try:
        service = DatasetsService()
        years = service.get_empresarial_years()
        return {"success": True, "data": years}
    except FileNotFoundError as e:
        logger.error(f"Dataset no encontrado: {e}")
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Dataset empresarial no encontrado"
        )
    except Exception as e:
        logger.error(f"Error inesperado: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error al obtener años del dataset empresarial"
        )


@router.get(
    "/empresarial/resumen",
    status_code=status.HTTP_200_OK,
    summary="Obtener resumen del dataset empresarial"
)
async def get_empresarial_summary(
    year: int | None = Query(default=None, description="Año de filtro")
):
    try:
        service = DatasetsService()
        summary = service.get_empresarial_summary(year=year)
        return {"success": True, "data": summary}
    except FileNotFoundError as e:
        logger.error(f"Dataset no encontrado: {e}")
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Dataset empresarial no encontrado"
        )
    except Exception as e:
        logger.error(f"Error inesperado: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error al obtener resumen empresarial"
        )


@router.get(
    "/empresarial/top-actividades",
    status_code=status.HTTP_200_OK,
    summary="Obtener top de actividades empresariales"
)
async def get_empresarial_top_actividades(
    year: int | None = Query(default=None, description="Año de filtro"),
    limit: int = Query(default=5, ge=1, le=20, description="Cantidad de resultados")
):
    try:
        service = DatasetsService()
        data = service.get_empresarial_top_actividades(year=year, limit=limit)
        return {"success": True, "data": data, "count": len(data)}
    except FileNotFoundError as e:
        logger.error(f"Dataset no encontrado: {e}")
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Dataset empresarial no encontrado"
        )
    except Exception as e:
        logger.error(f"Error inesperado: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error al obtener top de actividades"
        )


@router.get(
    "/empresarial/top-comunas",
    status_code=status.HTTP_200_OK,
    summary="Obtener top de comunas por empresas"
)
async def get_empresarial_top_comunas(
    year: int | None = Query(default=None, description="Año de filtro"),
    limit: int = Query(default=5, ge=1, le=20, description="Cantidad de resultados")
):
    try:
        service = DatasetsService()
        data = service.get_empresarial_top_comunas(year=year, limit=limit)
        return {"success": True, "data": data, "count": len(data)}
    except FileNotFoundError as e:
        logger.error(f"Dataset no encontrado: {e}")
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Dataset empresarial no encontrado"
        )
    except Exception as e:
        logger.error(f"Error inesperado: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error al obtener top de comunas"
        )


@router.get(
    "/emprendedor/overview",
    status_code=status.HTTP_200_OK,
    summary="Obtener overview unificado para dashboard de emprendedor"
)
async def get_emprendedor_overview(
    year: int | None = Query(default=None, description="Año de filtro"),
    limit: int = Query(default=5, ge=1, le=20, description="Cantidad de resultados")
):
    try:
        service = DatasetsService()
        data = service.get_emprendedor_overview(year=year, limit=limit)
        return {"success": True, "data": data}
    except FileNotFoundError as e:
        logger.error(f"Dataset no encontrado: {e}")
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Dataset empresarial no encontrado"
        )
    except Exception as e:
        logger.error(f"Error inesperado: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error al obtener overview de emprendedor"
        )


@router.get(
    "/estratificacion-cobertura",
    status_code=status.HTTP_200_OK,
    summary="Obtener datos de estratificacion y cobertura"
)
async def get_estratificacion_data(
    servicio: str | None = Query(default=None, description="Filtro por servicio"),
    estrato: int | None = Query(default=None, description="Filtro por estrato"),
    periodo: str | None = Query(default=None, description="Filtro por periodo"),
    limit: int = Query(default=200, ge=1, le=1000, description="Maximo de filas"),
):
    try:
        service = DatasetsService()
        data = service.get_estratificacion_data(
            servicio=servicio,
            estrato=estrato,
            periodo=periodo,
            limit=limit,
        )
        return {"success": True, "data": data}
    except FileNotFoundError as e:
        logger.error(f"Dataset no encontrado: {e}")
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Dataset de estratificacion y cobertura no encontrado"
        )
    except Exception as e:
        logger.error(f"Error inesperado: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error al obtener datos de estratificacion y cobertura"
        )


@router.get(
    "/estratificacion-cobertura/resumen",
    status_code=status.HTTP_200_OK,
    summary="Obtener resumen de estratificacion y cobertura"
)
async def get_estratificacion_summary(
    periodo: str | None = Query(default=None, description="Filtro por periodo"),
):
    try:
        service = DatasetsService()
        summary = service.get_estratificacion_summary(periodo=periodo)
        return {"success": True, "data": summary}
    except FileNotFoundError as e:
        logger.error(f"Dataset no encontrado: {e}")
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Dataset de estratificacion y cobertura no encontrado"
        )
    except Exception as e:
        logger.error(f"Error inesperado: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error al obtener resumen de estratificacion y cobertura"
        )


@router.get(
    "/estratificacion-cobertura/por-servicio",
    status_code=status.HTTP_200_OK,
    summary="Obtener agregacion por servicio"
)
async def get_estratificacion_por_servicio(
    periodo: str | None = Query(default=None, description="Filtro por periodo"),
):
    try:
        service = DatasetsService()
        data = service.get_estratificacion_por_servicio(periodo=periodo)
        return {"success": True, "data": data, "count": len(data)}
    except FileNotFoundError as e:
        logger.error(f"Dataset no encontrado: {e}")
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Dataset de estratificacion y cobertura no encontrado"
        )
    except Exception as e:
        logger.error(f"Error inesperado: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error al obtener agregacion por servicio"
        )


@router.get(
    "/estratificacion-cobertura/por-estrato",
    status_code=status.HTTP_200_OK,
    summary="Obtener agregacion por estrato"
)
async def get_estratificacion_por_estrato(
    periodo: str | None = Query(default=None, description="Filtro por periodo"),
):
    try:
        service = DatasetsService()
        data = service.get_estratificacion_por_estrato(periodo=periodo)
        return {"success": True, "data": data, "count": len(data)}
    except FileNotFoundError as e:
        logger.error(f"Dataset no encontrado: {e}")
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Dataset de estratificacion y cobertura no encontrado"
        )
    except Exception as e:
        logger.error(f"Error inesperado: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error al obtener agregacion por estrato"
        )


@router.get(
    "/estratificacion-cobertura/top-cobertura",
    status_code=status.HTTP_200_OK,
    summary="Obtener top de coberturas"
)
async def get_estratificacion_top_cobertura(
    periodo: str | None = Query(default=None, description="Filtro por periodo"),
    limit: int = Query(default=5, ge=1, le=20, description="Cantidad de resultados"),
):
    try:
        service = DatasetsService()
        data = service.get_estratificacion_top_cobertura(periodo=periodo, limit=limit)
        return {"success": True, "data": data, "count": len(data)}
    except FileNotFoundError as e:
        logger.error(f"Dataset no encontrado: {e}")
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Dataset de estratificacion y cobertura no encontrado"
        )
    except Exception as e:
        logger.error(f"Error inesperado: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error al obtener top de coberturas"
        )


@router.get(
    "/tarifas/{dataset}",
    status_code=status.HTTP_200_OK,
    summary="Obtener datos de tarifas EPM"
)
async def get_tarifas_data(
    dataset: str,
    year: int | None = Query(default=None, description="Filtro por anio"),
    mes: str | None = Query(default=None, description="Filtro por mes"),
    limit: int = Query(default=300, ge=1, le=1000, description="Maximo de filas"),
):
    try:
        service = DatasetsService()
        data = service.get_tarifas_data(dataset=dataset, year=year, mes=mes, limit=limit)
        return {"success": True, "data": data}
    except FileNotFoundError as e:
        logger.error(f"Dataset no encontrado: {e}")
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Dataset de tarifas no encontrado")
    except ValueError as e:
        logger.error(f"Dataset invalido: {e}")
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except Exception as e:
        logger.error(f"Error inesperado: {e}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Error al obtener tarifas")


@router.get(
    "/tarifas/{dataset}/resumen",
    status_code=status.HTTP_200_OK,
    summary="Obtener resumen de tarifas EPM"
)
async def get_tarifas_summary(
    dataset: str,
    year: int | None = Query(default=None, description="Filtro por anio"),
):
    try:
        service = DatasetsService()
        data = service.get_tarifas_summary(dataset=dataset, year=year)
        return {"success": True, "data": data}
    except FileNotFoundError as e:
        logger.error(f"Dataset no encontrado: {e}")
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Dataset de tarifas no encontrado")
    except ValueError as e:
        logger.error(f"Dataset invalido: {e}")
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except Exception as e:
        logger.error(f"Error inesperado: {e}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Error al obtener resumen de tarifas")


@router.get(
    "/tarifas/{dataset}/por-estrato",
    status_code=status.HTTP_200_OK,
    summary="Obtener tarifas promedio por estrato"
)
async def get_tarifas_por_estrato(
    dataset: str,
    year: int | None = Query(default=None, description="Filtro por anio"),
):
    try:
        service = DatasetsService()
        data = service.get_tarifas_por_estrato(dataset=dataset, year=year)
        return {"success": True, "data": data, "count": len(data)}
    except FileNotFoundError as e:
        logger.error(f"Dataset no encontrado: {e}")
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Dataset de tarifas no encontrado")
    except ValueError as e:
        logger.error(f"Dataset invalido: {e}")
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except Exception as e:
        logger.error(f"Error inesperado: {e}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Error al obtener tarifas por estrato")


@router.get(
    "/tarifas/{dataset}/tendencia",
    status_code=status.HTTP_200_OK,
    summary="Obtener tendencia mensual de tarifas"
)
async def get_tarifas_tendencia(
    dataset: str,
    year: int | None = Query(default=None, description="Filtro por anio"),
    limit: int = Query(default=24, ge=1, le=60, description="Cantidad de periodos"),
):
    try:
        service = DatasetsService()
        data = service.get_tarifas_tendencia(dataset=dataset, year=year, limit=limit)
        return {"success": True, "data": data, "count": len(data)}
    except FileNotFoundError as e:
        logger.error(f"Dataset no encontrado: {e}")
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Dataset de tarifas no encontrado")
    except ValueError as e:
        logger.error(f"Dataset invalido: {e}")
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except Exception as e:
        logger.error(f"Error inesperado: {e}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Error al obtener tendencia de tarifas")


@router.get(
    "/negocios-medellin",
    status_code=status.HTTP_200_OK,
    summary="Obtener datos de negocios medellin"
)
async def get_negocios_medellin_data(
    comuna: str | None = Query(default=None, description="Filtro por comuna"),
    barrio: str | None = Query(default=None, description="Filtro por barrio"),
    categoria: str | None = Query(default=None, description="Filtro por categoria"),
    tipo_negocio: str | None = Query(default=None, description="Filtro por tipo de negocio"),
    fecha_recoleccion: str | None = Query(default=None, description="Filtro por fecha de recoleccion"),
    limit: int = Query(default=200, ge=1, le=1000, description="Maximo de filas"),
):
    try:
        service = DatasetsService()
        data = service.get_negocios_medellin_data(
            comuna=comuna,
            barrio=barrio,
            categoria=categoria,
            tipo_negocio=tipo_negocio,
            fecha_recoleccion=fecha_recoleccion,
            limit=limit,
        )
        return {"success": True, "data": data}
    except FileNotFoundError as e:
        logger.error(f"Dataset no encontrado: {e}")
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Dataset de negocios medellin no encontrado")
    except Exception as e:
        logger.error(f"Error inesperado: {e}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Error al obtener datos de negocios medellin")


@router.get(
    "/negocios-medellin/resumen",
    status_code=status.HTTP_200_OK,
    summary="Obtener resumen de negocios medellin"
)
async def get_negocios_medellin_summary(
    comuna: str | None = Query(default=None, description="Filtro por comuna"),
    fecha_recoleccion: str | None = Query(default=None, description="Filtro por fecha de recoleccion"),
):
    try:
        service = DatasetsService()
        data = service.get_negocios_medellin_summary(comuna=comuna, fecha_recoleccion=fecha_recoleccion)
        return {"success": True, "data": data}
    except FileNotFoundError as e:
        logger.error(f"Dataset no encontrado: {e}")
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Dataset de negocios medellin no encontrado")
    except Exception as e:
        logger.error(f"Error inesperado: {e}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Error al obtener resumen de negocios medellin")


@router.get(
    "/negocios-medellin/filtros",
    status_code=status.HTTP_200_OK,
    summary="Obtener filtros disponibles para negocios medellin"
)
async def get_negocios_medellin_filters():
    try:
        service = DatasetsService()
        data = service.get_negocios_medellin_filters()
        return {"success": True, "data": data}
    except FileNotFoundError as e:
        logger.error(f"Dataset no encontrado: {e}")
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Dataset de negocios medellin no encontrado")
    except Exception as e:
        logger.error(f"Error inesperado: {e}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Error al obtener filtros de negocios medellin")


@router.get(
    "/negocios-medellin/top-barrios",
    status_code=status.HTTP_200_OK,
    summary="Obtener top barrios por cantidad de negocios"
)
async def get_negocios_medellin_top_barrios(
    comuna: str | None = Query(default=None, description="Filtro por comuna"),
    fecha_recoleccion: str | None = Query(default=None, description="Filtro por fecha de recoleccion"),
    limit: int = Query(default=10, ge=1, le=50, description="Cantidad de resultados"),
):
    try:
        service = DatasetsService()
        data = service.get_negocios_medellin_top_barrios(
            comuna=comuna,
            fecha_recoleccion=fecha_recoleccion,
            limit=limit,
        )
        return {"success": True, "data": data, "count": len(data)}
    except FileNotFoundError as e:
        logger.error(f"Dataset no encontrado: {e}")
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Dataset de negocios medellin no encontrado")
    except Exception as e:
        logger.error(f"Error inesperado: {e}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Error al obtener top barrios")


@router.get(
    "/negocios-medellin/top-tipos",
    status_code=status.HTTP_200_OK,
    summary="Obtener top tipos de negocio"
)
async def get_negocios_medellin_top_tipos(
    comuna: str | None = Query(default=None, description="Filtro por comuna"),
    categoria: str | None = Query(default=None, description="Filtro por categoria"),
    fecha_recoleccion: str | None = Query(default=None, description="Filtro por fecha de recoleccion"),
    limit: int = Query(default=10, ge=1, le=50, description="Cantidad de resultados"),
):
    try:
        service = DatasetsService()
        data = service.get_negocios_medellin_top_tipos(
            comuna=comuna,
            categoria=categoria,
            fecha_recoleccion=fecha_recoleccion,
            limit=limit,
        )
        return {"success": True, "data": data, "count": len(data)}
    except FileNotFoundError as e:
        logger.error(f"Dataset no encontrado: {e}")
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Dataset de negocios medellin no encontrado")
    except Exception as e:
        logger.error(f"Error inesperado: {e}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Error al obtener top tipos de negocio")
