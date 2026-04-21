import React, { useEffect, useMemo, useState } from 'react';
import { ScatterplotLayer } from '@deck.gl/layers';
import DeckGL from '@deck.gl/react';
import { MapContainer, TileLayer, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import proj4 from 'proj4';
import mobilityService from '@/services/mobilityService';

// 🔥 CONFIGURACIÓN ESTÉTICA (Simulación de Calor)
const getCriticidadColor = (c) => {
  if (c > 80) return [255, 32, 32, 40];   // Rojo (Muy Alto)
  if (c > 60) return [255, 126, 32, 35];  // Naranja (Alto)
  if (c > 40) return [245, 200, 60, 30];  // Amarillo (Medio)
  if (c > 20) return [46, 196, 128, 25];  // Verde (Bajo)
  return [46, 196, 128, 15];              // Verde tenue (Muy Bajo)
};

// 🔥 VISTA INICIAL
const INITIAL_VIEW = {
  lat: 6.2442,
  lng: -75.5812,
  zoom: 13,
};

// 🔁 PROYECCIÓN
const MAGNA_SIRGAS_ORIGEN_BOGOTA = 'EPSG:3116';
const WGS84 = 'EPSG:4326';

proj4.defs(
  MAGNA_SIRGAS_ORIGEN_BOGOTA,
  '+proj=tmerc +lat_0=4.59620041666667 +lon_0=-74.0775079166667 +k=1 +x_0=1000000 +y_0=1000000 +datum=WGS84 +units=m +no_defs'
);

const toWgs84 = (x, y) => {
  if (!Number.isFinite(x) || !Number.isFinite(y)) return null;
  if (x >= -180 && x <= 180 && y >= -90 && y <= 90) return { lng: x, lat: y };
  try {
    const [lng, lat] = proj4(MAGNA_SIRGAS_ORIGEN_BOGOTA, WGS84, [x, y]);
    return { lng, lat };
  } catch { return null; }
};

// 🔄 COMPONENTE DE SINCRONIZACIÓN
const SyncDeck = ({ setViewState }) => {
  const map = useMap();
  useEffect(() => {
    const onMove = () => {
      const center = map.getCenter();
      setViewState({
        longitude: center.lng,
        latitude: center.lat,
        zoom: map.getZoom() - 1,
        pitch: 0,
        bearing: 0,
      });
    };
    map.on('move', onMove);
    map.on('zoom', onMove);
    onMove();
    return () => {
      map.off('move', onMove);
      map.off('zoom', onMove);
    };
  }, [map, setViewState]);
  return null;
};

const MobilityMap = ({ filterType, peakHour }) => {
  const [geoData, setGeoData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewState, setViewState] = useState({
    longitude: INITIAL_VIEW.lng,
    latitude: INITIAL_VIEW.lat,
    zoom: INITIAL_VIEW.zoom - 1,
    pitch: 0,
    bearing: 0,
  });

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const rows = await mobilityService.getMobilityGeoData();
        const normalized = (rows || []).map((r) => {
            const coords = toWgs84(Number(r.longitud), Number(r.latitud));
            if (!coords) return null;
            return { ...r, position: [coords.lng, coords.lat], criticidadVal: Number(r.criticidad) || 0 };
          }).filter(Boolean);
        setGeoData(normalized);
      } catch (err) {
        console.error('Error cargando datos:', err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const filtered = useMemo(() => {
    if (filterType === 'hour' && peakHour !== undefined) {
      return geoData.filter((d) => d.hora === peakHour);
    }
    return geoData;
  }, [geoData, filterType, peakHour]);

  const layers = useMemo(() => [
    // Capa de Resplandor (Simula Heatmap)
    new ScatterplotLayer({
      id: 'glow-layer',
      data: filtered,
      getPosition: (d) => d.position,
      getFillColor: (d) => getCriticidadColor(d.criticidadVal),
      getRadius: 180, // Radio grande para solapamiento
      radiusMinPixels: 15,
      radiusMaxPixels: 60,
      opacity: 0.6,
      stroked: false,
    }),
    // Capa de Núcleo (Puntos centrales)
    new ScatterplotLayer({
      id: 'core-layer',
      data: filtered,
      getPosition: (d) => d.position,
      getFillColor: (d) => {
        const base = getCriticidadColor(d.criticidadVal);
        return [base[0], base[1], base[2], 180]; // Más opaco en el centro
      },
      getRadius: 30,
      radiusMinPixels: 3,
      radiusMaxPixels: 10,
      stroked: true,
      lineWidthMinPixels: 1,
      getLineColor: [255, 255, 255, 80],
    })
  ], [filtered]);

  return (
    <div style={{ height: '550px', borderRadius: '24px', overflow: 'hidden', position: 'relative', background: '#050810', border: '1px solid rgba(255,255,255,0.1)' }}>
      
      {/* 🗺️ MAPA BASE */}
      <MapContainer 
        center={[INITIAL_VIEW.lat, INITIAL_VIEW.lng]} 
        zoom={INITIAL_VIEW.zoom} 
        style={{ height: '100%', width: '100%', zIndex: 0 }}
      >
        <TileLayer
          attribution='&copy; CARTO'
          url="https://basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        />
        <SyncDeck setViewState={setViewState} />
      </MapContainer>

      {/* 🚀 DECK.GL HEATMAP */}
      <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 10 }}>
        <DeckGL
          viewState={viewState}
          layers={layers}
          style={{ pointerEvents: 'auto' }}
        />
      </div>

      {/* 📊 LEYENDA (Igual a la imagen) */}
      <div style={{ 
        position: 'absolute', bottom: '25px', left: '25px', zIndex: 30,
        background: 'rgba(10, 18, 38, 0.85)', padding: '18px', borderRadius: '16px',
        border: '1px solid rgba(255,255,255,0.12)', backdropFilter: 'blur(10px)',
        minWidth: '180px'
      }}>
        <div style={{ fontSize: '12px', fontWeight: 700, color: 'white', marginBottom: '12px', display: 'flex', justifyContent: 'space-between' }}>
          Índice de Criticidad <span style={{opacity: 0.5}}>📈</span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {[
            { label: 'Muy Alto (80 - 100)', color: '#b40000' },
            { label: 'Alto (60 - 80)', color: '#ff2020' },
            { label: 'Medio (40 - 60)', color: '#ff7e20' },
            { label: 'Bajo (20 - 40)', color: '#f5c83c' },
            { label: 'Muy Bajo (0 - 20)', color: '#2ec480' },
          ].map((item, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ width: '12px', height: '12px', borderRadius: '3px', background: item.color }} />
              <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.8)' }}>{item.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ⏳ LOADING */}
      {loading && (
        <div style={{ position: 'absolute', top: 10, left: 10, zIndex: 20, color: 'white', background: 'rgba(0,0,0,0.5)', padding: '5px 10px', borderRadius: '5px' }}>
          Cargando datos...
        </div>
      )}

      {/* 🚨 SIN DATOS */}
      {!loading && filtered.length === 0 && (
        <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', zIndex: 20, color: 'white', background: 'rgba(0,0,0,0.5)', padding: '10px 20px', borderRadius: '10px' }}>
          No hay datos para mostrar ⚠️
        </div>
      )}
    </div>
  );
};

export default MobilityMap;