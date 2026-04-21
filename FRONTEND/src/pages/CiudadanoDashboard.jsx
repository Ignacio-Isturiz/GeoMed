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
  { id: 'seguridad', label: 'Seguridad',     icon: <Icons.Shield />, chatbot:true },
  { id: 'servicios', label: 'Servicios EPM', icon: <Icons.Bolt /> },
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
   ANALIZADOR FACTURA (styled)
════════════════════════════════ */
function AnalizadorWidget() {
  const [images, setImages] = useState([]);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef(null);

  const addFiles = (files) => {
    const valid = Array.from(files).filter(f => f.type.startsWith('image/'));
    if (!valid.length) { setError('Solo se aceptan imágenes JPG, PNG, WEBP.'); return; }
    setError(null); setResult(null);
    setImages(prev => {
      const next = [...prev, ...valid.map(f => ({ file:f, preview:URL.createObjectURL(f) }))];
      if(next.length > 6) { setError('Máximo 6 imágenes.'); return prev; }
      return next;
    });
  };

  const analyze = async () => {
    if(!images.length) return;
    setLoading(true); setError(null);
    try {
      const res = await llmService.analyzeFactura(images.map(i => i.file));
      setResult(res.data);
    } catch { setError('No se pudo analizar. Intenta de nuevo.'); }
    finally { setLoading(false); }
  };

  const reset = () => { setImages([]); setResult(null); setError(null); };

  if(result) return (
    <div style={{display:'flex',flexDirection:'column',gap:10,overflowY:'auto'}}>
      <div className="db-result-block">
        <div className="db-result-label">Resumen</div>
        <div className="db-result-text">{result.resumen}</div>
        {result.datos_extraidos && (
          <div className="db-result-tags">
            {Object.entries(result.datos_extraidos).map(([k,v]) => v && (
              <span key={k} className="db-result-tag"><b>{k.replace('_',' ')}:</b> {v}</span>
            ))}
          </div>
        )}
      </div>
      {result.recomendaciones?.length > 0 && (
        <div className="db-result-block recs">
          <div className="db-result-label">Recomendaciones de ahorro</div>
          <ul>{result.recomendaciones.map((r,i)=><li key={i}>{r}</li>)}</ul>
        </div>
      )}
      {result.prediccion && (
        <div className="db-result-block pred">
          <div className="db-result-label">Predicción próxima factura</div>
          <div className="db-pred-values">
            <div className="db-pred-val">
              <div className="db-pred-num">{result.prediccion.valor_estimado}</div>
              <div className="db-pred-lbl">estimado</div>
            </div>
            <div className="db-pred-val">
              <div className="db-pred-num">{result.prediccion.ahorro_estimado}</div>
              <div className="db-pred-lbl">ahorro posible</div>
            </div>
          </div>
          <div className="db-pred-expl">{result.prediccion.explicacion}</div>
        </div>
      )}
      <button className="db-btn-secondary" onClick={reset}>Analizar otra factura</button>
    </div>
  );

  return (
    <div style={{display:'flex',flexDirection:'column',gap:12}}>
      <div
        className={`db-drop-zone${dragging?' dragging':''}`}
        onDragOver={e=>{e.preventDefault();setDragging(true)}}
        onDragLeave={()=>setDragging(false)}
        onDrop={e=>{e.preventDefault();setDragging(false);addFiles(e.dataTransfer.files)}}
        onClick={()=>inputRef.current?.click()}
      >
        <input ref={inputRef} type="file" accept="image/*" multiple style={{display:'none'}} onChange={e=>addFiles(e.target.files)}/>
        <div className="db-drop-icon">📄</div>
        <div className="db-drop-text">Arrastra o <span className="db-drop-link">haz clic para agregar</span> fotos de tu factura</div>
        <div className="db-drop-hint">Energía · Acueducto · Gas · JPG, PNG, WEBP · Máx. 6</div>
      </div>
      {images.length > 0 && (
        <div className="db-img-preview-grid">
          {images.map((img,i) => (
            <div key={i} className="db-img-preview">
              <img src={img.preview} alt={`Pág ${i+1}`}/>
              <button className="db-img-remove" onClick={()=>setImages(p=>p.filter((_,j)=>j!==i))}>✕</button>
            </div>
          ))}
        </div>
      )}
      {error && <div style={{background:'rgba(239,68,68,.10)',border:'1px solid rgba(239,68,68,.22)',borderRadius:9,padding:'9px 13px',fontSize:13,color:'#fca5a5'}}>{error}</div>}
      {loading && <div style={{fontSize:13,color:'var(--text-dim)',textAlign:'center'}}>Procesando con GPT-4o Vision...</div>}
      {images.length > 0 && (
        <button className="db-btn-analyze" onClick={analyze} disabled={loading}>
          {loading ? 'Analizando...' : `Analizar ${images.length} imagen${images.length>1?'es':''}`}
        </button>
      )}
      {images.length > 0 && !loading && (
        <button className="db-btn-secondary" onClick={reset}>Limpiar</button>
      )}
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
    seguridad: { accent:'',      title:'Seguridad',        subtitle:'Chatbot Guardián y criminalidad por zona' },
    servicios: { accent:'',      title:'Servicios Públicos',subtitle:'Análisis de facturas EPM con inteligencia artificial' },
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
        MECIA integra <b>datos reales</b> de Medellín: seguridad, servicios públicos y noticias en tiempo real.
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
    servicios: (
      <>
        {ciudadInteligente}
        <div className="db-rc" style={{flex:1,display:'flex',flexDirection:'column',minHeight:0}}>
          <div className="db-card-header" style={{marginBottom:10,flexShrink:0}}>
            <span className="db-card-title">Cómo usar el analizador</span>
          </div>
          <div style={{fontSize:13,color:'var(--text-mid)',lineHeight:1.7,display:'flex',flexDirection:'column',gap:10,flex:1}}>
            {[
              {step:'1', txt:'Toma fotos claras de tu factura EPM'},
              {step:'2', txt:'Arrastra o sube hasta 6 imágenes (JPG, PNG, WEBP)'},
              {step:'3', txt:'La IA analiza el consumo y detecta anomalías'},
              {step:'4', txt:'Recibe recomendaciones de ahorro personalizadas'},
              {step:'5', txt:'Obtén predicción de tu próxima factura'},
            ].map(({step,txt})=>(
              <div key={step} style={{display:'flex',gap:10,alignItems:'flex-start'}}>
                <div style={{width:22,height:22,borderRadius:6,background:'var(--active-bg)',border:'1px solid var(--active-bd)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:11,fontWeight:700,color:'var(--accent)',flexShrink:0}}>{step}</div>
                <span style={{fontSize:12.5,lineHeight:1.5}}>{txt}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="db-rc" style={{flex:1,display:'flex',flexDirection:'column',minHeight:0}}>
          <div className="db-card-header" style={{marginBottom:10,flexShrink:0}}>
            <span className="db-card-title">Tarifas EPM · Referencia</span>
          </div>
          <div className="db-tarifas-grid" style={{flex:1,minHeight:0}}>
            {[
              {servicio:'Energía', icon:'⚡', color:'#d97706', estratos:[
                {e:'E1–2', rango:'$45k–$90k'},
                {e:'E3–4', rango:'$90k–$140k'},
                {e:'E5–6', rango:'$140k–$200k'},
              ]},
              {servicio:'Acueducto', icon:'💧', color:'#60a5fa', estratos:[
                {e:'E1–2', rango:'$20k–$40k'},
                {e:'E3–4', rango:'$40k–$60k'},
                {e:'E5–6', rango:'$60k–$80k'},
              ]},
              {servicio:'Gas', icon:'🔥', color:'#f87171', estratos:[
                {e:'E1–2', rango:'$15k–$25k'},
                {e:'E3–4', rango:'$25k–$40k'},
                {e:'E5–6', rango:'$40k–$60k'},
              ]},
            ].map(({servicio,icon,color,estratos})=>(
              <div key={servicio} style={{display:'flex',flexDirection:'column',gap:5}}>
                <div style={{display:'flex',alignItems:'center',gap:5,paddingBottom:5,borderBottom:'1px solid var(--sep)'}}>
                  <span style={{fontSize:13}}>{icon}</span>
                  <span style={{fontSize:11,fontWeight:700,color:'var(--text-h)'}}>{servicio}</span>
                </div>
                {estratos.map(({e,rango})=>(
                  <div key={e} style={{background:'var(--active-bg)',borderRadius:6,padding:'5px 7px'}}>
                    <div style={{fontSize:10,color:'var(--text-dim)',marginBottom:2}}>{e}</div>
                    <div style={{fontSize:11.5,fontWeight:700,color,lineHeight:1.2}}>{rango}</div>
                  </div>
                ))}
              </div>
            ))}
          </div>
          <div style={{fontSize:10,color:'var(--text-dim)',borderTop:'1px solid var(--sep)',paddingTop:7,marginTop:8,lineHeight:1.5,flexShrink:0}}>
            Valores estimados por estrato · sube tu factura para análisis exacto.
          </div>
        </div>
      </>
    ),
    noticias: (
      <>
        {ciudadInteligente}
        {seguridadResumen}
        <div className="db-rc" style={{flex:1,display:'flex',flexDirection:'column',minHeight:0}}>
          <div className="db-card-header" style={{marginBottom:10,flexShrink:0}}>
            <span className="db-card-title">Categorías disponibles</span>
          </div>
          <div style={{display:'flex',flexDirection:'column',gap:7,flex:1}}>
            {[
              {v:'general',        label:'General',        color:'#00C896', desc:'Noticias generales de la ciudad'},
              {v:'seguridad',      label:'Seguridad',      color:'#f87171', desc:'Orden público y convivencia'},
              {v:'emprendimiento', label:'Emprendimiento', color:'#60a5fa', desc:'Economía, startups y negocios'},
              {v:'movilidad',      label:'Movilidad',      color:'#a78bfa', desc:'Metro, tranvía y transporte'},
              {v:'salud',          label:'Salud',          color:'#34d399', desc:'Salud pública y bienestar'},
              {v:'economia',       label:'Economía',       color:'#d97706', desc:'Indicadores y mercado laboral'},
            ].map(({v,label,color,desc})=>(
              <div key={v} style={{
                flex:1, display:'flex', alignItems:'center', gap:10,
                padding:'6px 10px', borderRadius:9,
                background:`${color}10`, border:`1px solid ${color}25`,
                cursor:'default', minHeight:0,
              }}>
                <div style={{width:7,height:7,borderRadius:'50%',background:color,flexShrink:0}}/>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontSize:12.5,fontWeight:700,color,lineHeight:1.1}}>{label}</div>
                  <div style={{fontSize:10.5,color:'var(--text-dim)',lineHeight:1.2,marginTop:1}}>{desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </>
    ),
  };
  const rightCol = rightColByMod[mod];

  /* ══ COL-L: contenido principal según módulo ══ */

  // ── INICIO: overview con datos ──
  const inicioLeft = (
    <>
      {/* Stats de criminalidad */}
      {crimiSummary && (
        <div className="db-stat-row db-stat-row--4" style={{flexShrink:0}}>
          {[
            {label:'Comunas con datos',  value:crimiSummary.total_comunas, tooltip:'Número de comunas de Medellín con datos de criminalidad disponibles'},
            {label:'Casos registrados',  value:`${(crimiSummary.total_casos/1000).toFixed(1)}k`, cls:'red', tooltip:'Total de casos delictivos registrados en toda la ciudad'},
            {label:'Tasa por 100k hab.', value:Number(crimiSummary.tasa_promedio).toFixed(1), tooltip:'Promedio de casos por cada 100.000 habitantes en Medellín'},
            {label:'Comuna más afectada',value:crimiSummary.comuna_mas_afectada, small:true, tooltip:'La comuna con más casos de criminalidad registrados'},
          ].map((s,i)=>(
            <div key={i} className="db-stat-item" data-tooltip={s.tooltip}>
              <div className="db-stat-label">{s.label}</div>
              <div className={`db-stat-value ${s.cls||''}`} style={s.small?{fontSize:12,marginTop:3}:{fontSize:20}}>{s.value}</div>
            </div>
          ))}
        </div>
      )}

      {/* Pills de acceso rápido */}
      <div className="db-filter-bar" style={{flexShrink:0}}>
        <button type="button" className="db-fpill" onClick={() => setMod('seguridad')}><span className="db-dot"/>Seguridad</button>
        <button type="button" className="db-fpill" onClick={() => setMod('servicios')}>Servicios EPM</button>
        <button type="button" className="db-fpill" onClick={() => setMod('noticias')}>Noticias</button>
        <button className="db-btn-primary" onClick={() => setMod('seguridad')}>Consultar Guardián →</button>
      </div>

      {/* Seguridad + Explorar Medellín */}
      <div className="db-inicio-split" style={{flex:1,overflow:'hidden',minHeight:0}}>
        {/* Guardián preview */}
        <div className="db-card" style={{display:'flex',flexDirection:'column',gap:14,overflow:'hidden'}}>
          <div className="db-card-header" style={{marginBottom:0}}>
            <div>
              <div className="db-card-title">Guardián · Asistente de Seguridad</div>
              <div className="db-card-subtitle">Consulta sobre barrios, zonas y criminalidad en Medellín</div>
            </div>
            <div style={{background:'var(--active-bg)',border:'1px solid var(--active-bd)',borderRadius:6,padding:'3px 8px',fontSize:11,fontWeight:700,color:'var(--accent)'}}>IA</div>
          </div>
          <div style={{fontSize:13,color:'var(--text-mid)',lineHeight:1.7}}>
            El Guardián analiza datos reales de criminalidad por comunas y te ayuda a tomar decisiones informadas sobre seguridad en la ciudad.
          </div>
          <div style={{display:'flex',flexDirection:'column',gap:8,flex:1}}>
            <div style={{fontSize:11,fontWeight:700,letterSpacing:'.07em',textTransform:'uppercase',color:'var(--text-dim)'}}>
              Puedes preguntarle sobre…
            </div>
            {SUGERENCIAS_SEG.slice(0,3).map((s,i)=>(
              <div key={i} style={{
                padding:'8px 12px',borderRadius:9,background:'var(--card-bg)',
                border:'1px solid var(--card-border)',fontSize:12.5,color:'var(--text-mid)',
                display:'flex',alignItems:'center',gap:8
              }}>
                <span style={{color:'var(--accent)',flexShrink:0}}>›</span>{s}
              </div>
            ))}
          </div>
          <button className="db-btn-primary" style={{marginLeft:0,width:'100%',textAlign:'center'}} onClick={()=>setMod('seguridad')}>
            Abrir Guardián →
          </button>
        </div>

        {/* Explorar Medellín */}
        <div className="db-card" style={{display:'flex',flexDirection:'column',overflow:'hidden'}}>
          <div className="db-card-header" style={{marginBottom:10,flexShrink:0}}>
            <div>
              <div className="db-card-title">Explorar Medellín</div>
              <div className="db-card-subtitle">Zonas recomendadas para visitar</div>
            </div>
          </div>
          <div style={{display:'flex',flexDirection:'column',gap:8,flex:1,minHeight:0}}>
            {[
              { zona:'El Poblado',  desc:'Zona rosa, restaurantes y comercio seguro',   tag:'Turístico',  color:'#00C896' },
              { zona:'Laureles',    desc:'Parques, barrio residencial y gastronomía',    tag:'Familiar',   color:'#3B82F6' },
              { zona:'Envigado',    desc:'Tranquilo, fácil acceso al metro',             tag:'Residencial',color:'#8B5CF6' },
              { zona:'El Centro',   desc:'Historia, museos, Parque Berrío y el Metro',  tag:'Cultural',   color:'#F59E0B' },
            ].map(({zona,desc,tag,color})=>(
              <button key={zona} type="button"
                onClick={()=>setMod('seguridad')}
                style={{
                  flex:1, display:'flex',alignItems:'center',gap:10,padding:'8px 12px',
                  background:'var(--card-bg)',border:'1px solid var(--card-border)',
                  borderRadius:11,cursor:'pointer',textAlign:'left',transition:'all .18s',
                  width:'100%', fontFamily:'inherit', minHeight:0
                }}
                title={`Consultar seguridad de ${zona}`}
              >
                <div style={{width:8,height:8,borderRadius:'50%',background:color,flexShrink:0}} />
                <div style={{flex:1,minWidth:0}}>
                  <div style={{display:'flex',alignItems:'center',gap:6,marginBottom:2}}>
                    <span style={{fontSize:13,fontWeight:700,color:'var(--text-h)'}}>{zona}</span>
                    <span style={{fontSize:9,fontWeight:700,letterSpacing:'.05em',textTransform:'uppercase',color,background:`${color}18`,border:`1px solid ${color}33`,padding:'1px 6px',borderRadius:100,flexShrink:0}}>{tag}</span>
                  </div>
                  <div style={{fontSize:11.5,color:'var(--text-dim)',lineHeight:1.3}}>{desc}</div>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Módulos disponibles */}
      <div className="db-modules-grid" style={{flexShrink:0}}>
        {[
          { icon:<Icons.Bolt/>, title:'Servicios EPM', desc:'Análisis de facturas con IA. Recomendaciones de ahorro y predicción.', action:()=>setMod('servicios') },
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
          {id:'criminalidad', label:'Criminalidad por Comuna'},
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

  // ── SERVICIOS: solo el analizador ──
  const serviciosLeft = (
    <div className="db-card" style={{flex:1,overflowY:'auto'}}>
      <div className="db-card-header">
        <div>
          <div className="db-card-title">Analizador de Factura EPM</div>
          <div className="db-card-subtitle">Sube fotos de tu factura · Recomendaciones + predicción con GPT-4o Vision</div>
        </div>
      </div>
      <div style={{padding:'4px 0'}}>
        <AnalizadorWidget/>
      </div>
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
    servicios: serviciosLeft,
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
