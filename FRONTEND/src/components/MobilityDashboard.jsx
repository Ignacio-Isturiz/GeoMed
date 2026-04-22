import React, { useState, useEffect } from 'react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceDot, CartesianGrid } from 'recharts';
import CorredoresMap from './CorredoresMap';
import HeatmapComunas from './HeatmapComunas';
import mobilityService from '../services/mobilityService';

const MobilityDashboard = ({ data }) => {
  if (!data) return null;

  const {
    top_corredores = [],
    presion_comunas = [],
    anomaly_trend = [],
    prioridades = {},
    puntos_congestion = [],
    todos_corredores = []
  } = data;

  // Estados para el explorador dinámico
  const [selectedCorridor, setSelectedCorridor] = useState(todos_corredores[0] || 'Avenida Regional');
  const [selectedHour, setSelectedHour] = useState(new Date().getHours());
  const [aiAnalysis, setAiAnalysis] = useState(null);
  const [loadingAnalysis, setLoadingAnalysis] = useState(false);

  // Efecto para obtener análisis inteligente cada vez que cambia el corredor o la hora
  useEffect(() => {
    const fetchAnalysis = async () => {
      setLoadingAnalysis(true);
      try {
        const result = await mobilityService.analyzeCorridorHour(selectedCorridor, selectedHour);
        setAiAnalysis(result);
      } catch (err) {
        console.error('Error al obtener análisis IA:', err);
      } finally {
        setLoadingAnalysis(false);
      }
    };
    fetchAnalysis();
  }, [selectedCorridor, selectedHour]);

  const CORREDOR_COLORS = [
    '#ef4444', '#f97316', '#eab308', '#84cc16', '#22c55e',
    '#06b6d4', '#3b82f6', '#8b5cf6', '#d946ef', '#f43f5e'
  ];

  // Helper para pequeños gráficos de barra horizontales
  const MiniBar = ({ val, max, color }) => (
    <div style={{ width: '60px', height: '6px', background: 'rgba(255,255,255,0.05)', borderRadius: '3px', overflow: 'hidden' }}>
      <div style={{ width: `${(val / (max || 1)) * 100}%`, height: '100%', background: color || 'var(--accent)' }} />
    </div>
  );

  // Custom Tooltip para Recharts
  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      const deviation = ((data.peak - data.base) / (data.base || 1) * 100).toFixed(1);
      return (
        <div style={{
          background: 'rgba(15, 23, 42, 0.9)',
          backdropFilter: 'blur(10px)',
          padding: '12px',
          borderRadius: '12px',
          border: '1px solid rgba(255,255,255,0.1)',
          boxShadow: '0 10px 25px rgba(0,0,0,0.3)'
        }}>
          <p style={{ margin: 0, fontWeight: 'bold', color: '#fff', fontSize: '12px' }}>Hora: {data.hora}:00</p>
          <div style={{ marginTop: '8px', display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '11px' }}>
            <p style={{ margin: 0, color: 'rgba(255,255,255,0.7)' }}>Desviación: <span style={{ color: '#ff4d4d' }}>+{deviation}%</span></p>
            <p style={{ margin: 0, color: 'rgba(255,255,255,0.7)' }}>Probabilidad: <span style={{ color: '#00C896' }}>Altísima</span></p>
            <p style={{ margin: 0, color: 'rgba(255,255,255,0.7)' }}>Criticidad: <span style={{ color: '#f59e0b' }}>{(data.peak/5).toFixed(1)}/10</span></p>
          </div>
        </div>
      );
    }
    return null;
  };

  // Gráfico dinámico: usa la tendencia específica del corredor si ya cargó el análisis IA
  const currentTrend = (aiAnalysis && aiAnalysis.anomaly_trend) ? aiAnalysis.anomaly_trend : anomaly_trend;

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(2, 1fr)',
      gridTemplateRows: 'repeat(2, 450px)',
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
                  <span style={{
                    fontSize: '11px',
                    color: '#000',
                    backgroundColor: CORREDOR_COLORS[i % CORREDOR_COLORS.length],
                    minWidth: '18px',
                    height: '18px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderRadius: '50%',
                    fontWeight: 'bold'
                  }}>{i + 1}</span>
                  <span style={{ fontSize: '13px', fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{c.corredor}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <MiniBar val={c.criticidad} max={10} color={CORREDOR_COLORS[i % CORREDOR_COLORS.length]} />
                  <span style={{ fontSize: '12px', fontWeight: 700, color: '#000000ff', width: '45px', textAlign: 'right' }}>
                    {(c.criticidad || 0).toFixed(1)}/10
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div style={{ flex: 1, minWidth: 0, height: 280, alignSelf: 'center', borderRadius: '16px', overflow: 'hidden', boxShadow: '0 2px 12px rgba(0,0,0,0.10)' }}>
          <CorredoresMap data={top_corredores.slice(0, 10).map((c, i) => ({ ...c, displayColor: CORREDOR_COLORS[i % CORREDOR_COLORS.length] }))} />
        </div>
      </div>

      {/* ── CARD 2: COMUNAS PRESIÓN VEHICULAR ── */}
      <div className="db-card" style={{ padding: '25px', display: 'flex', flexDirection: 'column', gap: '15px' }}>
        <h2 style={{ fontSize: '18px', fontWeight: 700, margin: 0 }}>Comunas más presión vehicular en hora pico</h2>
        <div style={{ flex: 1, display: 'flex', gap: '20px' }}>
          <div style={{ flex: 1.5, borderRadius: '12px', overflow: 'hidden', position: 'relative', minWidth: 0, height: 280, boxShadow: '0 2px 12px rgba(0,0,0,0.10)' }}>
            <HeatmapComunas data={presion_comunas} />
          </div>
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'flex-start', gap: '8px' }}>
            {presion_comunas.slice(0, 5).map((p, i) => {
              const maxIntensidad = Math.max(...presion_comunas.map(c => c.intensidad || 1), 1);
              const ratio = p.intensidad / maxIntensidad;
              const barColor = ratio > 0.8 ? '#be123c' : (ratio > 0.5 ? '#f43f5e' : '#fda4af');
              return (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{ flex: 1, height: '14px', background: barColor, borderRadius: '3px' }} />
                  <span style={{ fontSize: '10px', fontWeight: 'bold', color: '#000', width: '70px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.nombre_comuna}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── CARD 3: EXPLORADOR DE ANOMALÍAS DINÁMICO ── */}
      <div className="db-card" style={{ padding: '25px', display: 'flex', flexDirection: 'column', background: 'rgba(255,255,255,0.02)', backdropFilter: 'blur(20px)', borderRadius: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <div>
            <h2 style={{ fontSize: '18px', fontWeight: 700, margin: 0 }}>Explorador de Anomalías</h2>
            <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', margin: '4px 0 0 0' }}>Análisis dinámico por corredor y hora</p>
          </div>
          <select 
            value={selectedCorridor}
            onChange={(e) => setSelectedCorridor(e.target.value)}
            style={{
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.1)',
              color: '#fff',
              padding: '6px 12px',
              borderRadius: '8px',
              fontSize: '12px',
              outline: 'none',
              cursor: 'pointer'
            }}
          >
            {todos_corredores.map(c => <option key={c} value={c} style={{background: '#1e293b'}}>{c}</option>)}
          </select>
        </div>

        <div style={{ flex: 1, minHeight: '250px', width: '100%' }}>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={currentTrend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="colorPeak" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ff4d4d" stopOpacity={0.4}/>
                  <stop offset="95%" stopColor="#ff4d4d" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="hora" hide />
              <YAxis hide domain={[0, 40]} />
              <Tooltip content={<CustomTooltip />} />
              <Area 
                type="monotone" 
                dataKey="base" 
                stroke="rgba(59, 130, 246, 0.4)" 
                strokeWidth={2} 
                strokeDasharray="5 5"
                fill="transparent" 
                animationDuration={500}
              />
              <Area 
                type="monotone" 
                dataKey="peak" 
                stroke="#ff4d4d" 
                strokeWidth={3} 
                fillOpacity={1} 
                fill="url(#colorPeak)" 
                animationDuration={500}
              />
              {/* Punto de Pulso (Dot) */}
              <ReferenceDot 
                x={selectedHour} 
                y={currentTrend[selectedHour]?.peak || 0} 
                r={6} 
                fill="#ff4d4d" 
                stroke="#fff" 
                strokeWidth={2}
                isFront={true}
              >
                <animate attributeName="r" from="4" to="8" dur="1s" repeatCount="indefinite" />
                <animate attributeName="opacity" from="1" to="0" dur="1s" repeatCount="indefinite" />
              </ReferenceDot>
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div style={{ marginTop: '15px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: 'rgba(255,255,255,0.4)', marginBottom: '8px' }}>
            <span>00:00</span>
            <span style={{ color: '#fff', fontWeight: 'bold' }}>Hora Seleccionada: {selectedHour}:00</span>
            <span>23:00</span>
          </div>
          <input 
            type="range" 
            min="0" 
            max="23" 
            value={selectedHour} 
            onChange={(e) => setSelectedHour(parseInt(e.target.value))}
            style={{
              width: '100%',
              accentColor: '#ff4d4d',
              cursor: 'pointer',
              height: '4px',
              borderRadius: '2px',
            }}
          />
        </div>
      </div>

      {/* ── CARD 4: RECOMENDACIONES Y PRIORIDADES ── */}
      <div className="db-card" style={{ 
        padding: '25px', 
        display: 'flex', 
        flexDirection: 'column',
        background: 'rgba(255,255,255,0.02)',
        backdropFilter: 'blur(25px)',
        borderRadius: '24px',
        border: '1px solid rgba(255,255,255,0.08)',
        boxShadow: '0 20px 50px rgba(0,0,0,0.2)',
        minHeight: '400px'
      }}>
        <h2 style={{ fontSize: '19px', fontWeight: 800, marginBottom: '25px', color: '#fff' }}>
          Recomendaciones y Prioridades de Intervención
        </h2>

        {loadingAnalysis ? (
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,0.5)', fontSize: '13px' }}>
            <div className="pulse" style={{ marginRight: '10px' }}>🤖</div> Consultando modelos de IA...
          </div>
        ) : (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {/* Tres Columnas de Prioridades */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '15px' }}>
              
              {/* Rutas Alternas */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
                <div style={{ width: '48px', height: '48px', borderRadius: '14px', background: 'rgba(59, 130, 246, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '12px', border: '1px solid rgba(59, 130, 246, 0.2)' }}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8L22 12L18 16"/><path d="M2 12H22"/><path d="M2 12L6 8"/><path d="M2 12L6 16"/></svg>
                </div>
                <h3 style={{ fontSize: '13px', fontWeight: 700, color: '#3b82f6', marginBottom: '6px' }}>Rutas Alternas</h3>
                <p style={{ fontSize: '10px', color: 'rgba(255,255,255,0.6)', lineHeight: '1.4' }}>
                  {aiAnalysis?.recommendations?.rutas_alternas || "No disponible"}
                </p>
              </div>

              {/* Gestión Semafórica */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
                <div style={{ width: '48px', height: '48px', borderRadius: '14px', background: 'rgba(245, 158, 11, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '12px', border: '1px solid rgba(245, 158, 11, 0.2)' }}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="6" y="2" width="12" height="20" rx="6"/><circle cx="12" cy="7" r="2" fill="#ef4444"/><circle cx="12" cy="12" r="2" fill="#f59e0b"/><circle cx="12" cy="17" r="2" fill="#22c55e"/></svg>
                </div>
                <h3 style={{ fontSize: '13px', fontWeight: 700, color: '#f59e0b', marginBottom: '6px' }}>Gestión Semafórica</h3>
                <p style={{ fontSize: '10px', color: 'rgba(255,255,255,0.6)', lineHeight: '1.4' }}>
                  {aiAnalysis?.recommendations?.gestion_semaforica || "No disponible"}
                </p>
              </div>

              {/* Transporte Sostenible */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
                <div style={{ width: '48px', height: '48px', borderRadius: '14px', background: 'rgba(34, 197, 94, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '12px', border: '1px solid rgba(34, 197, 94, 0.2)' }}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="18.5" cy="17.5" r="3.5"/><circle cx="5.5" cy="17.5" r="3.5"/><circle cx="15" cy="5" r="1"/><path d="M12 17.5V14l-3-3 4-3 2 3h2"/></svg>
                </div>
                <h3 style={{ fontSize: '13px', fontWeight: 700, color: '#22c55e', marginBottom: '6px' }}>Transp. Sostenible</h3>
                <p style={{ fontSize: '10px', color: 'rgba(255,255,255,0.6)', lineHeight: '1.4' }}>
                  {aiAnalysis?.recommendations?.transporte_sostenible || "No disponible"}
                </p>
              </div>
            </div>

            {/* Cuadro Resumen Crítico */}
            <div style={{ 
              marginTop: '10px',
              padding: '18px', 
              background: 'rgba(255,255,255,0.05)', 
              borderRadius: '18px', 
              border: '1px solid rgba(255,255,255,0.1)'
            }}>
              <p style={{ fontSize: '12px', fontWeight: 800, color: '#fff', marginBottom: '8px', textTransform: 'uppercase' }}>
                ANÁLISIS DE {selectedCorridor}:
              </p>
              <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.9)', lineHeight: '1.6' }}>
                {aiAnalysis?.recommendations?.resumen_critico || "Analizando comportamiento del corredor..."}
              </p>
            </div>
          </div>
        )}
      </div>

    </div>
  );
};

export default MobilityDashboard;

