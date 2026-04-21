// src/components/ChatMap.jsx
// Mapa de marcadores en burbujas del chatbot emprendedor
// Restyled para coherencia con el dashboard MECIA

import { useEffect, useRef } from 'react';

export default function ChatMap({ locations = [] }) {
  const mapRef       = useRef(null);
  const leafletMap   = useRef(null);
  const markersLayer = useRef(null);

  useEffect(() => {
    if (!mapRef.current) return;

    import('leaflet').then((L) => {
      // CSS de Leaflet (una sola vez)
      if (!document.querySelector('#leaflet-css')) {
        const link = document.createElement('link');
        link.id   = 'leaflet-css';
        link.rel  = 'stylesheet';
        link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
        document.head.appendChild(link);
      }

      // Fix default marker icons en React
      delete L.Icon.Default.prototype._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
        iconUrl:       'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
        shadowUrl:     'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
      });

      // Inicializar mapa una sola vez
      if (!leafletMap.current) {
        leafletMap.current = L.map(mapRef.current, {
          center: [6.244, -75.574],
          zoom: 11,
          zoomControl: true,
          scrollWheelZoom: false,
          // Tile oscuro coherente con el dashboard dark
          attributionControl: false,
        });

        L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
          attribution: '© OpenStreetMap © CARTO',
          maxZoom: 18,
        }).addTo(leafletMap.current);

        // Atribución pequeña
        L.control.attribution({ position: 'bottomright', prefix: false })
          .addAttribution('© OpenStreetMap © CARTO')
          .addTo(leafletMap.current);
      }

      // Remover marcadores anteriores
      if (markersLayer.current) {
        markersLayer.current.remove();
        markersLayer.current = null;
      }

      // Agregar nuevos marcadores
      if (locations.length > 0) {
        const markers = locations
          .filter(loc => loc.lat && loc.lng)
          .map(loc =>
            L.marker([loc.lat, loc.lng]).bindPopup(
              `<div style="font-family:Inter,sans-serif;min-width:120px;">
                <strong style="font-size:13px;color:#0f172a">${loc.name}</strong>
                ${loc.count ? `<br/><span style="font-size:11px;color:#475569">Negocios: ${loc.count}</span>` : ''}
              </div>`
            )
          );

        if (markers.length > 0) {
          markersLayer.current = L.layerGroup(markers).addTo(leafletMap.current);
          const group = L.featureGroup(markers);
          leafletMap.current.fitBounds(group.getBounds(), { padding: [24, 24] });
        }
      }
    });
  }, [locations]);

  return (
    <div style={{
      marginTop: '12px',
      borderRadius: '10px',
      overflow: 'hidden',
      border: '1px solid rgba(255,255,255,0.12)',
      height: '210px',
      width: '100%',
    }}>
      <div ref={mapRef} style={{ height: '100%', width: '100%' }} />
    </div>
  );
}