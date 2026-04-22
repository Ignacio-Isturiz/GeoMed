import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, GeoJSON, Tooltip } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

const GEOJSON_URL = 'https://serviciosgiscnmh.centrodememoriahistorica.gov.co/agccnmh/rest/services/DCMH/Medellinguerraurbana/FeatureServer/0/query?where=1%3D1&outFields=*&f=geojson';

// Normalización de nombres para matching
const norm = (str) =>
  str ? str.toUpperCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[-_]/g, ' ').trim() : '';

const HeatmapComunas = ({ data = [] }) => {
  const [geoData, setGeoData] = useState(null);

  useEffect(() => {
    fetch(GEOJSON_URL)
      .then(r => r.json())
      .then(json => setGeoData(json))
      .catch(err => console.error('Error cargando GeoJSON:', err));
  }, []);

  const maxIntensidad = Math.max(...data.map(c => c.intensidad || 1), 1);

  const getStyle = (feature) => {
    const nombreGeo = feature.properties.Nombre_Comuna || '';
    const normGeo = norm(nombreGeo);
    
    // Buscar match en la data de presión
    const match = data.find(c => {
      const normData = norm(c.nombre_comuna);
      return normData === normGeo || normData.includes(normGeo) || normGeo.includes(normData);
    });

    if (!match) {
      return {
        fillColor: '#334155',
        fillOpacity: 0.3,
        color: '#475569',
        weight: 1
      };
    }

    const ratio = match.intensidad / maxIntensidad;
    // Escala de color: de verde suave a rojo intenso
    const color = ratio > 0.8 ? '#f43f5e' : (ratio > 0.5 ? '#f59e0b' : '#10b981');

    return {
      fillColor: color,
      fillOpacity: 0.4 + (ratio * 0.4),
      color: '#fff',
      weight: 1.5,
    };
  };

  return (
    <MapContainer 
      center={[6.2442, -75.5812]} 
      zoom={11} 
      minZoom={10}
      maxZoom={15}
      style={{ height: '100%', width: '100%' }} 
      scrollWheelZoom={true} 
      dragging={true} 
      doubleClickZoom={true}
      zoomControl={true} 
      attributionControl={false}
    >
      <TileLayer
        url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        attribution='&copy; CARTO'
      />
      {geoData && (
        <GeoJSON 
          data={geoData} 
          style={getStyle}
          onEachFeature={(feature, layer) => {
            const nombreGeo = feature.properties.Nombre_Comuna || '';
            const match = data.find(c => {
              const normData = norm(c.nombre_comuna);
              const normGeo = norm(nombreGeo);
              return normData === normGeo || normData.includes(normGeo) || normGeo.includes(normData);
            });

            if (match) {
              layer.bindTooltip(`
                <strong>${nombreGeo}</strong><br/>
                Intensidad: ${Math.round(match.intensidad).toLocaleString()} vehículos<br/>
                Criticidad: ${match.criticidad?.toFixed(2) || 'N/A'}
              `, { sticky: true });
            }
          }}
        />
      )}
    </MapContainer>
  );
};

export default HeatmapComunas;
