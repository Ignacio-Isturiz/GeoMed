  import React, { useEffect, useMemo, useState, useRef } from 'react';
  import { ScatterplotLayer, PathLayer, ColumnLayer } from '@deck.gl/layers';
  import DeckGL from '@deck.gl/react';
  import { MapContainer, TileLayer, useMap } from 'react-leaflet';
  import 'leaflet/dist/leaflet.css';
  import proj4 from 'proj4';
  import mobilityService from '@/services/mobilityService';

  // 🚦 COLOR POR VELOCIDAD — Rojo=lento, Verde=rápido
  const getVelColor = (vel) => {
    if (vel <= 15) return [220, 30, 30];     // Rojo intenso
    if (vel <= 25) return [255, 100, 30];    // Naranja-rojo
    if (vel <= 35) return [255, 190, 40];    // Amarillo
    if (vel <= 45) return [160, 220, 80];    // Verde-amarillo
    return [40, 200, 160];                    // Verde/Cyan
  };

  const getVelLabel = (vel) => {
    if (vel <= 15) return 'Congestión severa';
    if (vel <= 25) return 'Congestión';
    if (vel <= 35) return 'Tráfico moderado';
    if (vel <= 45) return 'Flujo aceptable';
    return 'Flujo libre';
  };

  const INITIAL_VIEW = { lat: 6.2442, lng: -75.5812, zoom: 13 };

  const MAGNA_SIRGAS_ORIGEN_BOGOTA = 'EPSG:3116';
  const WGS84 = 'EPSG:4326';
  proj4.defs(MAGNA_SIRGAS_ORIGEN_BOGOTA,
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

  // Sincronización Leaflet -> Deck.gl (Maestro: Leaflet)
  const SyncMap = ({ setViewState, deckRef, setHoverInfo }) => {
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

      const onMouseMove = (e) => {
        if (deckRef.current) {
          // Obtener objeto bajo el cursor de forma manual
          const { x, y } = e.containerPoint;
          const picked = deckRef.current.pickObject({ x, y, radius: 10 });
          if (picked && picked.object) {
            setHoverInfo({
              x: e.originalEvent.clientX,
              y: e.originalEvent.clientY,
              object: picked.object
            });
          } else {
            setHoverInfo(null);
          }
        }
      };

      map.on('move', onMove);
      map.on('zoom', onMove);
      map.on('mousemove', onMouseMove);
      onMove();
      
      return () => {
        map.off('move', onMove);
        map.off('zoom', onMove);
        map.off('mousemove', onMouseMove);
      };
    }, [map, setViewState, deckRef, setHoverInfo]);

    return null;
  };

  // ── ESTILOS PARA BOTONES ──
  const timeBtn = (active) => ({
    padding: '6px 12px', fontSize: '10px', borderRadius: '6px',
    border: active ? 'none' : '1px solid rgba(0,0,0,0.15)',
    cursor: 'pointer', fontWeight: 600, transition: 'all 0.2s',
    background: active ? '#0d9488' : 'white',
    color: active ? 'white' : '#333',
    boxShadow: active ? '0 2px 8px rgba(13,148,136,0.4)' : '0 1px 3px rgba(0,0,0,0.1)',
  });

  const MobilityMap = ({ filterType, peakHour }) => {
    const [rawPoints, setRawPoints] = useState([]);
    const [corridors, setCorridors] = useState([]);
    const [loading, setLoading] = useState(true);
    const [timeFilter, setTimeFilter] = useState('all'); // 'all', 'am', 'pm', 'night'
    const [viewState, setViewState] = useState({
      longitude: INITIAL_VIEW.lng,
      latitude: INITIAL_VIEW.lat,
      zoom: INITIAL_VIEW.zoom - 1,
      pitch: 0,
      bearing: 0,
    });
    const [showCiclorrutas, setShowCiclorrutas] = useState(false);
    const [ciclorrutaNames, setCiclorrutaNames] = useState([]);
    const [hoverInfo, setHoverInfo] = useState(null);
    const deckRef = useRef(null);

    useEffect(() => {
      const load = async () => {
        try {
          setLoading(true);
          const rows = await mobilityService.getMobilityGeoData();

          const points = [];
          const corridorMap = {};

          (rows || []).forEach((r) => {
            const coords = toWgs84(Number(r.longitud), Number(r.latitud));
            if (!coords) return;

            const vel = Number(r.velocidad_km_h) || 0;
            const intensidad = Number(r.intensidad) || 0;
            const hora = Number(r.hora) || 0;
            const corredor = r.corredor || 'Desconocido';
            const comuna = r.nombre_comuna || 'N/A';

            points.push({
              position: [coords.lng, coords.lat],
              vel, intensidad, hora, corredor, comuna,
            });

            if (!corridorMap[corredor]) corridorMap[corredor] = [];
            corridorMap[corredor].push({
              position: [coords.lng, coords.lat], vel, hora, corredor, comuna, intensidad,
            });
          });

          // Construir líneas por corredor
          const lines = Object.entries(corridorMap).map(([corredor, pts]) => {
            const sorted = pts.sort((a, b) =>
              Math.hypot(a.position[0], a.position[1]) - Math.hypot(b.position[0], b.position[1])
            );
            const avgVel = pts.reduce((s, p) => s + p.vel, 0) / pts.length;
            const avgIntensidad = pts.reduce((s, p) => s + p.intensidad, 0) / pts.length;
            const avgHora = Math.round(pts.reduce((s, p) => s + p.hora, 0) / pts.length);
            return {
              path: sorted.map(p => p.position),
              vel: avgVel, intensidad: avgIntensidad, hora: avgHora,
              corredor, comuna: pts[0]?.comuna || 'N/A',
              velCategory: getVelLabel(avgVel),
            };
          });

          setRawPoints(points);
          setCorridors(lines);
        } catch (err) {
          console.error('Error cargando datos:', err);
        } finally {
          setLoading(false);
        }
      };
      load();
    }, []);

    useEffect(() => {
      const loadCiclos = async () => {
        try {
          const data = await mobilityService.getCiclorrutas();
          setCiclorrutaNames(data.map(d => d.nombre.toLowerCase()));
        } catch (err) {
          console.error("Error cargando ciclorrutas:", err);
        }
      };
      loadCiclos();
    }, []);

    // Filtrar por hora
    const filteredPoints = useMemo(() => {
      if (timeFilter === 'none') return [];
      let pts = rawPoints;
      if (filterType === 'hour' && peakHour !== undefined) {
        pts = pts.filter(d => d.hora === peakHour);
      }
      if (timeFilter === 'am') pts = pts.filter(d => d.hora >= 6 && d.hora <= 9);
      else if (timeFilter === 'pm') pts = pts.filter(d => d.hora >= 16 && d.hora <= 19);
      else if (timeFilter === 'night') pts = pts.filter(d => d.hora >= 20 || d.hora <= 5);
      return pts;
    }, [rawPoints, filterType, peakHour, timeFilter]);

    const filteredCorridors = useMemo(() => {
      if (timeFilter === 'none') return [];
      let lines = corridors;
      if (filterType === 'hour' && peakHour !== undefined) {
        lines = lines.filter(d => d.hora === peakHour);
      }
      if (timeFilter === 'am') lines = lines.filter(d => d.hora >= 6 && d.hora <= 9);
      else if (timeFilter === 'pm') lines = lines.filter(d => d.hora >= 16 && d.hora <= 19);
      else if (timeFilter === 'night') lines = lines.filter(d => d.hora >= 20 || d.hora <= 5);
      return lines;
    }, [corridors, filterType, peakHour, timeFilter]);

    const layers = useMemo(() => {
      const maxIntensidad = Math.max(...filteredPoints.map(d => d.intensidad), 1);

      return [
        // ── ZONA DE CONGESTIÓN (zonas rosa/magenta como en la imagen) ──
        new ScatterplotLayer({
          id: 'congestion-zones',
          data: filteredPoints.filter(d => d.vel <= 25),
          getPosition: d => d.position,
          getFillColor: [180, 50, 100, 25],
          getRadius: 500,
          radiusMinPixels: 30,
          radiusMaxPixels: 80,
          opacity: 0.5,
          stroked: false,
        }),

        // ── LÍNEAS DE CORREDOR (tipo ciclorutas - cyan/turquesa) ──
        new PathLayer({
          id: 'corridor-lines',
          data: filteredCorridors,
          getPath: d => d.path,
          getColor: d => {
            const c = getVelColor(d.vel);
            return [...c, 60];
          },
          getWidth: 6,
          widthMinPixels: 2,
          widthMaxPixels: 8,
          opacity: 0.5,
          capRounded: true,
          jointRounded: true,
        }),

        // ── BARRAS / COLUMNAS (simulación 3D con ScatterplotLayer) ──
        // Capa de resplandor (simula la base de la columna)
        new ScatterplotLayer({
          id: 'column-glow',
          data: filteredPoints,
          getPosition: d => d.position,
          getFillColor: d => [...getVelColor(d.vel), 40],
          getRadius: d => 80 + (d.intensidad / maxIntensidad) * 250,
          radiusMinPixels: 8,
          radiusMaxPixels: 35,
          opacity: 0.6,
          stroked: false,
        }),

        // Capa de núcleo (punto central sólido - la "columna" vista desde arriba)
        new ScatterplotLayer({
          id: 'column-core',
          data: filteredPoints,
          getPosition: d => d.position,
          getFillColor: d => [...getVelColor(d.vel), 230],
          getRadius: d => 20 + (d.intensidad / maxIntensidad) * 80,
          radiusMinPixels: 3,
          radiusMaxPixels: 14,
          opacity: 0.9,
          stroked: true,
          lineWidthMinPixels: 1,
          getLineColor: [255, 255, 255, 60],
          pickable: true,
        }),

        // â”€â”€ CAPA DE CICLORRUTAS (Fluorescent Cyan) â”€â”€
        showCiclorrutas && new PathLayer({
          id: 'ciclorrutas-layer',
          data: corridors.filter(c => {
            const name = c.corredor.toLowerCase();
            return ciclorrutaNames.some(cn => name.includes(cn) || cn.includes(name));
          }),
          getPath: d => d.path,
          getColor: [0, 212, 212], // Cyan fluorescente
          getWidth: 12,
          widthMinPixels: 3,
          widthMaxPixels: 15,
          pickable: true,
          capRounded: true,
          jointRounded: true,
        }),
      ].filter(Boolean);
    }, [filteredPoints, filteredCorridors, showCiclorrutas, ciclorrutaNames, corridors]);

    return (
      <div style={{ height: '600px', borderRadius: '20px', overflow: 'hidden', position: 'relative', background: '#0a1628' }}>
        
        {/* MAPA BASE — Imagen Satelital */}
        <MapContainer 
          center={[INITIAL_VIEW.lat, INITIAL_VIEW.lng]} 
          zoom={INITIAL_VIEW.zoom} 
          scrollWheelZoom={true}
          dragging={true}
          zoomControl={true}
          doubleClickZoom={true}
          touchZoom={true}
          boxZoom={true}
          keyboard={true}
          style={{ height: '100%', width: '100%', zIndex: 0 }}
        >
          <TileLayer
            attribution='&copy; Esri'
            url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
          />
          {/* Overlay de labels para ver calles */}
          <TileLayer
            url="https://basemaps.cartocdn.com/light_only_labels/{z}/{x}/{y}{r}.png"
            opacity={0.7}
          />
          <SyncMap setViewState={setViewState} deckRef={deckRef} setHoverInfo={setHoverInfo} />
        </MapContainer>

        {/* TOOLTIP MANUAL (Para evitar lag de DeckGL) */}
        {hoverInfo && hoverInfo.object && (
          <div style={{
            position: 'fixed',
            left: hoverInfo.x + 15,
            top: hoverInfo.y + 15,
            zIndex: 1000,
            pointerEvents: 'none',
            fontFamily: 'Segoe UI',
            background: 'rgba(15,25,40,0.95)',
            padding: '12px',
            borderRadius: '10px',
            color: 'white',
            boxShadow: '0 4px 15px rgba(0,0,0,0.5)',
            border: `1px solid ${ciclorrutaNames.some(cn => hoverInfo.object.corredor?.toLowerCase().includes(cn)) ? '#00d4d4' : '#2ec480'}`
          }}>
            <div style={{ fontWeight: 700, color: ciclorrutaNames.some(cn => hoverInfo.object.corredor?.toLowerCase().includes(cn)) ? '#00d4d4' : '#2ec480' }}>
              {hoverInfo.object.path ? 
                (ciclorrutaNames.some(cn => hoverInfo.object.corredor?.toLowerCase().includes(cn)) ? '🚲 Ciclorruta' : '🛣️ Corredor') 
                : '📍 Punto Vial'
              }: {hoverInfo.object.corredor}
            </div>
            <div style={{ fontSize: '11px', color: '#aaa' }}>Comuna: {hoverInfo.object.comuna}</div>
            {hoverInfo.object.vel && <div>🚗 {hoverInfo.object.vel.toFixed(1)} km/h</div>}
            {hoverInfo.object.intensidad && <div>📊 Volumen: {hoverInfo.object.intensidad}</div>}
          </div>
        )}

        {/* DECK.GL overlay */}
        <div style={{ position: 'absolute', inset: 0, zIndex: 10, pointerEvents: 'none' }}>
          <DeckGL
            ref={deckRef}
            viewState={viewState}
            layers={layers}
            controller={false}
          />
        </div>

        {/* FILTROS DE HORA — esquina superior derecha */}
        <div style={{
          position: 'absolute', top: '15px', right: '15px', zIndex: 30,
          display: 'flex', flexDirection: 'column', gap: '6px',
        }}>
          <button 
            style={timeBtn(timeFilter === 'am')} 
            onClick={() => setTimeFilter(prev => prev === 'am' ? 'none' : 'am')}
          >
            HORA PICO AM
          </button>
          <button 
            style={timeBtn(timeFilter === 'pm')} 
            onClick={() => setTimeFilter(prev => prev === 'pm' ? 'none' : 'pm')}
          >
            HORA PICO PM
          </button>
          <button 
            style={timeBtn(timeFilter === 'night')} 
            onClick={() => setTimeFilter(prev => prev === 'night' ? 'none' : 'night')}
          >
            HORARIO NOCTURNO
          </button>
          <button 
            style={timeBtn(showCiclorrutas)} 
            onClick={() => setShowCiclorrutas(!showCiclorrutas)}
          >
            {showCiclorrutas ? 'OCULTAR CICLORRUTAS' : 'MOSTRAR CICLORRUTAS'}
          </button>
        </div>

        {/* LEYENDA — esquina inferior izquierda */}
        <div style={{ 
          position: 'absolute', bottom: '15px', left: '15px', zIndex: 30,
          background: 'rgba(10, 20, 40, 0.92)', padding: '14px 16px', borderRadius: '12px',
          border: '1px solid rgba(255,255,255,0.1)', backdropFilter: 'blur(12px)',
          maxWidth: '210px', color: 'white',
        }}>
          {/* Escala de Volumen */}
          <div style={{ fontWeight: 700, fontSize: '11px', marginBottom: '6px' }}>Escala de Volumen</div>
          <div style={{ fontSize: '9px', color: 'rgba(255,255,255,0.5)', marginBottom: '6px' }}>Altura de Columna</div>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: '6px', marginBottom: '4px' }}>
            {[10, 16, 22, 28, 34].map((h, i) => (
              <div key={i} style={{
                width: '12px', height: `${h}px`, borderRadius: '2px',
                background: `rgba(${180 - i*30}, ${200 + i*10}, ${150 + i*20}, 0.8)`,
              }} />
            ))}
            <div style={{ display: 'flex', gap: '2px', marginLeft: '6px' }}>
              {[8, 12, 16].map((w, i) => (
                <div key={i} style={{
                  width: `${w}px`, height: '3px', borderRadius: '2px',
                  background: 'rgba(0, 200, 200, 0.6)',
                }} />
              ))}
            </div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '8px', color: 'rgba(255,255,255,0.4)', marginBottom: '12px' }}>
            <span>&lt; 30+ km/h</span><span>60+ km/h</span>
          </div>

          {/* Escala de Velocidad */}
          <div style={{ fontWeight: 700, fontSize: '11px', marginBottom: '6px' }}>Escala de Velocidad</div>
          <div style={{ 
            height: '8px', borderRadius: '4px', marginBottom: '4px',
            background: 'linear-gradient(90deg, #dc1e1e, #ff6420, #ffc028, #a0dc50, #28c8a0)'
          }} />
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '8px', color: 'rgba(255,255,255,0.5)', marginBottom: '10px' }}>
            <span>&lt; 15 km/h</span><span>&gt; 50 km/h</span>
          </div>

          {/* Ciclorutas */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <svg width="20" height="8"><path d="M0,4 Q5,0 10,4 Q15,8 20,4" stroke="#00d4d4" fill="none" strokeWidth="2"/></svg>
            <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.7)' }}>Ciclorutas</span>
          </div>
        </div>

        {/* LOADING */}
        {loading && (
          <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', zIndex: 20, color: 'white', background: 'rgba(0,0,0,0.7)', padding: '12px 24px', borderRadius: '12px', fontSize: '13px', fontWeight: 500 }}>
            ⏳ Cargando datos de tráfico...
          </div>
        )}

      </div>
    );
  };

  export default MobilityMap;