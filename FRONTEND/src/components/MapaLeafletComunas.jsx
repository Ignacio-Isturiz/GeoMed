// src/components/MapaLeafletComunas.jsx
// Mapa coroplético real de Medellín con datos de criminalidad por comuna

import { useEffect, useRef } from 'react';

const GEOJSON_URL =
  'https://serviciosgiscnmh.centrodememoriahistorica.gov.co/agccnmh/rest/services/DCMH/Medellinguerraurbana/FeatureServer/0/query?where=1%3D1&outFields=*&f=geojson';

// Normaliza nombres para hacer matching entre el CSV y el GeoJSON
const norm = (str) =>
  str
    .toUpperCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[-_]/g, ' ')
    .trim();

function matchComuna(nombreGeo, comunasData) {
  const geoNorm = norm(nombreGeo);
  return comunasData.find((c) => {
    const csvNorm = norm(c.nombre);
    return csvNorm === geoNorm || csvNorm.includes(geoNorm) || geoNorm.includes(csvNorm);
  });
}

function tasaToColor(tasa, tasaMin, tasaMax, alpha = 1) {
  const t = tasaMax === tasaMin ? 0.5 : (tasa - tasaMin) / (tasaMax - tasaMin);
  const r = Math.round(254 - t * (254 - 127));
  const g = Math.round(202 - t * (202 - 29));
  const b = Math.round(202 - t * (202 - 29));
  return `rgba(${r},${g},${b},${alpha})`;
}

export default function MapaLeafletComunas({ comunas, destacadas = [] }) {
  const mapRef = useRef(null);
  const leafletMap = useRef(null);
  const geoLayer = useRef(null);

  const tasas = comunas.map((c) => c.tasa);
  const tasaMin = Math.min(...tasas);
  const tasaMax = Math.max(...tasas);
  const destacadasNorm = destacadas.map(norm);

  const esDestacada = (nombre) =>
    destacadasNorm.some(
      (d) => norm(nombre).includes(d) || d.includes(norm(nombre))
    );

  useEffect(() => {
    if (!mapRef.current) return;

    // Importar leaflet dinámicamente (evita SSR issues)
    import('leaflet').then((L) => {
      // CSS de leaflet
      if (!document.querySelector('#leaflet-css')) {
        const link = document.createElement('link');
        link.id = 'leaflet-css';
        link.rel = 'stylesheet';
        link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
        document.head.appendChild(link);
      }

      // Inicializar mapa solo una vez
      if (!leafletMap.current) {
        leafletMap.current = L.map(mapRef.current, {
          center: [6.244, -75.574],
          zoom: 11,
          zoomControl: true,
          scrollWheelZoom: false,
        });

        L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
          attribution: '© OpenStreetMap © CARTO',
          maxZoom: 18,
        }).addTo(leafletMap.current);
      }

      // Remover capa anterior
      if (geoLayer.current) {
        geoLayer.current.remove();
        geoLayer.current = null;
      }

      // Fetch GeoJSON y renderizar
      fetch(GEOJSON_URL)
        .then((r) => r.json())
        .then((geojson) => {
          geoLayer.current = L.geoJSON(geojson, {
            style: (feature) => {
              const nombreGeo = feature.properties.Nombre_Comuna || '';
              const match = matchComuna(nombreGeo, comunas);
              const destacada = esDestacada(nombreGeo);

              if (!match) {
                return {
                  fillColor: '#334155',
                  fillOpacity: 0.5,
                  color: '#475569',
                  weight: 1,
                };
              }

              return {
                fillColor: tasaToColor(match.tasa, tasaMin, tasaMax),
                fillOpacity: destacada ? 0.92 : 0.75,
                color: destacada ? '#ffffff' : '#1e293b',
                weight: destacada ? 2.5 : 1,
              };
            },
            onEachFeature: (feature, layer) => {
              const nombreGeo = feature.properties.Nombre_Comuna || 'Desconocida';
              const match = matchComuna(nombreGeo, comunas);
              const destacada = esDestacada(nombreGeo);

              const popupContent = match
                ? `<div style="font-family:sans-serif;min-width:140px">
                    <strong style="font-size:13px">${nombreGeo}</strong>${destacada ? ' ⭐' : ''}
                    <br/><span style="color:#666;font-size:11px">Tasa: <b>${match.tasa.toFixed(2)}</b> por 100k hab.</span>
                    <br/><span style="color:#666;font-size:11px">Casos: <b>${match.casos.toLocaleString()}</b></span>
                  </div>`
                : `<strong>${nombreGeo}</strong><br/><span style="color:#999;font-size:11px">Sin datos</span>`;

              layer.bindPopup(popupContent);

              layer.on('mouseover', function () {
                this.setStyle({ fillOpacity: 1, weight: 2.5 });
              });
              layer.on('mouseout', function () {
                geoLayer.current?.resetStyle(this);
              });
              layer.on('click', function () {
                this.openPopup();
              });
            },
          }).addTo(leafletMap.current);

          // Si hay destacadas, hacer zoom a ellas
          if (destacadas.length > 0 && destacadas.length < 5) {
            const bounds = [];
            geoLayer.current.eachLayer((layer) => {
              const nombre = layer.feature?.properties?.Nombre_Comuna || '';
              if (esDestacada(nombre)) {
                bounds.push(layer.getBounds());
              }
            });
            if (bounds.length > 0) {
              const combined = bounds.reduce((acc, b) => acc.extend(b));
              leafletMap.current.fitBounds(combined, { padding: [30, 30] });
            }
          } else {
            leafletMap.current.setView([6.244, -75.574], 11);
          }
        })
        .catch(() => {
          // Si el fetch falla no rompe el componente
        });
    });

    return () => {
      // No destruir el mapa al desmontar para no perder el estado
    };
  }, [comunas, destacadas]);

  return (
    <div style={{ marginTop: '0.75rem' }}>
      {/* Leyenda */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '0.4rem',
        flexWrap: 'wrap',
        gap: '0.25rem',
      }}>
        <span style={{ fontSize: '0.72rem', color: '#94a3b8' }}>
          Tasa de criminalidad por cada 100.000 hab.
        </span>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <span style={{ fontSize: '0.68rem', color: '#fecaca' }}>más seguro</span>
          <div style={{
            width: '60px', height: '8px', borderRadius: '4px',
            background: 'linear-gradient(to right, #fecaca, #7f1d1d)',
          }} />
          <span style={{ fontSize: '0.68rem', color: '#fca5a5' }}>más peligroso</span>
        </div>
      </div>

      {/* Mapa */}
      <div
        ref={mapRef}
        style={{
          height: '280px',
          width: '100%',
          borderRadius: '0.5rem',
          overflow: 'hidden',
          border: '1px solid #334155',
        }}
      />
      <p style={{ fontSize: '0.65rem', color: '#475569', margin: '0.25rem 0 0', textAlign: 'right' }}>
        Haz clic en una comuna para ver su tasa · © OpenStreetMap © CARTO
      </p>
    </div>
  );
}
