import React from 'react';

export default function Insights() {
  return (
    <section className="sec-trans sp">
      <div className="w">
        <div className="sh">
          <div className="eye">Valuable Insights</div>
          <h2 className="d3" style={{marginTop:'12px'}}>Análisis para decisiones<br/><em className="d-italic">más inteligentes</em></h2>
          <p className="body-md" style={{marginTop:'14px'}}>Nuestro equipo analiza las tendencias más relevantes de Medellín cada semana.</p>
        </div>
        <div className="ins-grid">
          <div className="ins">
            <div className="ins-vis"><div className="ins-grid-bg"></div><div className="ins-bars"><div className="ib" style={{width:'18px',height:'28px'}}></div><div className="ib" style={{width:'18px',height:'44px'}}></div><div className="ib" style={{width:'18px',height:'30px'}}></div><div className="ib hi" style={{width:'18px',height:'62px'}}></div><div className="ib" style={{width:'18px',height:'46px'}}></div><div className="ib" style={{width:'18px',height:'38px'}}></div></div></div>
            <div className="ins-body">
              <div className="ins-cat">Seguridad</div>
              <div className="ins-title">Zonas más seguras de El Poblado en el segundo semestre de 2024</div>
              <div className="ins-footer"><span>Mar 2025 · 5 min</span><span style={{color:'var(--g)'}}>→</span></div>
            </div>
          </div>
          <div className="ins">
            <div className="ins-vis">
              <div className="ins-grid-bg"></div>
              <div style={{position:'relative',zIndex:1,width:'90%',height:'68px'}}>
                <svg viewBox="0 0 230 68" width="100%" height="100%" preserveAspectRatio="none">
                  <defs><linearGradient id="ig1" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#00C896" stopOpacity=".26"/><stop offset="100%" stopColor="#00C896" stopOpacity="0"/></linearGradient></defs>
                  <polygon points="0,66 30,54 60,58 90,40 115,44 145,24 175,18 205,10 230,5 230,68 0,68" fill="url(#ig1)"/>
                  <polyline points="0,66 30,54 60,58 90,40 115,44 145,24 175,18 205,10 230,5" fill="none" stroke="var(--g)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
            </div>
            <div className="ins-body">
              <div className="ins-cat">Movilidad</div>
              <div className="ins-title">Metro de Medellín: tendencias de demora y líneas más afectadas en 2024</div>
              <div className="ins-footer"><span>Feb 2025 · 6 min</span><span style={{color:'var(--g)'}}>→</span></div>
            </div>
          </div>
          <div className="ins">
            <div className="ins-vis"><div className="ins-grid-bg"></div><div className="ins-bars"><div className="ib" style={{width:'18px',height:'48px'}}></div><div className="ib" style={{width:'18px',height:'30px'}}></div><div className="ib hi" style={{width:'18px',height:'60px'}}></div><div className="ib" style={{width:'18px',height:'40px'}}></div><div className="ib" style={{width:'18px',height:'52px'}}></div><div className="ib" style={{width:'18px',height:'36px'}}></div></div></div>
            <div className="ins-body">
              <div className="ins-cat">Servicios</div>
              <div className="ins-title">Consumo de agua en Laureles supera 14% el promedio histórico de Medellín</div>
              <div className="ins-footer"><span>Ene 2025 · 8 min</span><span style={{color:'var(--g)'}}>→</span></div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
