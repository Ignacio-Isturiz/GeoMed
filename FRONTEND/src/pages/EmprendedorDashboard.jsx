// src/pages/EmprendedorDashboard.jsx
import { useEffect, useRef, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import authService from '@/services/authService';
import { llmService } from '@/services/llmService';
import { datasetsService } from '@/services/datasetsService';

import DashboardLayout, { Icons, StyledSelect } from '@/components/dashboard/DashboardLayout';
import ChatMap from '@/components/ChatMap';

const NAV = [
  { id:'inicio',      label:'Inicio',           icon:<Icons.Dashboard/> },
  { id:'emprendedor', label:'Abre Tu Negocio',  icon:<Icons.Rocket/>, chatbot:true },
  { id:'insights',    label:'Inteligencia',     icon:<Icons.Chart/> },
  { id:'negocios',    label:'Negocios',         icon:<Icons.Store/> },
  { id:'cobertura',   label:'Cobertura EPM',    icon:<Icons.Bolt/> },
];

const SUGERENCIAS_EMP = [
  'Quiero montar una cafetería en Medellín',
  '¿Cuántas cafeterías hay en el Poblado?',
  'Negocio de ropa en Aranjuez, estratos 3 y 4',
  '¿Dónde abro una tienda con bajo presupuesto?',
];

/* ════════════════════════════════
   CHATBOT EMPRENDEDOR — solo chat
════════════════════════════════ */
function ChatEmprendedor({ conversationId, onConversationChange }) {
  const [messages, setMessages] = useState([{
    role:'bot',
    text:'¡Hola emprendedor! Soy tu asesor de negocios. Cuéntame tu idea y te ayudo a elegir la mejor zona en Medellín con datos reales.',
  }]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [convId, setConvId] = useState(conversationId);
  const bottomRef = useRef(null);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior:'smooth' }); }, [messages, loading]);

  // Cargar historial cuando cambia conversationId
  useEffect(() => {
    if (conversationId !== convId) {
      setConvId(conversationId);
      if (!conversationId) {
        setMessages([{
          role:'bot',
          text:'¡Hola emprendedor! Soy tu asesor de negocios. Cuéntame tu idea y te ayudo a elegir la mejor zona.',
        }]);
        return;
      }
      llmService.getConversation(conversationId)
        .then(res => { if(res.success && res.data.messages) setMessages(res.data.messages); })
        .catch(() => {});
    }
  }, [conversationId]);

  const enviar = async (texto) => {
    const prompt = texto.trim();
    if (!prompt || loading) return;
    setInput('');
    setMessages(prev => [...prev, { role:'user', text:prompt }]);
    setLoading(true);
    try {
      const res = await llmService.entrepreneurChat({ prompt, conversation_id:convId });
      const data = res?.data;
      if(data?.conversation_id && data.conversation_id !== convId) {
        setConvId(data.conversation_id);
        onConversationChange?.(data.conversation_id);
      }
      setMessages(prev => [...prev, {
        role:'bot',
        text: data?.output || 'No pude procesar tu consulta. Describe mejor tu idea.',
        recomendaciones: data?.recomendaciones_especificas || [],
        costos: data?.prediccion_costo_mensual || {},
        mapData: data?.map_data,
      }]);
    } catch {
      setMessages(prev => [...prev, { role:'bot', text:'Error al procesar. Intenta de nuevo.' }]);
    } finally { setLoading(false); }
  };

  return (
    <div className="db-chat-wrap">
      <div className="db-chat-messages">
        {messages.map((msg,i) => (
          <div key={i} className={`db-msg ${msg.role}`}>
            <div className="db-msg-bubble">
              {msg.text}
              {msg.role==='bot' && msg.costos?.total_servicios && (
                <div className="db-chat-costs">
                  <div style={{fontWeight:600,marginBottom:6,fontSize:11.5,color:'var(--text-mid)',textTransform:'uppercase',letterSpacing:'.05em'}}>
                    Costos mensuales estimados
                  </div>
                  {msg.costos.energia_estimada && (
                    <div className="db-chat-costs-row"><span>Energía</span><span>${msg.costos.energia_estimada.toLocaleString('es-CO')}</span></div>
                  )}
                  {msg.costos.agua_estimada && (
                    <div className="db-chat-costs-row"><span>Agua</span><span>${msg.costos.agua_estimada.toLocaleString('es-CO')}</span></div>
                  )}
                  {msg.costos.gas_estimada && (
                    <div className="db-chat-costs-row"><span>Gas</span><span>${msg.costos.gas_estimada.toLocaleString('es-CO')}</span></div>
                  )}
                  <div className="db-chat-costs-total">
                    <span>Total mensual</span>
                    <span>${msg.costos.total_servicios.toLocaleString('es-CO')}</span>
                  </div>
                </div>
              )}
              {msg.role==='bot' && msg.recomendaciones?.length > 0 && (
                <div className="db-chat-recs">
                  <div className="db-chat-recs-title">Recomendaciones</div>
                  <ul>{msg.recomendaciones.map((r,j) => <li key={j}>{r}</li>)}</ul>
                </div>
              )}
              {msg.role==='bot' && msg.mapData?.locations?.length > 0 && (
                <ChatMap locations={msg.mapData.locations}/>
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
          {SUGERENCIAS_EMP.map((s,i) => (
            <button key={i} className="db-suggestion" onClick={() => enviar(s)} disabled={loading}>{s}</button>
          ))}
        </div>
      )}
      <div className="db-chat-input-area">
        <input
          className="db-chat-input" type="text" value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => { if(e.key==='Enter' && !e.shiftKey){ e.preventDefault(); enviar(input); }}}
          placeholder="Cuéntame tu idea de negocio..." disabled={loading}
        />
        <button className="db-chat-send" onClick={() => enviar(input)} disabled={loading||!input.trim()}>
          Enviar
        </button>
      </div>
    </div>
  );
}

/* ════════════════════════════════
   LISTA DE CONVERSACIONES (styled)
════════════════════════════════ */
function ConvList({ currentId, onSelect, onNew, onDelete, refreshKey }) {
  const [convs, setConvs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    llmService.getConversations()
      .then(r => { if(r.success) setConvs(r.data||[]); })
      .catch(()=>{})
      .finally(() => setLoading(false));
  }, [refreshKey]);

  const del = async (e,id) => {
    e.stopPropagation();
    if(!confirm('¿Eliminar conversación?')) return;
    try { await llmService.deleteConversation(id); setConvs(p=>p.filter(c=>c.id!==id)); onDelete?.(id); } catch{}
  };

  return (
    <div className="db-convlist">
      <div className="db-convlist-header">
        <button className="db-new-chat-btn" onClick={onNew}>+ Nuevo Chat</button>
      </div>
      <div className="db-convlist-body">
        {loading ? (
          <div style={{fontSize:12,color:'var(--text-dim)',textAlign:'center',padding:'14px 0'}}>Cargando...</div>
        ) : convs.length===0 ? (
          <div style={{fontSize:12,color:'var(--text-dim)',textAlign:'center',padding:'14px 0'}}>Sin conversaciones previas</div>
        ) : convs.map(c=>(
          <div key={c.id} className={`db-conv-item${currentId===c.id?' active':''}`}>
            <button
              type="button"
              className="db-conv-open"
              onClick={() => onSelect(c.id)}
              aria-current={currentId===c.id ? 'true' : undefined}
              aria-label={`Abrir conversación ${c.title || 'sin título'}`}
            >
              <div style={{flex:1,minWidth:0}}>
              <div className="db-conv-title">{c.title||'Sin título'}</div>
              <div className="db-conv-date">{new Date(c.created_at).toLocaleDateString('es-CO',{month:'short',day:'numeric'})}</div>
              </div>
            </button>
            <button className="db-conv-del" onClick={e=>del(e,c.id)}>✕</button>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ════════════════════════════════
   INSIGHTS WIDGET (barras)
════════════════════════════════ */
const ACT_PAGE_SIZE = 4;

function InsightsWidget() {
  const [years, setYears]               = useState([]);
  const [selectedYear, setSelectedYear] = useState('');
  const [loading, setLoading]           = useState(true);
  const [summary, setSummary]           = useState(null);
  const [topActividades, setTopAct]     = useState([]);
  const [topComunas, setTopCom]         = useState([]);
  const [overview, setOverview]         = useState(null);
  const [actPage, setActPage]           = useState(0);
  const [insightTab, setInsightTab]     = useState('zonas');

  useEffect(() => { datasetsService.getEmpresarialYears().then(r=>setYears(r?.data||[])).catch(()=>{}); }, []);

  useEffect(() => {
    const y = selectedYear==='' ? null : Number(selectedYear);
    let active = true;
    // Use microtask so state resets don't run synchronously in effect body
    Promise.resolve().then(() => {
      if (!active) return;
      setLoading(true);
      setActPage(0);
      return Promise.all([
        datasetsService.getEmprendedorOverview(y, 12),
        datasetsService.getEmpresarialSummary(y),
        datasetsService.getEmpresarialTopActividades(y, 12),
        datasetsService.getEmpresarialTopComunas(y, 10),
      ]).then(([ov,sum,act,com])=>{
        if (!active) return;
        setOverview(ov?.data||null); setSummary(sum?.data||null);
        setTopAct(act?.data||[]);
        setTopCom((com?.data||[]).filter(c => c.comuna && !c.comuna.toLowerCase().includes('georreferenc')));
        setLoading(false);
      }).catch(()=>{ if (active) setLoading(false); });
    });
    return () => { active = false; };
  }, [selectedYear]);

  const maxA = useMemo(()=>Math.max(...topActividades.map(i=>i.total_empresas||0),1),[topActividades]);
  const actTotal = Math.ceil(topActividades.length / ACT_PAGE_SIZE);
  const actSlice = topActividades.slice(actPage * ACT_PAGE_SIZE, (actPage + 1) * ACT_PAGE_SIZE);

  if(loading) return <div style={{fontSize:13,color:'var(--text-dim)'}}>Cargando inteligencia empresarial...</div>;

  const crimComuna = overview?.criminalidad?.comuna_mas_afectada || '';
  const oportunidadZonas = topComunas.filter(c => c.comuna !== crimComuna).slice(0, 3);

  return (
    <div style={{display:'flex',flexDirection:'column',gap:14,height:'100%'}}>
      {/* Controles + tabs en una fila */}
      <div style={{display:'flex',alignItems:'center',gap:10,flexShrink:0,flexWrap:'wrap'}}>
        <StyledSelect
          value={selectedYear}
          onChange={setSelectedYear}
          options={[{value:'',label:'Todos los años'}, ...years.map(y=>({value:String(y),label:String(y)}))]}
        />
        <div style={{display:'flex',gap:6,marginLeft:'auto'}}>
          {[['zonas','Zonas'],['sectores','Sectores']].map(([id,label])=>(
            <button key={id} className={`db-fpill${insightTab===id?' active':''}`} onClick={()=>setInsightTab(id)} style={{padding:'5px 14px',fontSize:12}}>{label}</button>
          ))}
        </div>
      </div>

      {/* Stats */}
      {summary && (
        <div className="db-insights-stats db-insights-stats--4" style={{flexShrink:0}}>
          {[
            {label:'Empresas',      value:`${(summary.total_empresas/1000).toFixed(1)}k`, tooltip:'Total de empresas registradas formalmente en Medellín'},
            {label:'Sectores',      value:summary.total_actividades, tooltip:'Sectores económicos activos (CIIU-DANE)'},
            {label:'Zona más activa', value:summary.comuna_top?.nombre||'N/A', small:true, tooltip:'Mayor concentración de empresas'},
            {label:'Mayor riesgo',   value:crimComuna||'N/A', small:true, cls:'red', tooltip:'Zona con mayor índice de criminalidad'},
          ].map((s,i)=>(
            <div key={i} className="db-insights-stat" data-tooltip={s.tooltip}>
              <div className="db-insights-stat-label">{s.label}</div>
              <div className={`db-insights-stat-value${s.cls?' '+s.cls:''}`} style={s.small?{fontSize:12,marginTop:2}:{}}>{s.value}</div>
            </div>
          ))}
        </div>
      )}

      {/* TAB: Zonas de oportunidad */}
      {insightTab === 'zonas' && (
        <div style={{display:'flex',flexDirection:'column',gap:8,flex:1}}>
          <div style={{background:'var(--active-bg)',border:'1px solid var(--active-bd)',borderRadius:10,padding:'10px 14px',fontSize:12.5,color:'var(--text-mid)',lineHeight:1.55,flexShrink:0}}>
            Cruza <b style={{color:'var(--text-h)'}}>actividad empresarial</b> con <b style={{color:'#f87171'}}>criminalidad</b> para detectar zonas con alta oportunidad y menor riesgo.
          </div>
          {oportunidadZonas.length > 0 ? oportunidadZonas.map((item,i)=>(
            <div key={i} data-tooltip={`${(item.total_empresas||0).toLocaleString('es-CO')} empresas · No es la zona de mayor riesgo`}
              style={{display:'flex',alignItems:'center',gap:12,padding:'10px 14px',background:'rgba(0,200,150,.07)',border:'1px solid rgba(0,200,150,.18)',borderRadius:11,cursor:'default',flex:1}}
            >
              <div style={{width:28,height:28,borderRadius:8,background:'rgba(0,200,150,.18)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:13,fontWeight:800,color:'var(--accent)',flexShrink:0}}>#{i+1}</div>
              <div style={{flex:1}}>
                <div style={{fontSize:13.5,fontWeight:700,color:'var(--text-h)'}}>{item.comuna}</div>
                <div style={{fontSize:11.5,color:'var(--text-mid)',marginTop:1}}>{(item.total_empresas||0).toLocaleString('es-CO')} empresas registradas</div>
              </div>
              <span style={{fontSize:10,fontWeight:700,background:'rgba(0,200,150,.15)',border:'1px solid rgba(0,200,150,.30)',color:'var(--accent)',padding:'3px 9px',borderRadius:100,letterSpacing:'.04em'}}>OPORTUNIDAD</span>
            </div>
          )) : (
            <div style={{fontSize:12,color:'var(--text-dim)',padding:'10px 0'}}>No hay datos de zonas disponibles para el año seleccionado.</div>
          )}
        </div>
      )}

      {/* TAB: Sectores activos */}
      {insightTab === 'sectores' && (
        <div style={{display:'flex',flexDirection:'column',gap:6,flex:1}}>
          <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:4,flexShrink:0}}>
            <div style={{fontSize:11,fontWeight:700,letterSpacing:'.07em',textTransform:'uppercase',color:'var(--text-dim)'}}>
              Sectores con más empresas
            </div>
            {actTotal > 1 && (
              <div style={{fontSize:11,color:'var(--text-dim)'}}>{actPage+1}/{actTotal}</div>
            )}
          </div>
          {actSlice.map((item,i)=>{
            const w = Math.max(8,Math.round(((item.total_empresas||0)/maxA)*100));
            return (
              <div key={i} className="db-bar-item" style={{flex:1,justifyContent:'center'}}
                data-tooltip={`CIIU ${item.ciiu} · ${(item.total_empresas||0).toLocaleString('es-CO')} empresas · Zona: ${item.top_comuna||'N/A'}`}
              >
                <div className="db-bar-row">
                  <span style={{whiteSpace:'normal',lineHeight:1.35,maxWidth:'70%'}}>{item.descripcion}</span>
                  <b>{(item.total_empresas||0).toLocaleString('es-CO')}</b>
                </div>
                <div className="db-bar-track"><div className="db-bar-fill" style={{width:`${w}%`}}/></div>
                <div className="db-bar-sub">Principal en {item.top_comuna||'N/A'}</div>
              </div>
            );
          })}
          {actTotal > 1 && (
            <div style={{display:'flex',justifyContent:'center',gap:8,marginTop:4,flexShrink:0}}>
              <button className="db-fpill" onClick={()=>setActPage(p=>Math.max(0,p-1))} disabled={actPage===0} style={{padding:'5px 14px',fontSize:12,opacity:actPage===0?.4:1}}>← Ant.</button>
              <button className="db-fpill" onClick={()=>setActPage(p=>Math.min(actTotal-1,p+1))} disabled={actPage>=actTotal-1} style={{padding:'5px 14px',fontSize:12,opacity:actPage>=actTotal-1?.4:1}}>Sig. →</button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* ════════════════════════════════
   NEGOCIOS CERCANOS (barras)
════════════════════════════════ */
function NegociosWidget() {
  const [loading, setLoading]       = useState(true);
  const [filters, setFilters]       = useState({comuna:'',categoria:'',fecha_recoleccion:''});
  const [available, setAvailable]   = useState({comunas:[],categorias:[],fechas_recoleccion:[]});
  const [summary, setSummary]       = useState(null);
  const [topBarrios, setTopBarrios] = useState([]);
  const [topTipos, setTopTipos]     = useState([]);

  useEffect(() => {
    datasetsService.getNegociosMedellinFilters().then(r=>{
      const d=r?.data||{};
      setAvailable({comunas:d.comunas||[],categorias:d.categorias||[],fechas_recoleccion:d.fechas_recoleccion||[]});
      setFilters(p=>({...p,fecha_recoleccion:d.fechas_recoleccion?.[0]||''}));
      setLoading(false);
    }).catch(()=>setLoading(false));
  }, []);

  useEffect(() => {
    if(loading) return;
    const q={comuna:filters.comuna||null,categoria:filters.categoria||null,fecha_recoleccion:filters.fecha_recoleccion||null};
    Promise.all([
      datasetsService.getNegociosMedellinSummary(q),
      datasetsService.getNegociosMedellinTopBarrios({...q,limit:9}),
      datasetsService.getNegociosMedellinTopTipos({...q,limit:9}),
    ]).then(([s,b,t])=>{
      setSummary(s?.data||null);
      setTopBarrios(b?.data||[]);
      setTopTipos(t?.data||[]);
    }).catch(()=>{});
  }, [loading, filters]);

  const maxB = useMemo(()=>Math.max(...topBarrios.map(i=>i.total_cantidad||0),1),[topBarrios]);
  const maxT = useMemo(()=>Math.max(...topTipos.map(i=>i.total_cantidad||0),1),[topTipos]);
  const setF = (key,val) => setFilters(p=>({...p,[key]:val}));

  if(loading) return <div style={{fontSize:13,color:'var(--text-dim)'}}>Cargando negocios...</div>;

  return (
    <div style={{display:'flex',flexDirection:'column',gap:12,height:'100%'}}>
      {/* Filtros */}
      <div style={{display:'flex',gap:8,flexWrap:'wrap',flexShrink:0}}>
        <StyledSelect
          value={filters.comuna}
          onChange={v=>setF('comuna',v)}
          options={[{value:'',label:'Todas las comunas'}, ...available.comunas.map(o=>({value:o,label:o}))]}
        />
        <StyledSelect
          value={filters.categoria}
          onChange={v=>setF('categoria',v)}
          options={[{value:'',label:'Todas las categorías'}, ...available.categorias.map(o=>({value:o,label:o}))]}
        />
        {available.fechas_recoleccion.length>0 && (
          <StyledSelect
            value={filters.fecha_recoleccion}
            onChange={v=>setF('fecha_recoleccion',v)}
            options={available.fechas_recoleccion.map(f=>({value:f,label:f}))}
          />
        )}
      </div>

      {/* Stats */}
      {summary && (
        <div className="db-insights-stats db-insights-stats--4" style={{flexShrink:0}}>
          {[
            {label:'Registros', value:(summary.total_registros||0).toLocaleString('es-CO'), tooltip:'Establecimientos registrados con los filtros actuales'},
            {label:'Unidades',  value:(summary.total_cantidad||0).toLocaleString('es-CO'),  tooltip:'Total de unidades de negocio contadas'},
            {label:'Barrios',   value:summary.barrios_unicos||0, tooltip:'Barrios distintos con negocios en la selección'},
            {label:'Tipos',     value:summary.tipos_unicos||0,   tooltip:'Categorías únicas de negocios en la selección'},
          ].map((s,i)=>(
            <div key={i} className="db-insights-stat" data-tooltip={s.tooltip}>
              <div className="db-insights-stat-label">{s.label}</div>
              <div className="db-insights-stat-value">{s.value}</div>
            </div>
          ))}
        </div>
      )}

      {/* Barras — flex:1 para llenar el espacio */}
      <div className="db-negocios-split" style={{flex:1,minHeight:0}}>
        <div style={{display:'flex',flexDirection:'column'}}>
          <div style={{fontSize:11,fontWeight:700,letterSpacing:'.07em',textTransform:'uppercase',color:'var(--text-dim)',marginBottom:8,flexShrink:0}}>
            Top Barrios
          </div>
          {topBarrios.map((item,i)=>{
            const w=Math.max(8,Math.round(((item.total_cantidad||0)/maxB)*100));
            return (
              <div key={i} className="db-bar-item" style={{flex:1,justifyContent:'center'}}>
                <div className="db-bar-row">
                  <span style={{fontSize:12}}>C{item.comuna} · {item.barrio}</span>
                  <b>{item.total_cantidad}</b>
                </div>
                <div className="db-bar-track"><div className="db-bar-fill" style={{width:`${w}%`}}/></div>
              </div>
            );
          })}
        </div>
        <div style={{display:'flex',flexDirection:'column'}}>
          <div style={{fontSize:11,fontWeight:700,letterSpacing:'.07em',textTransform:'uppercase',color:'var(--text-dim)',marginBottom:8,flexShrink:0}}>
            Top Tipos de negocio
          </div>
          {topTipos.map((item,i)=>{
            const w=Math.max(8,Math.round(((item.total_cantidad||0)/maxT)*100));
            return (
              <div key={i} className="db-bar-item" style={{flex:1,justifyContent:'center'}}>
                <div className="db-bar-row">
                  <span style={{fontSize:12,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',maxWidth:'68%'}}>{item.tipo_negocio}</span>
                  <b>{item.total_cantidad}</b>
                </div>
                <div className="db-bar-track">
                  <div className="db-bar-fill" style={{width:`${w}%`,background:'linear-gradient(90deg,#239677,#00C896)'}}/></div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/* ════════════════════════════════
   COBERTURA EPM
════════════════════════════════ */
function CoberturaWidget() {
  const [view, setView]               = useState('estratificacion');
  const [loading, setLoading]         = useState(true);
  const [periodo, setPeriodo]         = useState('');
  const [periodos, setPeriodos]       = useState([]);
  const [summary, setSummary]         = useState(null);
  const [porServicio, setPorServicio] = useState([]);
  const [tarifaDs, setTarifaDs]       = useState('acueducto');
  const [tarifaYear, setTarifaYear]   = useState('');
  const [tarifaYears, setTarifaYears] = useState([]);
  const [tarifaSummary, setTarifaSummary] = useState(null);
  const [tarifaEstrato, setTarifaEstrato] = useState([]);

  useEffect(()=>{
    datasetsService.getEstratificacionSummary(periodo||null).then(r=>{
      const d=r?.data||null; setSummary(d); setPeriodos(d?.available_periodos||[]);
    }).catch(()=>{}).finally(()=>setLoading(false));
    datasetsService.getEstratificacionPorServicio(periodo||null).then(r=>setPorServicio(r?.data||[])).catch(()=>{});
  },[periodo]);

  useEffect(()=>{
    const y=tarifaYear===''?null:Number(tarifaYear);
    datasetsService.getTarifasSummary(tarifaDs,y).then(r=>{
      const d=r?.data||null; setTarifaSummary(d); setTarifaYears(d?.available_years||[]);
    }).catch(()=>{});
    datasetsService.getTarifasPorEstrato(tarifaDs,y).then(r=>setTarifaEstrato(r?.data||[])).catch(()=>{});
  },[tarifaDs,tarifaYear]);

  const maxS = useMemo(()=>Math.max(...porServicio.map(i=>i.total_suscriptores||0),1),[porServicio]);
  const maxE = useMemo(()=>Math.max(...tarifaEstrato.filter(i=>i.estrato).map(i=>i.tarifa_promedio||0),1),[tarifaEstrato]);

  if(loading) return <div style={{fontSize:13,color:'var(--text-dim)'}}>Cargando datos EPM...</div>;

  return (
    <div style={{display:'flex',flexDirection:'column',gap:14,height:'100%'}}>
      {/* Toggle */}
      <div style={{display:'flex',gap:8,flexShrink:0}}>
        {[['estratificacion','Estratificación'],['tarifas','Tarifas EPM']].map(([id,label])=>(
          <button key={id} className={`db-fpill${view===id?' active':''}`} onClick={()=>setView(id)}>{label}</button>
        ))}
      </div>

      {view==='estratificacion' && (
        <>
          <StyledSelect
            value={periodo}
            onChange={setPeriodo}
            options={[{value:'',label:'Todos los periodos'}, ...periodos.map(p=>({value:p,label:p}))]}
          />
          {summary && (
            <div className="db-insights-stats" style={{flexShrink:0}}>
              {[
                {label:'Suscriptores',   value:`${((summary.total_suscriptores||0)/1000).toFixed(0)}k`, tooltip:'Total de hogares/negocios suscritos a servicios EPM'},
                {label:'Cobertura prom.',value:`${Number(summary.cobertura_promedio||0).toFixed(1)}%`,  tooltip:'Porcentaje promedio de cobertura de todos los servicios públicos'},
                {label:'Servicio líder', value:porServicio[0]?.servicio||'N/A', small:true, tooltip:'El servicio con más suscriptores en Medellín'},
                {label:'Periodo',        value:periodo||'Todos', small:true, tooltip:'Período de recolección de los datos mostrados'},
              ].map((s,i)=>(
                <div key={i} className="db-insights-stat" data-tooltip={s.tooltip}>
                  <div className="db-insights-stat-label">{s.label}</div>
                  <div className="db-insights-stat-value" style={s.small?{fontSize:13,marginTop:2}:{}}>{s.value}</div>
                </div>
              ))}
            </div>
          )}
          <div style={{display:'flex',flexDirection:'column',flex:1,minHeight:0}}>
            <div style={{fontSize:11,fontWeight:700,letterSpacing:'.07em',textTransform:'uppercase',color:'var(--text-dim)',marginBottom:8,flexShrink:0}}>
              Suscriptores por servicio público
            </div>
            {porServicio.map((item,i)=>{
              const w=Math.max(8,Math.round(((item.total_suscriptores||0)/maxS)*100));
              return (
                <div key={i} className="db-bar-item" style={{flex:1,justifyContent:'center'}}
                  data-tooltip={`${(item.total_suscriptores||0).toLocaleString('es-CO')} suscriptores en ${item.servicio}`}
                >
                  <div className="db-bar-row"><span>{item.servicio}</span><b>{(item.total_suscriptores||0).toLocaleString('es-CO')}</b></div>
                  <div className="db-bar-track"><div className="db-bar-fill" style={{width:`${w}%`}}/></div>
                </div>
              );
            })}
          </div>
        </>
      )}

      {view==='tarifas' && (
        <>
          <div style={{display:'flex',gap:8,flexWrap:'wrap'}}>
            <StyledSelect
              value={tarifaDs}
              onChange={setTarifaDs}
              options={[{value:'acueducto',label:'Acueducto'},{value:'gas',label:'Gas'},{value:'energia',label:'Energía'}]}
            />
            <StyledSelect
              value={tarifaYear}
              onChange={setTarifaYear}
              options={[{value:'',label:'Todos los años'}, ...tarifaYears.map(y=>({value:String(y),label:String(y)}))]}
            />
          </div>
          {tarifaSummary && (
            <div className="db-insights-stats">
              {[
                {label:'Servicio',        value:tarifaDs, small:true, tooltip:`Servicio público seleccionado para ver tarifas`},
                {label:'Tarifa promedio', value:`$${Number(tarifaSummary.tarifa_promedio||0).toLocaleString('es-CO')}`, tooltip:'Costo promedio mensual de este servicio en Medellín — útil para estimar gastos operativos'},
                {label:'Registros',       value:(tarifaSummary.total_registros||0).toLocaleString('es-CO'), tooltip:'Número de registros tarifarios en la base de datos'},
                {label:'Años disponibles',value:tarifaYears.length||0, tooltip:'Años con datos de tarifas disponibles para análisis histórico'},
              ].map((s,i)=>(
                <div key={i} className="db-insights-stat" data-tooltip={s.tooltip}>
                  <div className="db-insights-stat-label">{s.label}</div>
                  <div className="db-insights-stat-value" style={s.small?{fontSize:13,marginTop:2}:{}}>{s.value}</div>
                </div>
              ))}
            </div>
          )}
          <div style={{display:'flex',flexDirection:'column',flex:1,minHeight:0}}>
            <div style={{fontSize:11,fontWeight:700,letterSpacing:'.07em',textTransform:'uppercase',color:'var(--text-dim)',marginBottom:8,flexShrink:0}}>
              Tarifa promedio por estrato socioeconómico
            </div>
            {tarifaEstrato.filter(i=>i.estrato).map((item,i)=>{
              const w=Math.max(8,Math.round(((item.tarifa_promedio||0)/maxE)*100));
              return (
                <div key={i} className="db-bar-item" style={{flex:1,justifyContent:'center'}}
                  data-tooltip={`Estrato ${item.estrato}: $${Number(item.tarifa_promedio||0).toLocaleString('es-CO')}/mes · considera el estrato de tu zona`}
                >
                  <div className="db-bar-row"><span>Estrato {item.estrato}</span><b>${Number(item.tarifa_promedio||0).toLocaleString('es-CO')}</b></div>
                  <div className="db-bar-track">
                    <div className="db-bar-fill" style={{width:`${w}%`,background:'linear-gradient(90deg,#239677,#00C896)'}}/></div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}

/* ════════════════════════════════
   EMPRENDEDOR DASHBOARD
════════════════════════════════ */
export default function EmprendedorDashboard() {
  const navigate = useNavigate();
  const [user, setUser]     = useState(null);
  const [loading, setLoading] = useState(true);
  const [mod, setMod]       = useState('inicio');
  const [convId, setConvId] = useState(null);
  const [showConvList, setShowConvList] = useState(true);

  // Datos para inicio
  const [summary, setSummary]             = useState(null);
  const [topComunas, setTopComunas]       = useState([]);
  const [topActividades, setTopActs]      = useState([]);
  const [convListKey, setConvListKey]     = useState(0);

  useEffect(() => {
    authService.getMe().then(setUser).catch(()=>navigate('/login')).finally(()=>setLoading(false));
  }, [navigate]);

  // Carga datos de inicio
  useEffect(() => {
    datasetsService.getEmpresarialSummary(null)
      .then(r => { if(r?.data) setSummary(r.data); }).catch(()=>{});
    datasetsService.getEmpresarialTopComunas(null, 8)
      .then(r => setTopComunas((r?.data||[]).filter(c => c.comuna && !c.comuna.toLowerCase().includes('georreferenc')).slice(0,5))).catch(()=>{});
    datasetsService.getEmpresarialTopActividades(null, 5)
      .then(r => setTopActs(r?.data||[])).catch(()=>{});
  }, []);

  const handleLogout = () => { authService.logout(); navigate('/login'); };

  // Cuando se crea una conversación nueva, refrescar la lista
  const handleConversationChange = (newId) => {
    if (!convId && newId) setConvListKey(k => k + 1);
    setConvId(newId);
  };

  if(loading) return <div className="db-loading"><div className="db-spinner"/>Cargando inteligencia empresarial…</div>;
  if(!user) return null;

  const firstName = user.full_name?.split(' ')[0] || 'Emprendedor';

  const META = {
    inicio:      { accent:'Hola,', title:firstName,          subtitle:'Panel ejecutivo para emprendedores de Medellín' },
    emprendedor: { accent:'',      title:'Abre Tu Negocio',  subtitle:'Consultor IA · Análisis de viabilidad · Datos reales de Medellín' },
    insights:    { accent:'',      title:'Inteligencia',     subtitle:'Actividad económica cruzada con contexto de seguridad' },
    negocios:    { accent:'',      title:'Datos de Negocios',subtitle:'Negocios cercanos · Cobertura EPM · Tarifas por estrato' },
    cobertura:   { accent:'',      title:'Cobertura y Tarifas EPM', subtitle:'Estratificación · Servicios · Tendencias de tarifas' },
  };
  const m = META[mod];

  /* ══ COL-R dinámico ══ */
  // Bloque "Panel Emprendedor" — sin ícono de edición
  const panelEmprendedor = (
    <div className="db-rc db-card-note" style={{flexShrink:0}}>
      <div className="db-card-header">
        <span className="db-card-title">Panel Emprendedor</span>
      </div>
      <div className="db-note-body">
        Datos <b>reales de Medellín</b> para tomar mejores decisiones de negocio. Consulta el asesor IA para análisis de viabilidad.
      </div>
      <div className="db-note-footer">
        <span className="db-note-time">Medellín · Valle de Aburrá</span>
        <div className="db-note-badge"><span className="ck">✓</span> IA Activa</div>
      </div>
    </div>
  );

  const rightColByMod = {
    inicio: (
      <>
        {panelEmprendedor}
        {topActividades.length > 0 && (() => {
          const total = topActividades.reduce((s,i)=>s+(i.total_empresas||0),0);
          const colors = ['#00C896','#239677','#60a5fa','#f59e0b','#c084fc'];
          return (
            <div className="db-rc db-sector-share-card" style={{flexShrink:0}}>
              <div className="db-card-header" style={{marginBottom:10}}>
                <span className="db-card-title">Participación sectorial</span>
              </div>
              {/* Mini donut bar */}
              <div className="db-sector-share-bar">
                {topActividades.slice(0,5).map((item,i)=>{
                  const pct = total > 0 ? ((item.total_empresas||0)/total*100) : 0;
                  return <div key={i} style={{width:`${pct}%`,background:colors[i]}}/>;
                })}
                <div className="db-sector-share-rest"/>
              </div>
              {topActividades.slice(0,5).map((item,i)=>{
                const pct = total > 0 ? ((item.total_empresas||0)/total*100) : 0;
                return (
                  <div key={i} className="db-sector-share-item" data-tooltip={`${(item.total_empresas||0).toLocaleString('es-CO')} empresas en este sector`}>
                    <div className="db-sector-share-dot" style={{background:colors[i]}}/>
                    <div className="db-sector-share-name">{item.descripcion}</div>
                    <div className="db-sector-share-pct">{pct.toFixed(1)}%</div>
                  </div>
                );
              })}
            </div>
          );
        })()}
        <div className="db-rc db-market-context-card" style={{flex:1,display:'flex',flexDirection:'column',minHeight:0}}>
          <div className="db-card-header" style={{marginBottom:8,flexShrink:0}}>
            <span className="db-card-title">Contexto del mercado</span>
          </div>
          <div className="db-market-context-list">
            {[
              {icon:'🏙️', label:'Medellín formal', desc:`${summary ? `${(summary.total_empresas/1000).toFixed(1)}k` : '—'} empresas registradas en el DANE — ciudad con alta formalización empresarial.`},
              {icon:'📈', label:'Dinamismo sectorial', desc:`${summary ? summary.total_actividades : '—'} sectores económicos activos. Los servicios y el comercio dominan el mapa.`},
              {icon:'🗺️', label:'Distribución comunal', desc:`${summary?.comuna_top?.nombre || 'El Centro'} lidera en concentración. Las zonas periféricas tienen menor competencia.`},
            ].map((item,i)=>(
              <div key={i} className="db-market-context-item" style={{borderBottom:i<2?'1px solid var(--sep)':'none'}}>
                <span className="db-market-context-icon">{item.icon}</span>
                <div>
                  <div className="db-market-context-title">{item.label}</div>
                  <div className="db-market-context-desc">{item.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </>
    ),
    emprendedor: null, // full-width
    insights: (
      <>
        {panelEmprendedor}
        <div className="db-rc" style={{flexShrink:0}}>
          <div className="db-card-header" style={{marginBottom:10}}>
            <span className="db-card-title">¿Cómo funciona?</span>
          </div>
          <div style={{display:'flex',flexDirection:'column',gap:10}}>
            {[
              {icon:'📊', title:'Actividad empresarial', desc:'Sectores con más empresas registradas en el DANE para detectar mercados en crecimiento.'},
              {icon:'🛡️', title:'Índice de criminalidad', desc:'Datos de incidencia delictiva por zona, para evaluar el riesgo de seguridad de tu local.'},
              {icon:'🎯', title:'Zonas de oportunidad', desc:'Cruce de ambas fuentes: alta actividad + baja criminalidad = mejor potencial para tu negocio.'},
            ].map((item,i)=>(
              <div key={i} style={{display:'flex',gap:9,alignItems:'flex-start'}}>
                <span style={{fontSize:15,flexShrink:0,marginTop:1}}>{item.icon}</span>
                <div>
                  <div style={{fontSize:12,fontWeight:700,color:'var(--text-h)',marginBottom:2}}>{item.title}</div>
                  <div style={{fontSize:11.5,color:'var(--text-mid)',lineHeight:1.45}}>{item.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="db-rc" style={{flex:1,display:'flex',flexDirection:'column',minHeight:0}}>
          <div className="db-card-header" style={{marginBottom:8,flexShrink:0}}>
            <span className="db-card-title">Claves para analizar</span>
          </div>
          <div style={{display:'flex',flexDirection:'column',gap:0,flex:1}}>
            {[
              {num:'1', tip:'Filtra por año para ver si un sector está creciendo o estancándose en el tiempo.'},
              {num:'2', tip:'La pestaña "Zonas" muestra dónde abrir con menos competencia y menos riesgo.'},
              {num:'3', tip:'El sector líder tiene más demanda, pero también más competidores establecidos.'},
              {num:'4', tip:'Usa "Sectores" para encontrar nichos de mercado con menor saturación.'},
            ].map((item,i)=>(
              <div key={i} style={{display:'flex',gap:10,alignItems:'flex-start',flex:1,padding:'6px 0',borderBottom:i<3?'1px solid var(--sep)':'none'}}>
                <div style={{width:20,height:20,borderRadius:6,background:'var(--active-bg)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:10,fontWeight:800,color:'var(--accent)',flexShrink:0,marginTop:1}}>{item.num}</div>
                <span style={{fontSize:11.5,color:'var(--text-mid)',lineHeight:1.45}}>{item.tip}</span>
              </div>
            ))}
          </div>
        </div>
      </>
    ),
    negocios: (
      <>
        {panelEmprendedor}
        <div className="db-rc" style={{flexShrink:0}}>
          <div className="db-card-header" style={{marginBottom:10}}>
            <span className="db-card-title">¿Qué es Negocios?</span>
          </div>
          <div style={{fontSize:12.5,color:'var(--text-mid)',lineHeight:1.7,display:'flex',flexDirection:'column',gap:6}}>
            <p style={{margin:0}}>Registros <b style={{color:'var(--text-h)'}}>reales</b> de negocios en Medellín, filtrados por comuna, categoría y período.</p>
            <p style={{margin:0}}>Úsalo para conocer la <b style={{color:'var(--text-h)'}}>densidad de competidores</b> en tu zona objetivo.</p>
          </div>
        </div>
        <div className="db-rc" style={{flex:1,display:'flex',flexDirection:'column',minHeight:0}}>
          <div className="db-card-header" style={{marginBottom:8,flexShrink:0}}>
            <span className="db-card-title">Cómo interpretar</span>
          </div>
          <div style={{display:'flex',flexDirection:'column',gap:0,flex:1}}>
            {[
              {n:'1', tip:'Filtra por tu comuna para ver solo la competencia en tu zona objetivo.'},
              {n:'2', tip:'Compara categorías de negocio para detectar nichos con poca oferta.'},
              {n:'3', tip:'Más barrios cubiertos en el resultado = mercado más diverso y distribuido.'},
              {n:'4', tip:'Usa el período más reciente para datos actualizados del mercado local.'},
            ].map(({n,tip},i)=>(
              <div key={i} style={{display:'flex',gap:10,alignItems:'flex-start',flex:1,padding:'6px 0',borderBottom:i<3?'1px solid var(--sep)':'none'}}>
                <div style={{width:20,height:20,borderRadius:6,background:'var(--active-bg)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:10,fontWeight:800,color:'var(--accent)',flexShrink:0,marginTop:1}}>{n}</div>
                <span style={{fontSize:11.5,color:'var(--text-mid)',lineHeight:1.45}}>{tip}</span>
              </div>
            ))}
          </div>
        </div>
      </>
    ),
    cobertura: (
      <>
        {panelEmprendedor}
        <div className="db-rc" style={{flexShrink:0}}>
          <div className="db-card-header" style={{marginBottom:10}}>
            <span className="db-card-title">Guía EPM</span>
          </div>
          <div style={{display:'flex',flexDirection:'column',gap:9}}>
            {[
              {servicio:'Energía eléctrica', rango:'$45k – $200k/mes', color:'#fbbf24'},
              {servicio:'Acueducto',         rango:'$20k – $80k/mes',  color:'#60a5fa'},
              {servicio:'Gas natural',       rango:'$15k – $60k/mes',  color:'#f87171'},
            ].map(({servicio,rango,color})=>(
              <div key={servicio} style={{display:'flex',alignItems:'center',gap:9}}>
                <div style={{width:7,height:7,borderRadius:'50%',background:color,flexShrink:0}}/>
                <div>
                  <div style={{fontSize:12,fontWeight:600,color:'var(--text-h)',lineHeight:1.1}}>{servicio}</div>
                  <div style={{fontSize:11,color,fontWeight:700}}>{rango}</div>
                </div>
              </div>
            ))}
            <div style={{fontSize:11,color:'var(--text-dim)',borderTop:'1px solid var(--sep)',paddingTop:8,lineHeight:1.5}}>
              Valores estimados según estrato socioeconómico.
            </div>
          </div>
        </div>
        <div className="db-rc" style={{flex:1,display:'flex',flexDirection:'column',minHeight:0}}>
          <div className="db-card-header" style={{marginBottom:8,flexShrink:0}}>
            <span className="db-card-title">¿Para qué sirve?</span>
          </div>
          <div style={{display:'flex',flexDirection:'column',gap:0,flex:1}}>
            {[
              {n:'1', tip:'Estima el costo mensual de servicios públicos según el estrato de tu local.'},
              {n:'2', tip:'Compara tarifas entre acueducto, gas y energía para planear tu presupuesto.'},
              {n:'3', tip:'Analiza tendencias históricas de precios para anticipar variaciones de costos.'},
              {n:'4', tip:'Proyecta los gastos operativos de tu negocio antes de firmar un arriendo.'},
            ].map(({n,tip},i)=>(
              <div key={i} style={{display:'flex',gap:10,alignItems:'flex-start',flex:1,padding:'6px 0',borderBottom:i<3?'1px solid var(--sep)':'none'}}>
                <div style={{width:20,height:20,borderRadius:6,background:'var(--active-bg)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:10,fontWeight:800,color:'var(--accent)',flexShrink:0,marginTop:1}}>{n}</div>
                <span style={{fontSize:11.5,color:'var(--text-mid)',lineHeight:1.45}}>{tip}</span>
              </div>
            ))}
          </div>
        </div>
      </>
    ),
  };
  const rightCol = rightColByMod[mod];

  /* ══ COL-L ══ */

  // ── INICIO: datos reales con visualización innovadora ──
  // Labels de posición de mercado según rank
  const mktLabel = (i, total) => {
    const pct = (total > 0 ? topActividades[i]?.total_empresas / total : 0);
    if (i === 0) return {txt:'Sector líder', cls:''};
    if (pct > 0.15) return {txt:'Muy activo', cls:''};
    if (pct > 0.08) return {txt:'Activo', cls:'medio'};
    return {txt:'Nicho', cls:'saturado'};
  };
  const totalEmpresas = topActividades.reduce((s,i)=>s+(i.total_empresas||0),0);

  const inicioLeft = (
    <>
      {/* Stats principales */}
      {summary && (
        <div className="db-stat-row db-stat-row--4" style={{flexShrink:0}}>
          {[
            {label:'Empresas registradas', value:`${(summary.total_empresas/1000).toFixed(1)}k`, tooltip:'Total de empresas formalmente registradas en Medellín'},
            {label:'Sectores activos',     value:summary.total_actividades, tooltip:'Tipos de actividades económicas únicas presentes en la ciudad'},
            {label:'Comuna líder',         value:summary.comuna_top?.nombre||'N/A', small:true, tooltip:'La comuna con mayor concentración de empresas registradas'},
            {label:'Tasa de formalidad',   value:'Alta', cls:'green', tooltip:'Medellín tiene una de las tasas de formalización empresarial más altas del país'},
          ].map((s,i)=>(
            <div key={i} className="db-stat-item" data-tooltip={s.tooltip}>
              <div className="db-stat-label">{s.label}</div>
              <div className={`db-stat-value ${s.cls||''}`} style={s.small?{fontSize:12,marginTop:3}:{fontSize:20}}>{s.value}</div>
            </div>
          ))}
        </div>
      )}

      {/* Sectores: lista 2 columnas, texto completo */}
      <div style={{flexShrink:0}}>
        <div style={{fontSize:11,fontWeight:700,letterSpacing:'.07em',textTransform:'uppercase',color:'var(--text-dim)',marginBottom:10}}>
          Sectores económicos · Posición de mercado
        </div>
        <div className="db-sectores-grid">
          {topActividades.length === 0 ? (
            <div style={{fontSize:12,color:'var(--text-dim)',gridColumn:'1/-1'}}>Cargando sectores...</div>
          ) : topActividades.map((item,i)=>{
            const lbl = mktLabel(i, totalEmpresas);
            return (
              <div key={i} className="db-sector-tile"
                data-tooltip={`${(item.total_empresas||0).toLocaleString('es-CO')} empresas · Zona: ${item.top_comuna||'N/A'} · CIIU ${item.ciiu}`}
                style={{padding:'10px 12px',gap:6}}
              >
                <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:2}}>
                  <span className={`db-sector-label${lbl.cls?' '+lbl.cls:''}`} style={{fontSize:9}}>{lbl.txt}</span>
                  <div className="db-sector-rank" style={{fontSize:10,width:18,height:18,borderRadius:5}}>{i+1}</div>
                </div>
                <div style={{fontSize:12,fontWeight:600,color:'var(--text-h)',lineHeight:1.4}}>{item.descripcion}</div>
                <div style={{fontSize:10.5,color:'var(--text-dim)',marginTop:2}}>{(item.total_empresas||0).toLocaleString('es-CO')} emp · {item.top_comuna||'—'}</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Comunas: ranking visual compacto */}
      {topComunas.length > 0 && (
        <div className="db-card" style={{padding:'16px 20px',flexShrink:0}}>
          <div style={{fontSize:11,fontWeight:700,letterSpacing:'.07em',textTransform:'uppercase',color:'var(--text-dim)',marginBottom:12}}>
            Ranking de comunas por actividad empresarial
          </div>
          <div className="db-comunas-grid">
            {topComunas.map((item,i)=>{
              const intensity = Math.max(0.12, 0.5 - i * 0.08);
              return (
                <div key={i} className="db-commune-cell" data-tooltip={`${(item.total_empresas||0).toLocaleString('es-CO')} empresas registradas`}
                  style={{
                    borderRadius:10,padding:'10px 8px',textAlign:'center',cursor:'default',
                    background:`rgba(0,200,150,${intensity})`,
                    border:`1px solid rgba(0,200,150,${intensity+0.2})`,
                  }}
                >
                  <div className="db-commune-rank" style={{fontSize:9,fontWeight:700,color:'rgba(0,200,150,.85)',marginBottom:3}}>#{i+1}</div>
                  <div className="db-commune-name" style={{fontSize:11.5,fontWeight:700,color:'var(--text-h)',lineHeight:1.2}}>{item.comuna}</div>
                  <div className="db-commune-count" style={{fontSize:10,color:'var(--text-mid)',marginTop:3}}>{(item.total_empresas||0).toLocaleString('es-CO')}</div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Distribución del mercado */}
      {topActividades.length > 0 && (
        <div className="db-card db-market-dist-card" style={{padding:'14px 18px',display:'flex',flexDirection:'column',gap:10}}>
          <div style={{fontSize:11,fontWeight:700,letterSpacing:'.07em',textTransform:'uppercase',color:'var(--text-dim)'}}>
            Distribución del mercado por sector
          </div>
          {/* Stacked bar */}
          <div style={{height:10,borderRadius:6,display:'flex',overflow:'hidden',gap:1}}>
            {topActividades.slice(0,4).map((item,i)=>{
              const pct = totalEmpresas > 0 ? ((item.total_empresas||0)/totalEmpresas*100) : 0;
              const colors = ['#00C896','#239677','#60a5fa','#f59e0b'];
              return <div key={i} style={{width:`${pct}%`,background:colors[i],transition:'width .4s'}}/>;
            })}
            <div style={{flex:1,background:'rgba(255,255,255,.07)'}}/>
          </div>
          {/* Legend */}
          <div className="db-market-legend">
            {topActividades.slice(0,4).map((item,i)=>{
              const pct = totalEmpresas > 0 ? ((item.total_empresas||0)/totalEmpresas*100) : 0;
              const colors = ['#00C896','#239677','#60a5fa','#f59e0b'];
              const short = item.descripcion.length > 40 ? item.descripcion.slice(0,38)+'…' : item.descripcion;
              return (
                <div key={i} style={{display:'flex',alignItems:'center',gap:7}} data-tooltip={`${item.descripcion} · ${pct.toFixed(1)}% del mercado`}>
                  <div style={{width:8,height:8,borderRadius:2,background:colors[i],flexShrink:0}}/>
                  <span style={{fontSize:11,color:'var(--text-mid)',lineHeight:1.3,flex:1,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{short}</span>
                  <span style={{fontSize:11,fontWeight:700,color:'var(--text-h)',flexShrink:0}}>{pct.toFixed(1)}%</span>
                </div>
              );
            })}
          </div>
          {totalEmpresas > 0 && (
            <div style={{fontSize:10.5,color:'var(--text-dim)',borderTop:'1px solid var(--sep)',paddingTop:8}}>
              Los 4 sectores principales concentran el {topActividades.slice(0,4).reduce((s,i)=>s+(i.total_empresas||0),0)/totalEmpresas*100|0}% del total de {(totalEmpresas/1000).toFixed(1)}k empresas registradas.
            </div>
          )}
        </div>
      )}
    </>
  );

  // ── EMPRENDEDOR: chat + historial, full-width ──
  const emprendedorLeft = (
    <div className="db-card" style={{flex:1,display:'flex',overflow:'hidden',padding:0}}>
      {/* Sidebar: Lista de conversaciones (Estilo Gemini) */}
      <div style={{
        display:'flex',
        flexDirection:'column',
        overflow:'hidden',
        width:showConvList ? '260px' : '0px',
        opacity:showConvList ? 1 : 0,
        background:'var(--card-bg)',
        borderRight:showConvList ? '1px solid var(--border-color)' : 'none',
        transition:'width 0.3s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.3s ease',
        flexShrink:0,
        whiteSpace:'nowrap',
      }}>
        {/* Sidebar Header */}
        <div style={{padding:'10px 12px',borderBottom:'1px solid var(--border-color)',flexShrink:0}}>
          <button
            onClick={() => setShowConvList(false)}
            style={{
              width:'100%',
              padding:'7px 10px',
              borderRadius:'6px',
              border:'1px solid var(--border-color)',
              background:'var(--active-bg)',
              color:'var(--text-h)',
              cursor:'pointer',
              fontSize:'11px',
              fontWeight:'700',
              transition:'all 0.2s ease',
              display:'flex',
              alignItems:'center',
              justifyContent:'center',
              gap:'4px',
              letterSpacing:'.02em',
            }}
            onMouseEnter={(e) => {
              e.target.style.background = 'var(--hover-bg)';
              e.target.style.transform = 'translateX(-2px)';
            }}
            onMouseLeave={(e) => {
              e.target.style.background = 'var(--active-bg)';
              e.target.style.transform = 'translateX(0)';
            }}
          >
            ← Ocultar
          </button>
        </div>

        {/* Sidebar Content */}
        <div style={{flex:1,display:'flex',flexDirection:'column',overflow:'hidden'}}>
          <ConvList
            refreshKey={convListKey}
            currentId={convId}
            onSelect={setConvId}
            onNew={() => setConvId(null)}
            onDelete={id => { if(convId===id) setConvId(null); }}
          />
        </div>
      </div>

      {/* Main Chat Area */}
      <div style={{flex:1,display:'flex',flexDirection:'column',overflow:'hidden',background:'var(--card-bg)'}}>
        {/* Header con toggle */}
        <div style={{
          padding:'14px 18px',
          borderBottom:'1px solid var(--sep)',
          flexShrink:0,
          display:'flex',
          justifyContent:'space-between',
          alignItems:'center',
          background:'var(--card-bg)',
        }}>
          <div style={{display:'flex',alignItems:'center',gap:12,flex:1}}>
            {!showConvList && (
              <button
                onClick={() => setShowConvList(true)}
                title='Mostrar lista de chats'
                style={{
                  padding:'6px 10px',
                  borderRadius:'6px',
                  border:'1px solid var(--border-color)',
                  background:'var(--active-bg)',
                  color:'var(--text-h)',
                  cursor:'pointer',
                  fontSize:'18px',
                  fontWeight:'600',
                  transition:'all 0.2s ease',
                  display:'flex',
                  alignItems:'center',
                  justifyContent:'center',
                  minWidth:'40px',
                  minHeight:'40px',
                  flexShrink:0,
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'var(--hover-bg)';
                  e.currentTarget.style.transform = 'scale(1.08)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'var(--active-bg)';
                  e.currentTarget.style.transform = 'scale(1)';
                }}
              >
                ☰
              </button>
            )}
            <div style={{minWidth:0,flex:1}}>
              <div className="db-card-title" style={{fontSize:'14px',fontWeight:'700',color:'var(--text-h)',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>Consultor de Negocios IA</div>
              <div className="db-card-subtitle" style={{fontSize:'12px',color:'var(--text-dim)',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>Análisis de viabilidad · Datos reales</div>
            </div>
          </div>
        </div>

        {/* Chat Container */}
        <div style={{flex:1,display:'flex',flexDirection:'column',overflow:'hidden'}}>
          <ChatEmprendedor conversationId={convId} onConversationChange={handleConversationChange}/>
        </div>
      </div>
    </div>
  );

  // ── INSIGHTS: tabs internas, sin scroll ──
  const insightsLeft = (
    <div className="db-card" style={{flex:1,display:'flex',flexDirection:'column',overflow:'hidden'}}>
      <div className="db-card-header" style={{flexShrink:0}}>
        <div>
          <div className="db-card-title">Inteligencia Empresarial</div>
          <div className="db-card-subtitle">Actividad económica cruzada con índice de seguridad por zona</div>
        </div>
      </div>
      <div style={{flex:1,padding:'0 22px 16px',minHeight:0,display:'flex',flexDirection:'column'}}>
        <InsightsWidget/>
      </div>
    </div>
  );

  // ── NEGOCIOS: solo datos de negocios (cobertura tiene su propio módulo) ──
  const negociosLeft = (
    <div className="db-card" style={{flex:1,display:'flex',flexDirection:'column',overflow:'hidden'}}>
      <div style={{padding:'16px 22px 12px',flexShrink:0,borderBottom:'1px solid var(--sep)'}}>
        <div className="db-card-title" style={{fontSize:16}}>Negocios del mercado local</div>
        <div className="db-card-subtitle">Negocios registrados en Medellín · Filtra por comuna, categoría y período</div>
      </div>
      <div style={{flex:1,padding:'14px 22px 16px',display:'flex',flexDirection:'column',minHeight:0}}>
        <NegociosWidget/>
      </div>
    </div>
  );

  // ── COBERTURA standalone ──
  const coberturaLeft = (
    <div className="db-card" style={{flex:1,display:'flex',flexDirection:'column',overflow:'hidden'}}>
      <div className="db-card-header" style={{flexShrink:0}}>
        <div>
          <div className="db-card-title" style={{fontSize:16}}>Cobertura y Tarifas EPM</div>
          <div className="db-card-subtitle">Estratificación · Servicios públicos · Tendencias de tarifas</div>
        </div>
      </div>
      <div style={{flex:1,padding:'0 22px 16px',minHeight:0,display:'flex',flexDirection:'column'}}>
        <CoberturaWidget/>
      </div>
    </div>
  );

  const leftMap = {
    inicio:      inicioLeft,
    emprendedor: emprendedorLeft,
    insights:    insightsLeft,
    negocios:    negociosLeft,
    cobertura:   coberturaLeft,
  };

  return (
    <DashboardLayout
      user={user} navItems={NAV} activeItem={mod}
      onSelect={setMod} onLogout={handleLogout}
      pageTitleAccent={m.accent} pageTitle={m.title} pageSubtitle={m.subtitle}
      breadcrumb={`Emprendedor / ${m.title}`}
      colL={leftMap[mod]} colR={rightCol}
    />
  );
}
