import { useEffect, useMemo, useState } from 'react';
import { MapContainer, TileLayer, Polyline, Tooltip, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import proj4 from 'proj4';
import mobilityService from '@/services/mobilityService';

const MEDELLIN_CENTER = [6.2442, -75.5812];
const SRC_CRS = 'EPSG:3116';
const DST_CRS = 'EPSG:4326';

proj4.defs(
  SRC_CRS,
  '+proj=tmerc +lat_0=4.59620041666667 +lon_0=-74.0775079166667 +k=1 +x_0=1000000 +y_0=1000000 +ellps=GRS80 +units=m +no_defs'
);

const norm = (value) =>
  (value || '')
    .toString()
    .toUpperCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[-_\s]+/g, ' ')
    .trim();

const corridorAngleByName = (name = '') => {
  const n = norm(name);
  if (n.includes('CALLE')) return 8; // Este-Oeste
  if (n.includes('CARRERA')) return 98; // Norte-Sur
  if (n.includes('AUTOPISTA SUR')) return 120;
  if (n.includes('AUTOPISTA NORTE')) return 70;
  if (n.includes('REGIONAL')) return 100;
  if (n.includes('PALMAS')) return 45;
  if (n.includes('COLOMBIA')) return 15;
  return 85;
};

const buildCorridorFallbackLine = (lat, lng, corredor, index) => {
  const baseDeg = corridorAngleByName(corredor);
  const offsetDeg = ((index % 5) - 2) * 9;
  const theta = ((baseDeg + offsetDeg) * Math.PI) / 180;

  const halfLen = 0.018 + (index * 0.0007);
  const sep = ((index % 2 === 0 ? 1 : -1) * (Math.floor(index / 2) * 0.0022));

  // Longitud en Medellín: ~1° lon ~= 110km * cos(lat)
  const cosLat = Math.max(0.35, Math.cos((lat * Math.PI) / 180));
  const dx = (halfLen * Math.sin(theta)) / cosLat;
  const dy = halfLen * Math.cos(theta);

  const px = (sep * Math.sin(theta + Math.PI / 2)) / cosLat;
  const py = sep * Math.cos(theta + Math.PI / 2);

  return [
    [lat - dy + py, lng - dx + px],
    [lat + dy + py, lng + dx + px]
  ];
};

const extentOf = (coords) => {
  if (!coords?.length) return 0;
  let minLat = Number.POSITIVE_INFINITY;
  let maxLat = Number.NEGATIVE_INFINITY;
  let minLng = Number.POSITIVE_INFINITY;
  let maxLng = Number.NEGATIVE_INFINITY;

  coords.forEach(([lat, lng]) => {
    if (lat < minLat) minLat = lat;
    if (lat > maxLat) maxLat = lat;
    if (lng < minLng) minLng = lng;
    if (lng > maxLng) maxLng = lng;
  });

  return Math.max(maxLat - minLat, maxLng - minLng);
};

const inWgs84Range = (lat, lng) =>
  Number.isFinite(lat) &&
  Number.isFinite(lng) &&
  Math.abs(lat) <= 90 &&
  Math.abs(lng) <= 180;

const toWgs84 = (rawLat, rawLng) => {
  if (!Number.isFinite(rawLat) || !Number.isFinite(rawLng)) return null;
  if (inWgs84Range(rawLat, rawLng)) return [rawLat, rawLng];

  try {
    // Dataset trae (longitud=easting, latitud=northing)
    const [lon, lat] = proj4(SRC_CRS, DST_CRS, [rawLng, rawLat]);
    if (!inWgs84Range(lat, lon)) return null;
    return [lat, lon];
  } catch {
    return null;
  }
};

let geoPointsCache = null;
let geoPointsPromise = null;

const InvalidateMapSize = () => {
  const map = useMap();

  useEffect(() => {
    const t1 = setTimeout(() => map.invalidateSize(), 0);
    const t2 = setTimeout(() => map.invalidateSize(), 250);
    const onResize = () => map.invalidateSize();
    window.addEventListener('resize', onResize);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      window.removeEventListener('resize', onResize);
    };
  }, [map]);

  return null;
};

const CorredoresMap = ({ data = [] }) => {
  const [geoPoints, setGeoPoints] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    const load = async () => {
      setLoading(true);
      try {
        if (geoPointsCache) {
          if (!mounted) return;
          setGeoPoints(geoPointsCache);
          return;
        }

        if (!geoPointsPromise) {
          geoPointsPromise = mobilityService.getMobilityGeoData(2500)
            .then((rows) => {
              geoPointsCache = Array.isArray(rows) ? rows : [];
              return geoPointsCache;
            })
            .finally(() => {
              geoPointsPromise = null;
            });
        }

        const points = await geoPointsPromise;
        geoPointsCache = Array.isArray(points) ? points : [];
        if (!mounted) return;
        setGeoPoints(geoPointsCache);
      } catch (error) {
        console.error('Error cargando geodatos de movilidad:', error);
        if (mounted) setGeoPoints([]);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    load();
    return () => {
      mounted = false;
    };
  }, []);

  const corridorLines = useMemo(() => {
    const grouped = new Map();

    geoPoints.forEach((p) => {
      const corridorName = p.corredor || '';
      const key = norm(corridorName);
      const lat = Number(p.latitud);
      const lng = Number(p.longitud);

      if (!key || Number.isNaN(lat) || Number.isNaN(lng)) return;

      if (!grouped.has(key)) {
        grouped.set(key, {
          originalName: corridorName,
          points: []
        });
      }

      const mapCoords = toWgs84(lat, lng);
      if (!mapCoords) return;

      grouped.get(key).points.push({
        lat: mapCoords[0],
        lng: mapCoords[1],
        hora: Number(p.hora) || 0,
        criticidad: Number(p.criticidad) || 0,
        velocidad_km_h: Number(p.velocidad_km_h) || 0
      });
    });

    return data.slice(0, 10).map((corridor, index) => {
      const target = norm(corridor.corredor);
      const entry = grouped.get(target);

      let matchedPoints = entry?.points || [];

      if (!matchedPoints.length) {
        const fuzzyEntry = Array.from(grouped.entries()).find(([k]) => k.includes(target) || target.includes(k));
        matchedPoints = fuzzyEntry?.[1]?.points || [];
      }

      const ordered = [...matchedPoints].sort((a, b) => a.hora - b.hora || b.criticidad - a.criticidad);
      const uniqueCoords = [];
      const seen = new Set();

      ordered.forEach((pt) => {
        const hash = `${pt.lat.toFixed(6)}|${pt.lng.toFixed(6)}`;
        if (seen.has(hash)) return;
        seen.add(hash);
        uniqueCoords.push([pt.lat, pt.lng]);
      });

      // En vez de dibujar una polilínea sobre todos los puntos brutos del dataset,
      // usamos un único trazo por corredor. Eso evita zigzags y líneas múltiples
      // dentro de la misma capa cuando el dataset trae muchos puntos cercanos.
      const anchor = uniqueCoords.length
        ? uniqueCoords.reduce(
            (acc, [lat, lng]) => [acc[0] + lat, acc[1] + lng],
            [0, 0]
          ).map((value) => value / uniqueCoords.length)
        : MEDELLIN_CENTER;

      const positions = buildCorridorFallbackLine(anchor[0], anchor[1], corridor.corredor, index);

      const color = corridor.displayColor || '#ef4444';
      const speed = Number(corridor.velocidad_km_h) || 0;
      const score = Number(corridor.criticidad) || 0;

      return {
        index,
        corredor: corridor.corredor,
        criticidad: score,
        velocidad_km_h: speed,
        color,
        positions
      };
    });
  }, [geoPoints, data]);

  return (
    <MapContainer
      center={MEDELLIN_CENTER}
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
      <InvalidateMapSize />
      <TileLayer
        url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        attribution="&copy; CARTO"
      />

      {!loading && corridorLines.map((line) => (
        <Polyline
          key={`${line.corredor}-${line.index}`}
          positions={line.positions}
          color={line.color}
          weight={6 - Math.min(3, Math.floor(line.index / 3))}
          opacity={0.9}
          lineCap="round"
          lineJoin="round"
        >
          <Tooltip sticky direction="top">
            <strong>{line.corredor}</strong><br />
            Criticidad: {line.criticidad.toFixed(1)}/10<br />
            Velocidad: {line.velocidad_km_h.toFixed(0)} km/h
          </Tooltip>
        </Polyline>
      ))}
    </MapContainer>
  );
};

export default CorredoresMap;
