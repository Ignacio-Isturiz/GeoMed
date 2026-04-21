import React from 'react';

export default function Blog() {
  return (
    <section id="blog" className="sec-mid sp">
      <div className="w">
        <div className="blog-main">
          {[
            {
              cat: 'Seguridad',
              title: 'Cómo el Chatbot Guardián de MECIA está ayudando a los medellinenses a moverse más seguros',
              excerpt: 'Desde su lanzamiento, el Asistente Guardián ha resuelto más de 120.000 consultas de seguridad ciudadana.',
              author: 'Equipo MECIA',
              date: '18 Mar 2025',
              icon: <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
            },
            {
              cat: 'Movilidad',
              title: 'Metro de Medellín: las 3 estaciones con más retrasos y cómo planificar mejor tus rutas',
              excerpt: 'Analizamos 6 meses de datos operativos del Metro para darte las recomendaciones más útiles.',
              author: 'Ana Torres',
              date: '12 Mar 2025',
              color: 'linear-gradient(135deg,#0ea5e9,#38bdf8)',
              icon: <><path d="M3 12h18M3 6h18M3 18h18"/><circle cx="12" cy="12" r="3"/></>
            },
            {
              cat: 'Servicios',
              title: 'Tu recibo EPM: cómo leer los indicadores y predecir tu próximo cobro con MECIA',
              excerpt: 'MECIA te explica cada ítem de tu factura y cómo el contexto climático afecta tu consumo.',
              author: 'Luis Pérez',
              date: '7 Mar 2025',
              color: 'linear-gradient(135deg,#f97316,#fb923c)',
              icon: <><circle cx="12" cy="12" r="3"/><path d="M12 1v4M12 19v4M4.22 4.22l2.83 2.83M16.95 16.95l2.83 2.83M1 12h4M19 12h4"/></>
            }
          ].map((post, idx) => (
            <div className="blog-h" key={idx}>
              <div className="blog-h-thumb">
                <div className="blog-h-thumb-bg"></div>
                <div className="blog-h-ph-badge">📷 IMG</div>
                <div className="blog-h-thumb-ico">
                  <svg viewBox="0 0 24 24" fill="none" stroke="var(--g)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    {post.icon}
                  </svg>
                </div>
              </div>
              <div className="blog-h-body">
                <span className="blog-cat">{post.cat}</span>
                <div className="blog-h-title">{post.title}</div>
                <div className="blog-h-excerpt">{post.excerpt}</div>
                <div className="blog-h-meta">
                  <div className="blog-h-author">
                    <div className="blog-av" style={post.color ? {background: post.color} : {}}></div>
                    <span>{post.author}</span>
                  </div>
                  <span>{post.date}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
