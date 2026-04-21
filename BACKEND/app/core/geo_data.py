# Medellín Geospatial Data
from typing import Optional

COMUNA_COORDINATES = {
    "POPULAR": [6.29, -75.54],
    "SANTA CRUZ": [6.30, -75.55],
    "MANRIQUE": [6.28, -75.55],
    "ARANJUEZ": [6.28, -75.56],
    "CASTILLA": [6.30, -75.57],
    "DOCE DE OCTUBRE": [6.31, -75.58],
    "ROBLEDO": [6.28, -75.59],
    "VILLA HERMOSA": [6.26, -75.54],
    "BUENOS AIRES": [6.24, -75.55],
    "LA CANDELARIA": [6.25, -75.56],
    "LAURELES-ESTADIO": [6.25, -75.59],
    "LA AMERICA": [6.25, -75.60],
    "SAN JAVIER": [6.26, -75.62],
    "EL POBLADO": [6.21, -75.57],
    "GUAYABAL": [6.22, -75.59],
    "BELEN": [6.23, -75.60],
    "PALMITAS": [6.34, -75.69],
    "SAN CRISTOBAL": [6.28, -75.64],
    "ALTAVISTA": [6.22, -75.65],
    "SAN ANTONIO DE PRADO": [6.18, -75.65],
    "SANTA ELENA": [6.21, -75.50]
}

def get_coordinates(area_name: Optional[str]):
    """Returns [lat, lng] for a given commune or corregimiento name."""
    if not area_name or not isinstance(area_name, str):
        return None
        
    name = area_name.upper().strip()
    
    # Direct match
    if name in COMUNA_COORDINATES:
        return COMUNA_COORDINATES[name]
    
    # Partial match (e.g., "LAURELES" matches "LAURELES-ESTADIO")
    for key in COMUNA_COORDINATES:
        if name in key or key in name:
            return COMUNA_COORDINATES[key]
            
    return None
