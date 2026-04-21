import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import authService from '@/services/authService';
import newsService from '@/services/newsService';
import mobilityService from '@/services/mobilityService';

import DashboardLayout, { Icons, StyledSelect } from '@/components/dashboard/DashboardLayout';
import MobilityMap from '@/components/MobilityMap';

const NAV = [
  { id: 'inicio',    label: 'Movilidad',      icon: <Icons.Dashboard /> },
  { id: 'noticias',  label: 'Noticias',      icon: <Icons.News /> },
];

const CAT_OPTIONS = [
  { value:'general',        label:'General' },
  { value:'seguridad',      label:'Seguridad' },
  { value:'emprendimiento', label:'Emprendimiento' },
  { value:'movilidad',      label:'Movilidad' },
  { value:'salud',          label:'Salud' },
  { value:'economia',       label:'Economía' },
];

/* ══════════════════════════════════════════════════════════════
   CIUDADANO DASHBOARD — MOBILITY FOCUS (HACKATHON)
══════════════════════════════════════════════════════════════ */
export default function CiudadanoDashboard() {
  const navigate = useNavigate();
  const [user, setUser]       = useState(null);
  const [loading, setLoading] = useState(true);
  const [mod, setMod]         = useState('inicio');
  
  // Mobility Data
  const [comunaData, setComunaData] = useState([]);
  const [corridors, setCorridors]   = useState([]);
  const [recs, setRecs]             = useState([]);
  const [topNoticias, setTopNoticias] = useState([]);
  const [hourData, setHourData] = useState([]);
  const [filterType, setFilterType] = useState('all'); // all, corridors, hour

  useEffect(() => {
    authService.getMe()
      .then(setUser)
      .catch(() => navigate('/login'))
      .finally(() => setLoading(false));
  }, [navigate]);

  // Load Mobility Data
  useEffect(() => {
    const fetchData = async () => {
        const loadSection = async (method, setter, label) => {
            try {
                const res = await method();
                setter(res);
                console.log(`✅ ${label} cargado:`, res);
            } catch (err) {
                console.error(`❌ Error cargando ${label}:`, err);
            }
        };

        // Fetch everything independently
        loadSection(mobilityService.getHourSummary, setHourData, "Resumen Horario");
        loadSection(mobilityService.getComunaSummary, setComunaData, "Resumen Comunas");
        loadSection(mobilityService.getCriticalCorridors, setCorridors, "Corredores Críticos");
        loadSection(mobilityService.getRecommendations, setRecs, "Recomendaciones");
        loadSection(() => newsService.getMedellinNews(6, 'movilidad'), setTopNoticias, "Noticias");
    };
    fetchData();
  }, []);

  const handleLogout = () => { authService.logout(); navigate('/login'); };

  if(loading) return <div className="db-loading"><div className="db-spinner"/>Analizando movilidad...</div>;
  if(!user) return null;

  const firstName = user.full_name?.split(' ')[0] || 'Usuario';

  const META = {
    inicio:    { accent:'Bienvenido,', title:firstName,          subtitle:'Análisis de movilidad urbana en tiempo real' },
    noticias:  { accent:'',      title:'Noticias',         subtitle:'Actualidad de Medellín y Antioquia' },
  };
  const m = META[mod];

  /* ══  Bloque Ciudad Inteligente  ══  */
  const ciudadInteligente = (
    <div className="db-rc" style={{flexShrink:0}}>
      <div className="db-card-header">
        <span className="db-card-title">Reto Hackathon</span>
      </div>
      <div className="db-note-body" style={{fontSize: '12.5px'}}>
        MECIA utiliza algoritmos para procesar <b>datasets oficiales</b> de velocidad y aforos vehiculares en Medellín.
      </div>
      <div className="db-note-footer">
        <span className="db-note-time">Antioquia · Valle de Aburrá</span>
        <div className="db-note-badge"><span className="ck">✓</span> Datos en vivo</div>
      </div>
    </div>
  );

  /* ══ COL-R dinámica por módulo ══ */
  const rightColByMod = {
    inicio: (
      <>
        {ciudadInteligente}
        <div className="db-rc" style={{flex:1,display:'flex',flexDirection:'column',overflow:'hidden'}}>
          <div className="db-card-header" style={{marginBottom:10}}>
            <span className="db-card-title">Alertas y Recomendaciones</span>
          </div>
          <div style={{overflowY:'auto',flex:1, display:'flex', flexDirection:'column', gap: '10px'}}>
            {recs.length === 0 ? (
              <div style={{fontSize:12,color:'var(--text-dim)'}}>Cargando recomendaciones...</div>
            ) : recs.map((rec,i)=>(
              <div key={i} style={{
                  padding: '12px',
                  borderRadius: '10px',
                  background: rec.type === 'warning' ? 'rgba(255,77,77,0.1)' : 'rgba(0,200,150,0.1)',
                  border: `1px solid ${rec.type === 'warning' ? '#ff4d4d' : '#00C896'}40`
              }}>
                <div style={{fontSize:13, fontWeight:700, color: rec.type === 'warning' ? '#ff4d4d' : '#00C896', marginBottom:4}}>{rec.title}</div>
                <div style={{fontSize:12, color:'var(--text-mid)', lineHeight:1.4}}>{rec.description}</div>
              </div>
            ))}
          </div>
        </div>
        <div className="db-rc" style={{flexShrink:0}}>
          <div className="db-card-header" style={{marginBottom:10, display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
            <span className="db-card-title">Noticias Movilidad</span>
            <button onClick={() => setMod('noticias')} style={{fontSize: '10px', color: 'var(--accent)', background: 'none', border: 'none', cursor: 'pointer'}}>Ver todas</button>
          </div>
          <div style={{maxHeight: '200px', overflowY: 'auto'}}>
            {topNoticias.slice(0,3).map((art,i)=>(
              <a key={i} href={art.url} target="_blank" rel="noreferrer" style={{display:'block',marginBottom:8,textDecoration:'none'}}>
                <div style={{fontSize:12,fontWeight:600,color:'var(--text-h)',lineHeight:1.3}}>{art.title}</div>
              </a>
            ))}
          </div>
        </div>
      </>
    ),
    noticias: (
      <>
        {ciudadInteligente}
        <div className="db-rc" style={{flex:1,display:'flex',flexDirection:'column',minHeight:0}}>
          <div className="db-card-header" style={{marginBottom:10,flexShrink:0}}>
            <span className="db-card-title">Categorías</span>
          </div>
          <div style={{display:'flex',flexDirection:'column',gap:7,flex:1}}>
            {CAT_OPTIONS.map((opt)=>(
              <div key={opt.value} style={{
                padding:'8px 12px', borderRadius:9, background:`var(--active-bg)`, border:`1px solid var(--sep)`,
              }}>
                <div style={{fontSize:12.5,fontWeight:700,color:'var(--accent)'}}>{opt.label}</div>
              </div>
            ))}
          </div>
        </div>
      </>
    ),
  };

  // Derived peak hour from hourData
  const peakHourItem = [...hourData].sort((a,b) => b.criticidad - a.criticidad)[0];
  const peakHour = peakHourItem ? peakHourItem.hora : null;

  /* ══ COL-L: Contenido Principal ══ */
  const inicioLeft = (
    <div style={{display:'flex', flexDirection:'column', gap: '20px', height: '100%', overflowY: 'auto', paddingRight: '10px'}}>
      
      {/* Stats Bar */}
      <div style={{display:'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '15px'}}>
        <div className="db-card" style={{padding: '15px'}}>
          <div style={{fontSize: '11px', color: 'var(--text-dim)', textTransform: 'uppercase', fontWeight: 700}}>Vehículos Detectados</div>
          <div style={{fontSize: '24px', fontWeight: 800, color: 'var(--accent)'}}>
            {comunaData.reduce((acc,curr) => acc + curr.intensidad, 0).toLocaleString()}
          </div>
          <div style={{fontSize: '10px', color: '#00C896'}}>↑ 12% flujo hoy</div>
        </div>
        <div className="db-card" style={{padding: '15px'}}>
          <div style={{fontSize: '11px', color: 'var(--text-dim)', textTransform: 'uppercase', fontWeight: 700}}>Velocidad Promedio</div>
          <div style={{fontSize: '24px', fontWeight: 800, color: '#ffb700'}}>
            {(comunaData.reduce((acc,curr) => acc + curr.velocidad_km_h, 0) / (comunaData.length || 1)).toFixed(1)} km/h
          </div>
          <div style={{fontSize: '10px', color: '#ff4d4d'}}>↓ 5% congestión</div>
        </div>
        <div className="db-card" style={{padding: '15px'}}>
          <div style={{fontSize: '11px', color: 'var(--text-dim)', textTransform: 'uppercase', fontWeight: 700}}>Nivel de Tráfico</div>
          <div style={{fontSize: '24px', fontWeight: 800, color: '#ff4d4d'}}>
            {(comunaData.reduce((acc,curr) => acc + curr.criticidad, 0) / (comunaData.length || 1)).toFixed(2)}
          </div>
          <div style={{fontSize: '10px', color: 'var(--text-dim)'}}>Riesgo Moderado</div>
        </div>
      </div>

      {/* Main Analysis Section: Map + Table */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '20px', minHeight: '480px' }}>
        
        {/* Interactive 3D Map */}
        <div className="db-card" style={{ padding: '15px', display: 'flex', flexDirection: 'column', position: 'relative' }}>
          <div style={{ padding: '0 5px 10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h2 style={{ fontSize: '16px', fontWeight: 700, margin: 0 }}>Geovisor 3D de Movilidad</h2>
              <div style={{ fontSize: '11px', color: 'var(--text-dim)' }}>Mapbox GL JS + Deck.gl</div>
            </div>
            
            {/* Filter Controls Bar */}
            <div style={{ display: 'flex', gap: '8px', background: 'rgba(255,255,255,0.05)', padding: '4px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)' }}>
                <button 
                    onClick={() => setFilterType('all')}
                    style={{ padding: '6px 12px', fontSize: '10px', borderRadius: '8px', border: 'none', cursor: 'pointer', background: filterType === 'all' ? 'var(--accent)' : 'transparent', color: filterType === 'all' ? 'black' : 'white', fontWeight: 700, transition: 'all 0.3s' }}
                >TODOS</button>
                <button 
                    onClick={() => setFilterType('corridors')}
                    style={{ padding: '6px 12px', fontSize: '10px', borderRadius: '8px', border: 'none', cursor: 'pointer', background: filterType === 'corridors' ? '#ff3366' : 'transparent', color: 'white', fontWeight: 700, transition: 'all 0.3s' }}
                >PEOR DESEMPEÑO</button>
                <button 
                    onClick={() => setFilterType('hour')}
                    style={{ padding: '6px 12px', fontSize: '10px', borderRadius: '8px', border: 'none', cursor: 'pointer', background: filterType === 'hour' ? '#ffb700' : 'transparent', color: 'black', fontWeight: 700, transition: 'all 0.3s' }}
                >HORARIO CRÍTICO</button>
            </div>
          </div>
          <div style={{ flex: 1 }}>
            <MobilityMap 
                data={comunaData} 
                corridors={corridors} 
                filterType={filterType} 
                peakHour={peakHour}
            />
          </div>
        </div>

        {/* Top Corridors Table */}
        <div className="db-card" style={{ padding: '20px', display: 'flex', flexDirection: 'column' }}>
          <h2 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '15px' }}>Top Corredores Críticos</h2>
          <div className="db-table-wrap" style={{ flex: 1, overflowY: 'auto' }}>
            <table className="db-table">
              <thead>
                <tr>
                  <th style={{ fontSize: '11px' }}>Corredor</th>
                  <th style={{ textAlign: 'right', fontSize: '11px' }}>Velocidad</th>
                  <th style={{ textAlign: 'right', fontSize: '11px' }}>Índice</th>
                </tr>
              </thead>
              <tbody>
                {corridors.length === 0 ? (
                    <tr><td colSpan="3" style={{textAlign:'center', padding: '20px', color: 'var(--text-dim)'}}>Analizando corredores...</td></tr>
                ) : corridors.map((c, i) => (
                  <tr key={i}>
                    <td style={{ fontWeight: 600, fontSize: '12px' }}>{c.corredor}</td>
                    <td style={{ textAlign: 'right', fontSize: '12px' }}>{c.velocidad_km_h.toFixed(1)} <small>km/h</small></td>
                    <td style={{ textAlign: 'right' }}>
                      <span className={`db-rate-pill ${c.criticidad > 1.8 ? 'high' : 'low'}`} style={{ fontSize: '10px', padding: '2px 6px' }}>
                        {c.criticidad.toFixed(2)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );

  const noticiasLeft = (
    <div className="db-card" style={{flex:1,display:'flex',flexDirection:'column',overflow:'hidden',padding:0}}>
      <div style={{padding:'18px 22px 14px',flexShrink:0}}>
        <div className="db-card-title">Actualidad y Movilidad</div>
        <div className="db-card-subtitle">Últimas noticias de la red vial y transporte</div>
      </div>
      <div style={{flex:1,overflowY:'auto',padding:'0 22px 18px'}}>
         {topNoticias.map((art,i)=>(
          <a key={i} href={art.url} target="_blank" rel="noreferrer" className="db-news-item">
            <div className="db-news-source">{art.source || 'Medellín'}</div>
            <div className="db-news-title">{art.title || 'Sin titular'}</div>
            {art.description && <div className="db-news-desc">{art.description}</div>}
          </a>
        ))}
      </div>
    </div>
  );

  const leftMap = {
    inicio:    inicioLeft,
    noticias:  noticiasLeft,
  };

  return (
    <DashboardLayout
      user={user} navItems={NAV} activeItem={mod}
      onSelect={setMod} onLogout={handleLogout}
      pageTitleAccent={m.accent} pageTitle={m.title} pageSubtitle={m.subtitle}
      breadcrumb={`Ciudadano / ${m.title}`}
      colL={leftMap[mod]} colR={rightColByMod[mod]}
    />
  );
}
