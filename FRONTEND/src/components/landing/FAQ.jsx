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
    q: '¿Cómo puedo evitar congestión en Medellín?',
    a: 'Consulta GEOMED para obtener recomendaciones en tiempo real sobre corredores alternativos, horarios de menor tráfico y tiempo estimado de viaje según la hora del día.'
  },
  {
    q: '¿Qué fuentes de datos utiliza GEOMED?',
    a: 'Integra datos del SIMM Traffic (velocidad, volumen vehicular), Aforos de transporte, ciclorrutas disponibles, proyecciones de movilidad y patrones de flujo en vías principales.'
  },
  {
    q: '¿Cómo el análisis de movilidad mejora mi transporte diario?',
    a: 'Identifica zonas críticas, sugiere rutas alternas, optimiza horarios de viaje y predice congestión, ahorrándote tiempo y combustible en tu desplazamiento.'
  },
  {
    q: '¿Qué diferencia tiene GEOMED de otras soluciones?',
    a: 'No solo muestra congestión: interpreta datos de movilidad y genera recomendaciones inteligentes basadas en IA para cada usuario según su ubicación y hora.'
  },
  {
    q: '¿Puedo planificar rutas de cicloruta en GEOMED?',
    a: 'Sí. Visualiza todas las ciclorrutas disponibles, consulta sobre seguridad de rutas, duración estimada y lugares de parada cercanos en tiempo real.'
  },
  {
    q: '¿Es GEOMED accesible para todos los ciudadanos?',
    a: 'Sí. Funciona con datos públicos, es accesible vía web, y está diseñado para apoyar decisiones de movilidad reales en Medellín para todas las personas.'
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