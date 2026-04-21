// src/pages/CiudadanoDashboard.jsx
import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import authService from '@/services/authService';
import { llmService } from '@/services/llmService';
import newsService from '@/services/newsService';
import { datasetsService } from '@/services/datasetsService';

import DashboardLayout, { Icons, TabBar, StyledSelect } from '@/components/dashboard/DashboardLayout';
import MapaLeafletComunas from '@/components/MapaLeafletComunas';

const NAV = [
  { id: 'inicio',    label: 'Inicio',        icon: <Icons.Dashboard /> },
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

const SUGERENCIAS_SEG = [
  '¿Cuál es el barrio más seguro para vivir?',
  'Quiero ir a trotar por La Candelaria, ¿es seguro?',
  'Compara la seguridad entre Laureles y Buenos Aires',
  '¿Cuáles son las zonas más peligrosas?',
];

/* ════════════════════════════════
   CHATBOT SEGURIDAD — solo chat, sin cards extra
════════════════════════════════ */
function ChatSeguridad() {
  const [messages, setMessages] = useState([{
    role:'bot',
    text:'¡Hola! Soy el Guardián, tu asistente de seguridad de Medellín. Pregúntame sobre cualquier barrio o zona.',
  }]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior:'smooth' }); }, [messages, loading]);

  const enviar = async (texto) => {
    const prompt = texto.trim();
    if (!prompt || loading) return;
    setInput('');
    setMessages(prev => [...prev, { role:'user', text:prompt }]);
    setLoading(true);
    try {
      const res = await llmService.securityChat({ prompt });
      const data = res?.data;
      setMessages(prev => [...prev, {
        role:'bot',
        text: data?.output || 'No pude obtener una respuesta.',
        mapa: data?.mostrar_mapa ? data?.datos_mapa : null,
        destacadas: data?.comunas_destacadas || [],
      }]);
    } catch {
      setMessages(prev => [...prev, { role:'bot', text:'Error al consultar los datos. Intenta de nuevo.' }]);
    } finally { setLoading(false); }
  };

  return (
    <div className="db-chat-wrap">
      <div className="db-chat-messages">
        {messages.map((msg, i) => (
          <div key={i} className={`db-msg ${msg.role}`}>
            <div className="db-msg-bubble">
              {msg.text}
              {msg.role==='bot' && msg.mapa?.length > 0 && (
                <MapaLeafletComunas comunas={msg.mapa} destacadas={msg.destacadas} />
              )}
            </div>
          </div>
        ))}
        {loading && (
          <div className="db-msg bot">
            <div className="db-chat-typing">
              <div className="db-typing-dot"/><div className="db-typing-dot"/><div className="db-typing-dot"/>
            </div>
          </div>
        )}
        <div ref={bottomRef}/>
      </div>
      {messages.length <= 1 && (
        <div className="db-chat-suggestions">
          {SUGERENCIAS_SEG.map((s,i) => (
            <button key={i} className="db-suggestion" onClick={() => enviar(s)} disabled={loading}>{s}</button>
          ))}
        </div>
      )}
      <div className="db-chat-input-area">
        <input
          className="db-chat-input" type="text" value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => { if(e.key==='Enter' && !e.shiftKey){ e.preventDefault(); enviar(input); }}}
          placeholder="Pregunta sobre un barrio o zona..." disabled={loading}
        />
        <button className="db-chat-send" onClick={() => enviar(input)} disabled={loading || !input.trim()}>
          Enviar
        </button>
      </div>
    </div>
  );
}

/* ════════════════════════════════
   NOTICIAS WIDGET (styled)
════════════════════════════════ */
function NoticiasWidget({ limit = 5 }) {
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState('general');
  const cache = useRef({});

  useEffect(() => {
    const load = async () => {
      if (cache.current[category]) { setArticles(cache.current[category]); setLoading(false); return; }
      setLoading(true);
      try {
        const res = await newsService.getMedellinNews(limit, category);
        const arts = res?.data || [];
        setArticles(arts); cache.current[category] = arts;
      } catch { setArticles([]); }
      finally { setLoading(false); }
    };
    load();
  }, [category, limit]);

  return (
    <div style={{ display:'flex', flexDirection:'column', height:'100%' }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:14 }}>
        <div>
          <div className="db-card-title">Noticias</div>
          <div className="db-card-subtitle">Fuentes verificadas · Medellín</div>
        </div>
        <StyledSelect value={category} onChange={setCategory} options={CAT_OPTIONS} className="db-sel--news" />
      </div>
      <div style={{ overflowY:'auto', flex:1 }}>
        {loading ? (
          <div style={{color:'var(--text-dim)',fontSize:13}}>Cargando noticias...</div>
        ) : articles.length === 0 ? (
          <div style={{color:'var(--text-dim)',fontSize:13}}>Sin noticias disponibles.</div>
        ) : articles.slice(0,limit).map((art,i) => (
          <a key={i} href={art.url} target="_blank" rel="noreferrer" className="db-news-item">
            <div className="db-news-source">{art.source || 'Medellín'}</div>
            <div className="db-news-title">{art.title || 'Sin titular'}</div>
            {art.description && <div className="db-news-desc">{art.description}</div>}
          </a>
        ))}
      </div>
    </div>
  );
}

/* ════════════════════════════════
   CRIMINALIDAD TABLE (styled)
════════════════════════════════ */
function CriminalidadWidget() {
  const [data, setData] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sort, setSort] = useState({ key:'tasa_criminalidad', dir:'desc' });

  useEffect(() => {
    Promise.all([datasetsService.getCriminalidadData(), datasetsService.getCriminalidadSummary()])
      .then(([dr,sr]) => {
        if(dr.success) setData(dr.data);
        if(sr.success) setSummary(sr.data);
      }).finally(() => setLoading(false));
  }, []);

  const toggle = (key) => setSort(s => ({ key, dir: s.key===key && s.dir==='asc' ? 'desc' : 'asc' }));
  const sorted = [...data].sort((a,b) => {
    const av=a[sort.key], bv=b[sort.key];
    if(typeof av==='string') return sort.dir==='asc' ? av.localeCompare(bv) : bv.localeCompare(av);
    return sort.dir==='asc' ? av-bv : bv-av;
  });
  const avg = summary?.tasa_promedio || 0;

  if(loading) return <div style={{color:'var(--text-dim)',fontSize:13,padding:'12px 0'}}>Cargando datos...</div>;

  return (
    <div style={{display:'flex',flexDirection:'column',gap:14}}>
      {summary && (
        <div className="db-stat-row db-stat-row--4">
          {[
            {label:'Comunas', value:summary.total_comunas},
            {label:'Casos totales', value:`${(summary.total_casos/1000).toFixed(1)}k`, cls:'red'},
            {label:'Tasa promedio', value:Number(summary.tasa_promedio).toFixed(1)},
            {label:'Más afectada', value:summary.comuna_mas_afectada, small:true},
          ].map((s,i) => (
            <div key={i} className="db-stat-item">
              <div className="db-stat-label">{s.label}</div>
              <div className={`db-stat-value ${s.cls||''}`} style={s.small?{fontSize:13,marginTop:3}:{}}>{s.value}</div>
            </div>
          ))}
        </div>
      )}
      <div className="db-table-wrap">
        <table className="db-table">
          <thead>
            <tr>
              <th>
                <button type="button" className="db-th-sort-btn" onClick={() => toggle('nombre')} aria-label="Ordenar por comuna">
                  Comuna {sort.key==='nombre'?(sort.dir==='asc'?'↑':'↓'):''}
                </button>
              </th>
              <th style={{textAlign:'right'}}>
                <button type="button" className="db-th-sort-btn right" onClick={() => toggle('total_casos')} aria-label="Ordenar por casos">
                  Casos {sort.key==='total_casos'?(sort.dir==='asc'?'↑':'↓'):''}
                </button>
              </th>
              <th style={{textAlign:'right'}}>
                <button type="button" className="db-th-sort-btn right" onClick={() => toggle('tasa_criminalidad')} aria-label="Ordenar por tasa de criminalidad">
                  Tasa /100k {sort.key==='tasa_criminalidad'?(sort.dir==='asc'?'↑':'↓'):''}
                </button>
              </th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((item,i) => (
              <tr key={i}>
                <td>{item.nombre}</td>
                <td style={{textAlign:'right'}}>{item.total_casos?.toLocaleString('es-CO')}</td>
                <td style={{textAlign:'right'}}>
                  <span className={`db-rate-pill ${item.tasa_criminalidad > avg ? 'high' : 'low'}`}>
                    {Number(item.tasa_criminalidad).toFixed(2)}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ════════════════════════════════
   CIUDADANO DASHBOARD
════════════════════════════════ */
export default function CiudadanoDashboard() {
  const navigate = useNavigate();
  const [user, setUser]       = useState(null);
  const [loading, setLoading] = useState(true);
  const [mod, setMod]         = useState('inicio');
  const [segTab, setSegTab]   = useState('chatbot');
  const [showChat, setShowChat] = useState(true);

  // Datos para página de inicio
  const [crimiSummary, setCrimiSummary] = useState(null);
  const [topNoticias, setTopNoticias]   = useState([]);

  useEffect(() => {
    authService.getMe().then(setUser).catch(() => navigate('/login')).finally(() => setLoading(false));
  }, [navigate]);

  // Carga datos de inicio
  useEffect(() => {
    datasetsService.getCriminalidadSummary()
      .then(r => { if(r.success) setCrimiSummary(r.data); })
      .catch(() => {});
    newsService.getMedellinNews(6, 'general')
      .then(r => setTopNoticias(Array.isArray(r) ? r : (r?.data || r?.articles || r?.items || [])))
      .catch(() => {});
  }, []);

  const handleLogout = () => { authService.logout(); navigate('/login'); };

  if(loading) return <div className="db-loading"><div className="db-spinner"/>Cargando tu ciudad…</div>;
  if(!user) return null;

  const firstName = user.full_name?.split(' ')[0] || 'Usuario';

  const META = {
    inicio:    { accent:'Hola,', title:firstName,          subtitle:'Vista general de tu ciudad en tiempo real' },
    noticias:  { accent:'',      title:'Noticias',         subtitle:'Actualidad de Medellín filtrada por categoría' },
  };
  const m = META[mod];

  /* ══ Bloque Ciudad Inteligente (compartido) ══ */
  const ciudadInteligente = (
    <div className="db-rc db-card-note" style={{flexShrink:0}}>
      <div className="db-card-header">
        <span className="db-card-title">Ciudad Inteligente</span>
      </div>
      <div className="db-note-body">
        GEOMED integra <b>datos reales</b> de Medellín: seguridad, servicios públicos y noticias en tiempo real.
      </div>
      <div className="db-note-footer">
        <span className="db-note-time">Medellín · Valle de Aburrá</span>
        <div className="db-note-badge"><span className="ck">✓</span> Conectado</div>
      </div>
    </div>
  );

  /* ══ Bloque seguridad resumen (con tooltip) ══ */
  const seguridadResumen = crimiSummary ? (
    <div className="db-rc" style={{flexShrink:0}}>
      <div className="db-card-header" style={{marginBottom:10}}>
        <span className="db-card-title">Seguridad · Resumen</span>
      </div>
      <div className="db-mini-stats-grid">
        {[
          {label:'Comunas',       value:crimiSummary.total_comunas, tooltip:'Total de comunas con datos de criminalidad disponibles'},
          {label:'Casos totales', value:`${(crimiSummary.total_casos/1000).toFixed(0)}k`, cls:'red', tooltip:'Total de casos reportados en todas las comunas'},
          {label:'Tasa promedio', value:Number(crimiSummary.tasa_promedio).toFixed(1), tooltip:'Casos por cada 100.000 habitantes (promedio ciudad)'},
          {label:'+ afectada',    value:crimiSummary.comuna_mas_afectada, small:true, tooltip:'Comuna con mayor número de casos reportados'},
        ].map((s,i)=>(
          <div key={i} className="db-stat-item" data-tooltip={s.tooltip}>
            <div className="db-stat-label">{s.label}</div>
            <div className={`db-stat-value ${s.cls||''}`} style={s.small?{fontSize:12,marginTop:3}:{fontSize:18}}>{s.value}</div>
          </div>
        ))}
      </div>
    </div>
  ) : null;

  /* ══ COL-R dinámico por módulo ══ */
  const rightColByMod = {
    inicio: (
      <>
        {ciudadInteligente}
        {seguridadResumen}
        <div className="db-rc" style={{flex:1,display:'flex',flexDirection:'column',overflow:'hidden'}}>
          <div className="db-card-header" style={{marginBottom:10}}>
            <span className="db-card-title">Noticias recientes</span>
          </div>
          <div style={{overflowY:'auto',flex:1}}>
            {topNoticias.length === 0 ? (
              <div style={{fontSize:12,color:'var(--text-dim)'}}>Cargando noticias...</div>
            ) : topNoticias.map((art,i)=>(
              <a key={i} href={art.url} target="_blank" rel="noreferrer"
                style={{display:'block',marginBottom:10,textDecoration:'none',paddingBottom:10,borderBottom:'1px solid var(--sep)'}}
              >
                <div style={{fontSize:10,fontWeight:700,letterSpacing:'.04em',textTransform:'uppercase',color:'var(--accent)',marginBottom:3}}>{art.source||'Medellín'}</div>
                <div style={{fontSize:13,fontWeight:600,color:'var(--text-h)',lineHeight:1.35}}>{art.title}</div>
              </a>
            ))}
          </div>
        </div>
      </>
    ),
    seguridad: null, // full-width
    noticias: (
      <>
        {ciudadInteligente}
        {seguridadResumen}
      </>
    ),
  };
  const rightCol = rightColByMod[mod];

  /* ══ COL-L: contenido principal según módulo ══ */

  // ── INICIO: overview con datos ──
  const inicioLeft = (
    <>
      

      {/* Pills de acceso rápido */}
      <div className="db-filter-bar" style={{flexShrink:0}}>
        <button type="button" className="db-fpill" onClick={() => setMod('noticias')}>Noticias</button>
      </div>

      {/* Módulos disponibles */}
      <div className="db-modules-grid" style={{flexShrink:0}}>
        {[
          { icon:<Icons.News/>, title:'Noticias',      desc:'Noticias verificadas de Medellín filtradas por categoría en tiempo real.', action:()=>setMod('noticias') },
        ].map((item,i)=>(
          <button key={i} type="button" className="db-card db-card-action" onClick={item.action}
            aria-label={`Abrir módulo ${item.title}`}
            style={{cursor:'pointer',padding:'16px 18px',display:'flex',alignItems:'flex-start',gap:14,textAlign:'left'}}
          >
            <div style={{width:38,height:38,borderRadius:10,background:'var(--active-bg)',display:'flex',alignItems:'center',justifyContent:'center',color:'var(--accent)',flexShrink:0}}>
              {item.icon}
            </div>
            <div>
              <div style={{fontSize:14,fontWeight:700,color:'var(--text-h)',marginBottom:4}}>{item.title}</div>
              <div style={{fontSize:12.5,color:'var(--text-mid)',lineHeight:1.5}}>{item.desc}</div>
              <div style={{fontSize:11,color:'var(--accent)',fontWeight:600,marginTop:6}}>Abrir módulo →</div>
            </div>
          </button>
        ))}
      </div>
    </>
  );

  // ── SEGURIDAD: solo chatbot y tabla, sin cards extra ──
  const seguridadLeft = (
    <div className="db-card" style={{flex:1,display:'flex',flexDirection:'column',overflow:'hidden'}}>
      <TabBar
        tabs={[
          {id:'chatbot',      label:'Chatbot Guardián'},
        ]}
        active={segTab} onChange={setSegTab}
      />
      {segTab === 'chatbot' ? (
        /* Solo el chat, sin padding extra */
        <div style={{flex:1,display:'flex',flexDirection:'column',overflow:'hidden'}}>
          <ChatSeguridad/>
        </div>
      ) : (
        <div className="db-tab-content" style={{flex:1,overflow:'auto'}}>
          <CriminalidadWidget/>
        </div>
      )}
    </div>
  );

  // ── NOTICIAS: solo noticias ──
  const noticiasLeft = (
    <div className="db-card" style={{flex:1,display:'flex',flexDirection:'column',overflow:'hidden',padding:0}}>
      <div style={{padding:'18px 22px 14px',flexShrink:0}}>
        <div className="db-card-title">Noticias de Medellín</div>
        <div className="db-card-subtitle">Fuentes verificadas · Filtradas por categoría</div>
      </div>
      <div style={{flex:1,overflowY:'auto',padding:'0 22px 18px'}}>
        <NoticiasWidget limit={8}/>
      </div>
    </div>
  );

  const leftMap = {
    inicio:    inicioLeft,
    seguridad: seguridadLeft,
    noticias:  noticiasLeft,
  };

  return (
    <DashboardLayout
      user={user} navItems={NAV} activeItem={mod}
      onSelect={setMod} onLogout={handleLogout}
      pageTitleAccent={m.accent} pageTitle={m.title} pageSubtitle={m.subtitle}
      breadcrumb={`Ciudadano / ${m.title}`}
      colL={leftMap[mod]} colR={rightCol}
    />
  );
}
