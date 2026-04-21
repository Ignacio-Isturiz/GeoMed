import React from 'react';

export default function UseCases() {
  return (
    <section className="sec-mid sp">
      <div className="w">
        <div className="sh">
          <div className="eye">Casos de Uso</div>
          <h2 className="d3" style={{marginTop:'12px'}}>¿Quién usa MECIA?</h2>
          <p className="body-md" style={{marginTop:'14px'}}>Desde familias hasta entidades públicas, MECIA se adapta a cada necesidad.</p>
        </div>
        <div className="casos-grid">
          {[
            {
              num: '01',
              title: 'Ciudadanos de Medellín',
              desc: 'Consulta si tu barrio es seguro, el estado de tu factura EPM, cuánto tardará el Metro o si hay alerta de lluvia antes de salir.',
              tags: ['Seguridad barrial', 'Factura EPM', 'Metro MDE'],
              icon: <><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></>
            },
            {
              num: '02',
              title: 'Emprendedores y PYMEs',
              desc: 'Identifica zonas con mayor afluencia antes de abrir un local. Analiza el contexto de seguridad e indicadores económicos zonales.',
              tags: ['Afluencia zonal', 'Riesgo operacional', 'Oportunidad'],
              icon: <><path d="M20 7H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2z"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></>
            },
            {
              num: '03',
              title: 'Entidades Públicas',
              desc: 'Monitorea KPIs de gestión, comunica alertas a ciudadanos de forma proactiva y compara indicadores entre comunas.',
              tags: ['KPIs gestión', 'Transparencia', 'Comparación comunas'],
              icon: <><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></>
            },
            {
              num: '04',
              title: 'Academia e Investigación',
              desc: 'Accede a datasets estructurados de movilidad, seguridad y servicios para tesis, publicaciones y proyectos de la ciudad.',
              tags: ['Open data', 'API acceso', 'CSV / JSON'],
              icon: <><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></>
            }
          ].map((item, idx) => (
            <div className="caso" key={idx}>
              <div className="caso-vis">
                <div className="caso-vis-bg"></div>
                <div className="caso-num">{item.num}</div>
                <div className="caso-icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="var(--g)" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
                    {item.icon}
                  </svg>
                </div>
              </div>
              <div className="caso-body">
                <div className="caso-title">{item.title}</div>
                <div className="caso-desc">{item.desc}</div>
                <div className="tags">
                  {item.tags.map((tag, tidx) => <span className="tag" key={tidx}>{tag}</span>)}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
