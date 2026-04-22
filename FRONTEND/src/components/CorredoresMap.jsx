import React from 'react';
import { MapContainer, TileLayer, Polyline, Tooltip } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

// Coordenadas aproximadas de los principales corredores de Medellín
const CORREDOR_COORDS = {
  'Avenida Regional': [[6.251, -75.567], [6.220, -75.580], [6.270, -75.590]],
  'Autopista Sur': [[6.220, -75.580], [6.200, -75.550], [6.180, -75.540]],
  'Calle 33': [[6.247, -75.577], [6.238, -75.608]],
  'Avenida 80': [[6.230, -75.610], [6.260, -75.595]],
  'San Juan': [[6.248, -75.565], [6.252, -75.605]],
  'Avenida Oriental': [[6.252, -75.564], [6.242, -75.568]],
  'Avenida El Poblado': [[6.210, -75.570], [6.180, -75.580]],
  'Vía Las Palmas': [[6.215, -75.560], [6.230, -75.540]],
  'Carrera 65': [[6.235, -75.585], [6.280, -75.575]],
  'Avenida Guayabal': [[6.225, -75.585], [6.190, -75.595]],
  'Calle 30': [[6.235, -75.570], [6.230, -75.610]],
  'Avenida Colombia': [[6.255, -75.570], [6.265, -75.600]]
};

const CorredoresMap = ({ data = [] }) => {
  // Filtrar los corredores que tenemos en la lista de coordenadas
  const visibleCorredores = data.map(c => ({
    ...c,
    coords: CORREDOR_COORDS[c.corredor]
  })).filter(c => c.coords);

  return (
    <MapContainer 
      center={[6.2442, -75.5812]} 
      zoom={11.5} 
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
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
      />
      {visibleCorredores.map((c, i) => (
        <Polyline 
          key={i} 
          positions={c.coords} 
          color={c.criticidad > 8 ? '#f43f5e' : (c.criticidad > 5 ? '#f59e0b' : '#10b981')} 
          weight={4} 
          opacity={0.8}
        >
          <Tooltip sticky direction="top">
            <strong>{c.corredor}</strong><br/>
            Índice: {c.criticidad.toFixed(1)}/10
          </Tooltip>
        </Polyline>
      ))}
    </MapContainer>
  );
};

export default CorredoresMap;
