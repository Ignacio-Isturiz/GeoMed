import React, { Suspense, lazy, useState, useEffect, useRef } from 'react';

const Spline = lazy(() => import('@splinetool/react-spline'));

const SplineLoader = () => (
  <div style={{
    width: '100%', height: '520px', display: 'flex', alignItems: 'center',
    justifyContent: 'center', background: 'rgba(255,255,255,0.02)', borderRadius: '18px'
  }}>
    <div className="logo-mark animate-pulse" style={{ width: '40px', height: '40px' }}>
      <svg width="20" height="20" viewBox="0 0 36 36" fill="none">
        <path d="M6 8C6 6.9 6.9 6 8 6H22C22 6 28 6 28 12V20" stroke="white" strokeWidth="3.4" strokeLinecap="round"/>
        <path d="M6 8V28C6 29.1 6.9 30 8 30H28" stroke="white" strokeWidth="3.4" strokeLinecap="round"/>
        <circle cx="25" cy="10" r="3" fill="white"/>
      </svg>
    </div>
  </div>
);

const FAQ_ITEMS = [
  {
    q: '¿Qué hace esta plataforma?',
    a: 'Es una herramienta que ayuda a tomar decisiones usando datos de Medellín, tanto para emprender como para mejorar la vida en la ciudad.'
  },
  {
    q: '¿Qué tipo de datos utiliza?',
    a: 'Utiliza datos de seguridad, servicios públicos y actividad económica para analizar qué tan viable es una zona y qué decisiones se pueden tomar en ella.'
  },
  {
    q: '¿Cómo ayuda a emprendedores?',
    a: 'Permite identificar en qué zonas es mejor abrir o mejorar un negocio, recomendando tipos de negocio según las condiciones del entorno.'
  },
  {
    q: '¿Cómo ayuda a ciudadanos?',
    a: 'Sugiere decisiones como a dónde ir o qué hacer, teniendo en cuenta factores como seguridad y condiciones del entorno.'
  },
  {
    q: '¿Qué hace diferente esta solución?',
    a: 'No solo muestra datos, los interpreta y los convierte en recomendaciones claras para personas que no saben analizarlos.'
  },
  {
    q: '¿Se pueden encontrar oportunidades nuevas?',
    a: 'Sí. El sistema identifica zonas donde hay actividad pero falta cierto tipo de negocio, mostrando oportunidades que no son evidentes.'
  },
  {
    q: '¿Es viable en la vida real?',
    a: 'Sí. Funciona con datos abiertos y puede implementarse como una herramienta accesible para apoyar decisiones reales en la ciudad.'
  },
];

export default function FAQ() {
  const [inView, setInView] = useState(false);
  const sectionRef = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setInView(true);
        observer.disconnect();
      }
    }, { rootMargin: '500px' });

    if (sectionRef.current) observer.observe(sectionRef.current);
    return () => observer.disconnect();
  }, []);

  return (
    <section id="faq" ref={sectionRef} className="sec-trans sp">
      <div className="w">
        <div className="sh">
          <div className="eye">Preguntas Frecuentes</div>
          <h2 className="d3" style={{marginTop:'12px'}}>Todo lo que necesitas saber</h2>
        </div>
        <div className="faq-layout">
          <div className="faq-sticky">
            <div style={{
              minHeight: '480px',
              borderRadius: '18px',
              overflow: 'hidden',
              position: 'sticky',
              top: '100px'
            }}>
              {inView ? (
                <Suspense fallback={<SplineLoader />}>
                  <Spline
                    scene="https://prod.spline.design/zs6aYoLKRBxwRElM/scene.splinecode"
                    style={{ width: '100%', height: '580px' }}
                  />
                </Suspense>
              ) : <SplineLoader />}
            </div>
          </div>
          <div className="faq-list">
            {FAQ_ITEMS.map((item, idx) => (
              <div className="faq-it" key={idx}>
                <div className="faq-q">{item.q}<div className="faq-plus">+</div></div>
                <div className="faq-ans"><div className="faq-ans-in">{item.a}</div></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
