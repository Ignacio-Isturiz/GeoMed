import { Link } from 'react-router-dom';

export default function Hero() {
  return (
    <section className="hero sec-trans">
      <div className="orb-field">
        <div className="orb orb-teal" style={{width:'700px',height:'700px',top:'-15%',left:'35%',transform:'translateX(-50%)',opacity:.9}}></div>
        <div className="orb orb-blue" style={{width:'500px',height:'500px',top:'20%',right:'-10%',opacity:.7}}></div>
        <div className="orb orb-indigo" style={{width:'400px',height:'400px',bottom:'5%',left:'5%',opacity:.5}}></div>
      </div>

      <div className="hero-upper w">
        <div className="hero-lozenge" id="hl">
          <div className="hero-lozenge-dot">✦</div>
          Inteligencia Ciudadana para Colombia
        </div>
        <h1 className="hero-title" id="htitle">
          Medellín, <em>Inteligente.</em><br/>Tu Ciudad en Tiempo Real.
        </h1>
        <p className="hero-sub" id="hsub">
          Seguridad, movilidad y servicios públicos en un solo dashboard. MECIA transforma datos abiertos en decisiones claras para cada ciudadano.
        </p>
        <div className="hero-btns" id="hbtns">
          <Link to="/register" className="btn btn-g" id="hero-cta">Comenzar Gratis →</Link>
          <a href="#hdash" className="btn btn-outline">Ver el Dashboard</a>
        </div>

        {/* MOCKUP */}
        <div className="hero-dash-wrap" id="hdash">
          <div className="mk">
            {/* ── Top bar ── */}
            <div className="mk-top">
              <div className="mk-breadcrumb">
                <span className="mk-bc-main">MECIA</span>
                <span className="mk-bc-sep"> › </span>
                <span className="mk-bc-chip">Ciudadano / Federico</span>
              </div>
              <div className="mk-top-r">
                <div className="mk-top-ico"><svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/></svg></div>
                <div className="mk-top-ico"><svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg></div>
                <div className="mk-av">SR</div>
              </div>
            </div>

            {/* ── Body: sidebar + center + right ── */}
            <div className="mk-body">

              {/* LEFT SIDEBAR */}
              <div className="mk-sidebar">
                <div className="mk-sidebar-logo">
                  <img src="/mecialogoog.png" alt="MECIA" style={{height:'16px',width:'auto'}} />
                  <span>MECIA</span>
                </div>
                <div className="mk-user-card">
                  <div className="mk-av mk-av-sm">SR</div>
                  <div>
                    <div className="mk-user-name">Federico R</div>
                    <div className="mk-user-role">Ciudadano</div>
                  </div>
                </div>
                <div className="mk-nav-label">NAVEGACIÓN</div>
                <div className="mk-nav-items">
                  <div className="mk-nav-item mk-nav-item--active">
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
                    Inicio
                  </div>
                  <div className="mk-nav-item">
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                    Seguridad
                  </div>
                  <div className="mk-nav-item">
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
                    Servicios EPM
                  </div>
                  <div className="mk-nav-item">
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
                    Noticias
                  </div>
                </div>
                <div className="mk-sidebar-bottom">
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"/></svg>
                  Cerrar Sesión
                </div>
              </div>

              {/* CENTER */}
              <div className="mk-center">
                <div className="mk-greeting">
                  <div className="mk-greeting-title">Hola, <strong>Federico</strong></div>
                  <div className="mk-greeting-sub">Vista general de tu ciudad en tiempo real</div>
                </div>

                <div className="mk-stats-row">
                  <div className="mk-stat-card"><div className="mk-stat-label">COMUNAS CON DATOS</div><div className="mk-stat-val">21</div></div>
                  <div className="mk-stat-card"><div className="mk-stat-label">CASOS REGISTRADOS</div><div className="mk-stat-val mk-stat-red">295.6k</div></div>
                  <div className="mk-stat-card"><div className="mk-stat-label">TASA POR 100K HAB.</div><div className="mk-stat-val">133.3</div></div>
                  <div className="mk-stat-card"><div className="mk-stat-label">COMUNA MÁS AFECTADA</div><div className="mk-stat-val mk-stat-sm">LA CANDELARIA</div></div>
                </div>

                <div className="mk-tabs-row">
                  <div className="mk-tab mk-tab--active"><span className="mk-tab-dot"></span>Seguridad</div>
                  <div className="mk-tab">Servicios EPM</div>
                  <div className="mk-tab">Noticias</div>
                  <div className="mk-tab-cta">Consultar Guardián →</div>
                </div>

                <div className="mk-panels">
                  <div className="mk-panel">
                    <div className="mk-panel-top">
                      <div>
                        <div className="mk-panel-title">Guardián · Asistente de Seguridad</div>
                        <div className="mk-panel-sub">Consulta sobre barrios, zonas y criminalidad en Medellín</div>
                      </div>
                      <div className="mk-ia-badge">IA</div>
                    </div>
                    <div className="mk-qs-label">PUEDES PREGUNTARLE SOBRE...</div>
                    <div className="mk-qs">
                      <div className="mk-q">¿Cuál es el barrio más seguro para vivir?</div>
                      <div className="mk-q">Quiero ir a trotar por La Candelaria, ¿es seguro?</div>
                      <div className="mk-q">Compara la seguridad entre Laureles y Buenos Aires</div>
                    </div>
                    <div className="mk-panel-cta-btn">Abrir Guardián →</div>
                  </div>

                  <div className="mk-panel">
                    <div className="mk-panel-title">Explorar Medellín</div>
                    <div className="mk-panel-sub">Zonas recomendadas para visitar</div>
                    <div className="mk-zones-list">
                      <div className="mk-zone"><div className="mk-zdot" style={{background:'#4ade80'}}></div><div><div className="mk-zname">El Poblado <span className="mk-ztag" style={{background:'rgba(74,222,128,.12)',color:'#4ade80'}}>TURÍSTICO</span></div><div className="mk-zdesc">Zona rosa, restaurantes y comercio seguro</div></div></div>
                      <div className="mk-zone"><div className="mk-zdot" style={{background:'#60a5fa'}}></div><div><div className="mk-zname">Laureles <span className="mk-ztag" style={{background:'rgba(96,165,250,.12)',color:'#60a5fa'}}>FAMILIAR</span></div><div className="mk-zdesc">Parques, barrio residencial y gastronomía</div></div></div>
                      <div className="mk-zone"><div className="mk-zdot" style={{background:'#818cf8'}}></div><div><div className="mk-zname">Envigado <span className="mk-ztag" style={{background:'rgba(129,140,248,.12)',color:'#818cf8'}}>RESIDENCIAL</span></div><div className="mk-zdesc">Tranquilo, fácil acceso al metro</div></div></div>
                      <div className="mk-zone"><div className="mk-zdot" style={{background:'#fb923c'}}></div><div><div className="mk-zname">El Centro <span className="mk-ztag" style={{background:'rgba(251,146,60,.12)',color:'#fb923c'}}>CULTURAL</span></div><div className="mk-zdesc">Historia, museos, Parque Berrío y el Metro</div></div></div>
                    </div>
                  </div>
                </div>

                <div className="mk-bot-cards">
                  <div className="mk-bot-card">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="var(--g)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
                    <div><div className="mk-bot-title">Servicios EPM</div><div className="mk-bot-desc">Análisis de facturas con IA. Recomendaciones de ahorro y predicción.</div><div className="mk-bot-link">Abrir módulo →</div></div>
                  </div>
                  <div className="mk-bot-card">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="var(--g)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
                    <div><div className="mk-bot-title">Noticias</div><div className="mk-bot-desc">Noticias verificadas de Medellín filtradas por categoría en tiempo real.</div><div className="mk-bot-link">Abrir módulo →</div></div>
                  </div>
                </div>
              </div>

              {/* RIGHT SIDEBAR */}
              <div className="mk-right">
                <div className="mk-rcard">
                  <div className="mk-rcard-title">Ciudad Inteligente</div>
                  <div className="mk-rcard-body">MECIA integra <strong>datos reales</strong> de Medellín: seguridad, servicios públicos y noticias en tiempo real.</div>
                  <div className="mk-rcard-badge">Medellín · Valle de Aburrá</div>
                  <div className="mk-connected">✓ Conectado</div>
                </div>
                <div className="mk-rcard">
                  <div className="mk-rcard-title">Seguridad · Resumen</div>
                  <div className="mk-sec-grid">
                    <div className="mk-sec-item"><div className="mk-sec-label">COMUNAS</div><div className="mk-sec-val">21</div></div>
                    <div className="mk-sec-item"><div className="mk-sec-label">CASOS TOTALES</div><div className="mk-sec-val mk-stat-red">296k</div></div>
                    <div className="mk-sec-item"><div className="mk-sec-label">TASA PROMEDIO</div><div className="mk-sec-val">133.3</div></div>
                    <div className="mk-sec-item"><div className="mk-sec-label">+ AFECTADA</div><div className="mk-sec-val mk-stat-sm">LA CANDELARIA</div></div>
                  </div>
                </div>
                <div className="mk-rcard">
                  <div className="mk-rcard-title">Noticias recientes</div>
                  <div className="mk-rnews"><div className="mk-rnews-src">JORNADA.COM.MX</div><div className="mk-rnews-title">Nombra la Unesco a Medellín Capital Mundial del Libro 2027</div></div>
                  <div className="mk-rnews"><div className="mk-rnews-src">FINOFILIPINO.ORG</div><div className="mk-rnews-title">La transformación de Madrid en Medellín está casi completada.</div></div>
                </div>
              </div>

            </div>
          </div>
        </div>
      </div>

      {/* ══ CURVED DIVIDER ══ */}
      <div className="curve-divider">
        <svg viewBox="0 0 1440 110" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg" style={{height:'110px'}}>
          <path className="curve-fill" d="M0,0 C200,100 500,110 720,110 C940,110 1240,100 1440,0 L1440,110 L0,110 Z"/>
          <path className="curve-line" d="M0,0 C200,100 500,110 720,110 C940,110 1240,100 1440,0" fill="none" strokeWidth="1"/>
        </svg>
        <div className="curve-circle" id="curve-scroll">
          <svg viewBox="0 0 24 24" fill="none" stroke="var(--g)" strokeWidth="2.5">
            <polyline points="6 9 12 15 18 9"/>
          </svg>
        </div>
      </div>
    </section>
  );
}
