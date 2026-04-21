// src/components/MapaCalorComunas.jsx
// Mapa de calor de comunas de Medellín basado en tasa real de criminalidad

export default function MapaCalorComunas({ comunas, destacadas = [] }) {
  if (!comunas || comunas.length === 0) return null;

  const tasas = comunas.map(c => c.tasa);
  const tasaMin = Math.min(...tasas);
  const tasaMax = Math.max(...tasas);

  // Normaliza la tasa a [0,1] para interpolar el color
  const norm = (tasa) =>
    tasaMax === tasaMin ? 0.5 : (tasa - tasaMin) / (tasaMax - tasaMin);

  // Rojo claro [254,202,202] → rojo oscuro [127,29,29]
  const getColor = (tasa) => {
    const t = norm(tasa);
    const r = Math.round(254 - t * (254 - 127));
    const g = Math.round(202 - t * (202 - 29));
    const b = Math.round(202 - t * (202 - 29));
    return `rgb(${r},${g},${b})`;
  };

  const getTextColor = (tasa) => norm(tasa) > 0.5 ? '#fff' : '#7f1d1d';

  // Normaliza el nombre para comparación flexible (sin tildes, mayúsculas, guiones)
  const normalizar = (str) =>
    str.toUpperCase()
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .replace(/[-_]/g, ' ')
      .trim();

  const destacadasNorm = destacadas.map(normalizar);

  const esDestacada = (nombre) =>
    destacadasNorm.some(d =>
      normalizar(nombre).includes(d) || d.includes(normalizar(nombre))
    );

  const ordenadas = [...comunas].sort((a, b) => b.tasa - a.tasa);

  // Si hay destacadas, las ponemos primero
  const conOrden = destacadas.length > 0
    ? [
        ...ordenadas.filter(c => esDestacada(c.nombre)),
        ...ordenadas.filter(c => !esDestacada(c.nombre)),
      ]
    : ordenadas;

  return (
    <div style={{ marginTop: '0.75rem' }}>
      {/* Leyenda */}
      <div style={{
        fontSize: '0.72rem',
        color: '#94a3b8',
        marginBottom: '0.5rem',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '0.25rem',
      }}>
        <span>Tasa por cada 100.000 hab.</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <span style={{ fontSize: '0.68rem', color: '#fecaca' }}>más seguro</span>
          <div style={{
            width: '60px', height: '8px', borderRadius: '4px',
            background: 'linear-gradient(to right, #fecaca, #7f1d1d)',
          }} />
          <span style={{ fontSize: '0.68rem', color: '#fca5a5' }}>más peligroso</span>
        </div>
      </div>

      {/* Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(88px, 1fr))',
        gap: '4px',
      }}>
        {conOrden.map((comuna) => {
          const destacada = esDestacada(comuna.nombre);
          return (
            <div
              key={comuna.nombre}
              title={`${comuna.nombre}\nTasa: ${comuna.tasa.toFixed(2)}\nCasos: ${comuna.casos.toLocaleString()}`}
              style={{
                backgroundColor: getColor(comuna.tasa),
                borderRadius: '6px',
                padding: destacada ? '8px 4px' : '5px 4px',
                textAlign: 'center',
                cursor: 'default',
                transform: destacada ? 'scale(1.06)' : 'scale(1)',
                outline: destacada ? '2px solid white' : 'none',
                outlineOffset: '1px',
                boxShadow: destacada ? '0 0 8px rgba(255,255,255,0.4)' : 'none',
                transition: 'transform 0.15s',
                zIndex: destacada ? 1 : 0,
                position: 'relative',
              }}
              onMouseEnter={e => { if (!destacada) e.currentTarget.style.transform = 'scale(1.05)'; }}
              onMouseLeave={e => { if (!destacada) e.currentTarget.style.transform = 'scale(1)'; }}
            >
              <div style={{
                fontSize: destacada ? '0.68rem' : '0.63rem',
                fontWeight: destacada ? '800' : '600',
                color: getTextColor(comuna.tasa),
                lineHeight: '1.2',
                wordBreak: 'break-word',
              }}>
                {comuna.nombre}
              </div>
              <div style={{
                fontSize: '0.6rem',
                color: getTextColor(comuna.tasa),
                opacity: 0.85,
                marginTop: '2px',
              }}>
                {comuna.tasa.toFixed(1)}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
