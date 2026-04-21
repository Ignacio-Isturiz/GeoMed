export default function Features() {
  return (
    <section id="features" className="sec-trans sp">
      <div className="w">
        <div className="sh">
          <div className="eye">Características del Proyecto</div>
          <h2 className="d3" style={{marginTop:'12px'}}>Todo lo que necesitas para<br/>entender tu ciudad</h2>
          <p className="body-md" style={{marginTop:'14px'}}>Seguridad y servicios públicos al alcance de todos.</p>
        </div>

        <div className="feat-grid">
          {[
            {
              title: 'Seguridad en Tiempo Real',
              desc: 'Zonas de riesgo, alertas activas y recomendaciones del Chatbot Guardián con datos de la Secretaría de Seguridad de Medellín.',
              tag: 'Secretaría de Seguridad MDE',
              icon: <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
            },
            {
              title: 'Servicios Públicos',
              desc: 'Revisa tu factura EPM, entiende tu consumo mensual y recibe alertas útiles para anticiparte a cambios en tus servicios.',
              tag: 'EPM · Consumo · Alertas',
              icon: <><circle cx="12" cy="12" r="3"/><path d="M12 1v4M12 19v4M4.22 4.22l2.83 2.83M16.95 16.95l2.83 2.83M1 12h4M19 12h4M4.22 19.78l2.83-2.83M16.95 7.05l2.83-2.83"/></>
            },
            {
              title: 'Chatbot Guardián',
              desc: 'Asistente de seguridad que responde en lenguaje natural sobre zonas, horarios y recomendaciones según tu ubicación y la hora.',
              tag: 'IA + datos ciudad',
              icon: <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
            },
            {
              title: 'Noticias de tu Barrio',
              desc: 'Curación automática: cortes de agua, eventos culturales, obras viales y comunicados de la Alcaldía filtrados por tu zona.',
              tag: 'Alcaldía · Prensa oficial',
              icon: <><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></>
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
