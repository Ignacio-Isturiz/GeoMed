import React from 'react';
import CorredoresMap from './CorredoresMap';
import HeatmapComunas from './HeatmapComunas';

const MobilityDashboard = ({ data }) => {
  if (!data) return null;

  const { 
    top_corredores = [], 
    presion_comunas = [], 
    anomaly_trend = [], 
    prioridades = {}, 
    puntos_congestion = [] 
  } = data;

  // Helper for small horizontal bar chart
  const MiniBar = ({ val, max, color }) => (
    <div style={{ width: '60px', height: '6px', background: 'rgba(255,255,255,0.05)', borderRadius: '3px', overflow: 'hidden' }}>
      <div style={{ width: `${(val / (max || 1)) * 100}%`, height: '100%', background: color || 'var(--accent)' }} />
    </div>
  );

  return (
    <div style={{ 
      display: 'grid', 
      gridTemplateColumns: 'repeat(2, 1fr)', 
      gridTemplateRows: 'repeat(2, 420px)', 
      gap: '20px', 
      marginBottom: '25px' 
    }}>
      
      {/* ── CARD 1: CORREDORES CRÍTICOS ── */}
      <div className="db-card" style={{ padding: '25px', position: 'relative', overflow: 'hidden', display: 'flex', gap: '18px' }}>
        <div style={{ flex: 1 }}>
          <h2 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '20px' }}>Corredores más críticos en semana</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {top_corredores.slice(0, 10).map((c, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', width: '140px' }}>
                  <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)', width: '15px' }}>{i+1}</span>
                  <span style={{ fontSize: '13px', fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{c.corredor}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <MiniBar val={c.criticidad} max={10} color={c.criticidad > 8 ? '#f43f5e' : '#10b981'} />
                  <span style={{ fontSize: '12px', fontWeight: 700, color: 'rgba(255,255,255,0.7)', width: '45px', textAlign: 'right' }}>
                    {(c.criticidad || 0).toFixed(1)}/10
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div style={{ flex: 1, minWidth: 0, height: 280, alignSelf: 'center', borderRadius: '16px', overflow: 'hidden', boxShadow: '0 2px 12px rgba(0,0,0,0.10)' }}>
          <CorredoresMap data={top_corredores} />
        </div>
      </div>

      {/* ── CARD 2: COMUNAS PRESIÓN VEHICULAR ── */}
      <div className="db-card" style={{ padding: '25px', display: 'flex', flexDirection: 'column', gap: '15px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <h2 style={{ fontSize: '18px', fontWeight: 700, margin: 0 }}>Comunas más presión vehicular en hora pico</h2>
            <div style={{ display: 'flex', gap: '10px', marginTop: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '10px', color: 'rgba(255,255,255,0.5)' }}>🕒 AM</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '10px', color: 'var(--accent)' }}>🕒 PM</div>
            </div>
          </div>
          <div style={{ width: '40px', height: '40px', borderRadius: '50%', border: '2px solid rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px' }}>🧭</div>
        </div>

        <div style={{ flex: 1, display: 'flex', gap: '20px' }}>
          {/* Heatmap Area */}
          <div style={{ flex: 1.5, borderRadius: '12px', overflow: 'hidden', position: 'relative', minWidth: 0, height: 280, boxShadow: '0 2px 12px rgba(0,0,0,0.10)' }}>
            <HeatmapComunas data={presion_comunas} />
          </div>

          {/* Vertical Bar Chart */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', gap: '8px' }}>
            <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.4)', transform: 'rotate(-90deg)', width: '0', whiteSpace: 'nowrap', marginBottom: '30px' }}>Index of vehicles</div>
            {presion_comunas.slice(0, 5).map((p, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ 
                  flex: 1, height: '14px', background: `rgba(16, 185, 129, ${0.9 - i*0.15})`, 
                  borderRadius: '3px', transition: 'width 0.5s' 
                }} />
                <span style={{ fontSize: '9px', color: 'rgba(255,255,255,0.5)', width: '50px', whiteSpace: 'nowrap', overflow: 'hidden' }}>{p.nombre_comuna}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── CARD 3: ANOMALÍAS Y PREDICCIÓN ── */}
      <div className="db-card" style={{ padding: '25px', display: 'flex', flexDirection: 'column' }}>
        <h2 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '5px' }}>Análisis de Anomalías y Predicción</h2>
        <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', marginBottom: '20px' }}>Modelo: Detección Anomalías</div>
        
        <div style={{ flex: 1, position: 'relative', marginTop: '10px' }}>
          {/* Simple SVG Chart */}
          <svg width="100%" height="100%" viewBox="0 0 100 40" preserveAspectRatio="none" style={{ overflow: 'visible' }}>
            <defs>
              <linearGradient id="peakGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#f43f5e" stopOpacity="0.5" />
                <stop offset="100%" stopColor="#f43f5e" stopOpacity="0" />
              </linearGradient>
            </defs>
            {/* Grid lines */}
            <line x1="0" y1="35" x2="100" y2="35" stroke="rgba(255,255,255,0.05)" strokeWidth="0.5" />
            <line x1="0" y1="5" x2="100" y2="5" stroke="rgba(255,255,255,0.05)" strokeWidth="0.5" />
            
            {/* Baseline (Historical) Area */}
            {anomaly_trend.length > 0 && (
              <>
                <path d={`M 0 35 ${anomaly_trend.map((d, i) => `L ${(i / (anomaly_trend.length - 1)) * 100} ${35 - ((d.base || 0) / 40) * 30}`).join(' ')} L 100 35 Z`} 
                      fill="rgba(59, 130, 246, 0.05)" />
                <path d={`M 0 30 ${anomaly_trend.map((d, i) => `L ${(i / (anomaly_trend.length - 1)) * 100} ${35 - ((d.base || 0) / 40) * 30}`).join(' ')}`} 
                      fill="none" stroke="rgba(59, 130, 246, 0.3)" strokeWidth="1" strokeDasharray="2,1" />
                
                {/* Current (Peak) Area */}
                <path d={`M 0 35 ${anomaly_trend.map((d, i) => `L ${(i / (anomaly_trend.length - 1)) * 100} ${35 - ((d.peak || 0) / 40) * 30}`).join(' ')} L 100 35 Z`} 
                      fill="url(#peakGradient)" />
                <path d={`M 0 30 ${anomaly_trend.map((d, i) => `L ${(i / (anomaly_trend.length - 1)) * 100} ${35 - ((d.peak || 0) / 40) * 30}`).join(' ')}`} 
                      fill="none" stroke="#f43f5e" strokeWidth="1.5" />
              </>
            )}
            
            {/* Highlight point */}
            <circle cx="78" cy="15" r="1.5" fill="#f43f5e" stroke="white" strokeWidth="0.5" />
            <text x="78" y="10" fontSize="3" fill="#fff" textAnchor="middle" fontWeight="bold">Pico Atípico</text>
          </svg>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '9px', color: 'rgba(255,255,255,0.3)', marginTop: '5px' }}>
            <span>6AM</span><span>8PM</span>
          </div>
          
          <div style={{ marginTop: '20px', display: 'flex', gap: '15px' }}>
             <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '10px' }}>
                <div style={{ width: '8px', height: '2px', background: '#f43f5e' }} /> Picos Atípicos Detectados
             </div>
             <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '10px' }}>
                <div style={{ width: '8px', height: '2px', background: 'rgba(59, 130, 246, 0.4)', borderBottom: '1px dashed' }} /> Promedio histórico
             </div>
          </div>
        </div>
      </div>

      {/* ── CARD 4: ZONAS PRIORITARIAS ── */}
      <div className="db-card" style={{ padding: '25px' }}>
        <h2 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '25px' }}>Zonas Prioritarias para Intervención</h2>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '15px' }}>
          {/* Rutas Alternas */}
          <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
            <div style={{ fontSize: '13px', fontWeight: 700 }}>Rutas Alternas</div>
            <div style={{ width: '60px', height: '60px', background: 'rgba(255,255,255,0.03)', borderRadius: '15px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '30px' }}>🔀</div>
            <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.5)', lineHeight: 1.4 }}>
              <strong>Sugerencia:</strong> {prioridades?.rutas_alternas?.sugerencia || 'Calculando...'}
            </div>
          </div>

          {/* Gestión Semafórica */}
          <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
            <div style={{ fontSize: '13px', fontWeight: 700 }}>Gestión Semafórica</div>
            <div style={{ width: '60px', height: '60px', background: 'rgba(255,255,255,0.03)', borderRadius: '15px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '30px' }}>🚦</div>
            <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.5)', lineHeight: 1.4 }}>
              <strong>Sugerencia:</strong> {prioridades?.gestion_semaforica?.sugerencia || 'Calculando...'}
            </div>
          </div>

          {/* Transporte Sostenible */}
          <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
            <div style={{ fontSize: '13px', fontWeight: 700 }}>Transporte Sostenible</div>
            <div style={{ width: '60px', height: '60px', background: 'rgba(255,255,255,0.03)', borderRadius: '15px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '30px' }}>🚲</div>
            <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.5)', lineHeight: 1.4 }}>
              <strong>Sugerencia:</strong> {prioridades?.transporte_sostenible?.sugerencia || 'Calculando...'}
            </div>
          </div>
        </div>

        <div style={{ marginTop: '30px', display: 'flex', justifyContent: 'center', gap: '10px' }}>
           {[ '#f43f5e', '#f59e0b', '#10b981', '#3b82f6', '#fff' ].map((c, i) => (
             <div key={i} style={{ width: '12px', height: '12px', borderRadius: '50%', background: c, opacity: 0.8 }} />
           ))}
        </div>
      </div>

    </div>
  );
};

export default MobilityDashboard;
