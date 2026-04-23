import { Link } from 'react-router-dom';

export default function Hero() {
  return (
    <section className="hero sec-trans">
      <div className="orb-field">
        <div className="orb orb-teal" style={{ width: '700px', height: '700px', top: '-15%', left: '35%', transform: 'translateX(-50%)', opacity: .9 }}></div>
        <div className="orb orb-blue" style={{ width: '500px', height: '500px', top: '20%', right: '-10%', opacity: .7 }}></div>
        <div className="orb orb-indigo" style={{ width: '400px', height: '400px', bottom: '5%', left: '5%', opacity: .5 }}></div>
      </div>

      <div className="hero-upper w">
        <div className="hero-lozenge" id="hl">
          <div className="hero-lozenge-dot">✦</div>
          Inteligencia Vial para Medellín
        </div>
        <h1 className="hero-title" id="htitle">
          Medellín en <em>Movimiento.</em><br />Tu Ciudad en Tiempo Real.
        </h1>
        <p className="hero-sub" id="hsub">
          Analiza el flujo vehicular, transporte público y ciclorrutas en un solo dashboard inteligente. GEOMED transforma datos abiertos en decisiones de movilidad claras para ti.
        </p>
        <div className="hero-btns" id="hbtns">
          <Link to="/dashboard" className="btn btn-g" id="hero-cta">Explorar Dashboard →</Link>
          <a href="#hdash" className="btn btn-outline">Ver Simulación</a>
        </div>

        {/* MOCKUP */}
        <div className="hero-dash-wrap" id="hdash">
          <div className="mk">
            {/* ── Top bar ── */}
            <div className="mk-top">
              <div className="mk-breadcrumb">
                <span className="mk-bc-main">GEOMED</span>
                <span className="mk-bc-sep"> › </span>
                <span className="mk-bc-chip">Ciudadano / Federico</span>
              </div>
              <div className="mk-top-r">
                <div className="mk-top-ico"><svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><path d="M12 16v-4M12 8h.01" /></svg></div>
                <div className="mk-top-ico"><svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" /></svg></div>
                <div className="mk-av">SR</div>
              </div>
            </div>

            {/* ── Body: sidebar + center + right ── */}
            <div className="mk-body">

              {/* LEFT SIDEBAR */}
              <div className="mk-sidebar">
                <div className="mk-sidebar-logo">
                  <img src="/geomedlogoog.png" alt="GEOMED" style={{ height: '16px', width: 'auto' }} />
                  <span>GEOMED</span>
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
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><polyline points="9 22 9 12 15 12 15 22" /></svg>
                    Inicio
                  </div>
                </div>
                <div className="mk-sidebar-bottom">
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" /></svg>
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
                  <div className="mk-stat-card"><div className="mk-stat-label">CORREDORES ACTIVOS</div><div className="mk-stat-val">45</div></div>
                  <div className="mk-stat-card"><div className="mk-stat-label">VEHÍCULOS/HORA</div><div className="mk-stat-val mk-stat-val-lg">12.4k</div></div>
                  <div className="mk-stat-card"><div className="mk-stat-label">VELOCIDAD PROMEDIO</div><div className="mk-stat-val">28 km/h</div></div>
                  <div className="mk-stat-card"><div className="mk-stat-label">ZONA MÁS CONGESTIONADA</div><div className="mk-stat-val mk-stat-sm">AVENIDA REGIONAL</div></div>
                </div>

                <div className="mk-tabs-row">
                  <div className="mk-tab mk-tab--active"><span className="mk-tab-dot"></span>Movilidad</div>
                  <div className="mk-tab">Ciclorrutas</div>
                  <div className="mk-tab-cta">Consultar IA →</div>
                </div>

                <div className="mk-bot-cards">
                  <div className="mk-bot-card">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="var(--g)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>
                    <div><div className="mk-bot-title">Alertas de Tráfico</div><div className="mk-bot-desc">Consulta cierres viales y eventos de movilidad en tiempo real.</div><div className="mk-bot-link">Ver mapa interactivo →</div></div>
                  </div>
                </div>
              </div>

              {/* RIGHT SIDEBAR */}
              <div className="mk-right">
                <div className="mk-rcard">
                  <div className="mk-rcard-title">Movilidad Inteligente</div>
                  <div className="mk-rcard-body">GEOMED integra <strong>datos reales</strong> de Medellín: tráfico, transporte público y ciclorrutas en tiempo real.</div>
                  <div className="mk-rcard-badge">Medellín · Secretaría de Movilidad</div>
                  <div className="mk-connected">✓ En Línea</div>
                </div>
                <div className="mk-rcard">
                  <div className="mk-rcard-title">Corredores Críticos</div>
                  <div className="mk-rnews"><div className="mk-rnews-src">AV. REGIONAL</div><div className="mk-rnews-title">Alta congestión en sentido Norte-Sur.</div></div>
                  <div className="mk-rnews"><div className="mk-rnews-src">AV. ORIENTAL</div><div className="mk-rnews-title">Flujo moderado, sin incidentes reportados.</div></div>
                </div>
              </div>

            </div>
          </div>
        </div>
      </div>

      {/* ══ CURVED DIVIDER ══ */}
      <div className="curve-divider">
        <svg viewBox="0 0 1440 110" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg" style={{ height: '110px' }}>
          <path className="curve-fill" d="M0,0 C200,100 500,110 720,110 C940,110 1240,100 1440,0 L1440,110 L0,110 Z" />
          <path className="curve-line" d="M0,0 C200,100 500,110 720,110 C940,110 1240,100 1440,0" fill="none" strokeWidth="1" />
        </svg>
        <div className="curve-circle" id="curve-scroll">
          <svg viewBox="0 0 24 24" fill="none" stroke="var(--g)" strokeWidth="2.5">
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </div>
      </div>
    </section>
  );
}