export default function Features() {
  return (
    <section id="features" className="sec-trans sp">
      <div className="w">
        <div className="sh">
          <div className="eye">Características del Proyecto</div>
          <h2 className="d3" style={{marginTop:'12px'}}>Comprende la movilidad de tu ciudad<br/>en tiempo real</h2>
          <p className="body-md" style={{marginTop:'14px'}}>Análisis de tráfico, transporte público y ciclorrutas integradas.</p>
        </div>

        <div className="feat-grid">
          {[
            {
              title: 'Volumen de Tráfico',
              desc: 'Monitoreo constante del flujo vehicular en los principales corredores de Medellín. Datos precisos para entender la densidad del tráfico por hora.',
              tag: '12.4k veh/h promedio',
              icon: <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>
            },
            {
              title: 'Zonas Congestionadas',
              desc: 'Identificación instantánea de puntos críticos y cuellos de botella. Visualiza las comunas con mayor presión vehicular en tiempo real.',
              tag: '45 Corredores Críticos',
              icon: <><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></>
            },
            {
              title: 'Tendencias de Movilidad',
              desc: 'Análisis predictivo de patrones de desplazamiento. Optimiza tus rutas basándote en el comportamiento histórico y proyecciones de IA.',
              tag: '98% Precisión IA',
              icon: <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
            },
            {
              title: 'Red de Ciclorrutas',
              desc: 'Información detallada sobre la infraestructura para movilidad activa. Consulta la disponibilidad y estado de las ciclorrutas en tiempo real.',
              tag: '120km de Red Activa',
              icon: <><circle cx="5.5" cy="17.5" r="3.5"/><circle cx="18.5" cy="17.5" r="3.5"/><path d="M15 6a1 1 0 1 0 0-2 1 1 0 0 0 0 2zm-3 11.5V14l-3-3 4-3 2 3h2"/></>
            }
          ].map((feat, idx) => (
            <div className="fcard feat-card" key={idx}>
              <div className="fcard-ico">
                <svg viewBox="0 0 24 24" fill="none" stroke="var(--g)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  {feat.icon}
                </svg>
              </div>
              <div className="fcard-title">{feat.title}</div>
              <div className="fcard-desc">{feat.desc}</div>
              <div className="fcard-tag">{feat.tag}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}