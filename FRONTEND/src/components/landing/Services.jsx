import React from 'react';

export default function Services() {
  return (
    <section id="services" className="sec-accent sp">
      <div className="w">
        <div className="sh">
          <div className="eye">Servicios</div>
          <h2 className="d3" style={{marginTop:'12px'}}>Una suite para cada módulo</h2>
          <p className="body-md" style={{marginTop:'14px'}}>Seguridad, movilidad y servicios públicos, integrados.</p>
        </div>
        
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'28px',marginBottom:'48px',alignItems:'center'}}>
          <div className="slot" id="slot2" style={{minHeight:'240px'}}>
            <div className="slot-badge">🔲 THREE.JS — SLOT #2</div>
            <div className="slot-ico">
              <svg viewBox="0 0 24 24" fill="none" stroke="var(--g)" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/><path d="M2 12h20"/>
              </svg>
            </div>
            <div className="slot-lbl">Mapa 3D Valle de Aburrá</div>
            <div className="slot-sub">deck.gl · Mapbox GL · GeoJSON Alcaldía</div>
          </div>
          
          <div style={{padding:'10px 0',display:'flex',flexDirection:'column',gap:'16px'}}>
            <div className="eye" style={{justifyContent:'flex-start'}}>Cobertura total</div>
            <h3 style={{fontFamily:'var(--fh)',fontWeight:800,fontSize:'clamp(22px,3vw,34px)',color:'var(--txt)',lineHeight:1.15,letterSpacing:'-.03em'}}>Los 16 comunas de Medellín en una sola plataforma</h3>
            <p className="body-md">Desde Manrique hasta Envigado, MECIA agrega información oficial de todo el Área Metropolitana del Valle de Aburrá con actualización continua.</p>
            <div style={{display:'flex',gap:'12px'}}>
              <a href="#" className="btn btn-g">Explorar el Mapa →</a>
              <a href="#" className="btn btn-outline">Ver Cobertura</a>
            </div>
          </div>
        </div>

        <div className="svc-grid">
          {[
            {title:'MECIA Seguridad', desc:'Mapa de calor, alertas activas y el Chatbot Guardián. Recomendaciones en tiempo real según tu ubicación y hora.', icon: <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>},
            {title:'Movilidad Inteligente', desc:'Estado del Metro, Metroplús y ciclovías. Planifica tus desplazamientos con datos actualizados cada 2 minutos.', icon: <><path d="M3 12h18M3 6h18M3 18h18"/><circle cx="12" cy="12" r="3"/></>},
            {title:'Servicios Públicos', desc:'Factura EPM, historial de consumo y predicciones. Reporta cortes y recibe alertas de mantenimiento programado.', icon: <><circle cx="12" cy="12" r="3"/><path d="M12 1v4M12 19v4M4.22 4.22l2.83 2.83M16.95 16.95l2.83 2.83M1 12h4M19 12h4"/></>},
            {title:'Guardián Chatbot', desc:'Pregunta por zonas seguras, horarios, eventos o solicita recomendaciones basadas en tu contexto en real.', icon: <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>},
            {title:'MECIA en Telegram', desc:'Todas las alertas y consultas desde Telegram sin necesidad de abrir la app. Ideal para uso sin datos móviles.', icon: <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.19 12a19.79 19.79 0 0 1-2.07-8.5A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/>},
            {title:'API para Desarrolladores', desc:'Integra datos de seguridad, movilidad y servicios de Medellín en tus aplicaciones. REST API documentada y gratuita.', icon: <><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></>}
          ].map((svc, idx) => (
            <div className="svc" key={idx}>
              <div className="svc-ico">
                <svg viewBox="0 0 24 24" fill="none" stroke="var(--g)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  {svc.icon}
                </svg>
              </div>
              <div className="svc-title">{svc.title}</div>
              <div className="svc-desc">{svc.desc}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
