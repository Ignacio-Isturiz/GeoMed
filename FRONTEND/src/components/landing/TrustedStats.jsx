import React from 'react';

const LOGOS_DARK = [
  { src: '/alcaldia.png', alt: 'Alcaldía de Medellín', large: true },
  { src: '/epm.png',      alt: 'EPM' },
  { src: '/dane.png',     alt: 'DANE' },
];
const LOGOS_LIGHT = [
  { src: '/alcaldiaB.png', alt: 'Alcaldía de Medellín', large: true },
  { src: '/epmB.png',      alt: 'EPM' },
  { src: '/daneB.png',     alt: 'DANE' },
];

// 10× repeat — enough to fill any screen; animate -50% for seamless loop
const R = 10;
const TRACK_DARK  = Array.from({length: R}, () => LOGOS_DARK).flat();
const TRACK_LIGHT = Array.from({length: R}, () => LOGOS_LIGHT).flat();

export function TrustedLogos() {
  return (
    <div className="trusted sec-mid">
      <div className="trusted-lbl">Fuentes de datos verificadas</div>
      <div className="logos-carousel-outer">
        {/* Dark mode track */}
        <div className="logos-carousel-track logos-track-dark">
          {TRACK_DARK.map((logo, i) => (
            <img
              key={i}
              src={logo.src}
              alt={logo.alt}
              className={`logo-carousel-img${logo.large ? ' logo-carousel-img--large' : ''}`}
            />
          ))}
        </div>
        {/* Light mode track */}
        <div className="logos-carousel-track logos-track-light">
          {TRACK_LIGHT.map((logo, i) => (
            <img
              key={i}
              src={logo.src}
              alt={logo.alt}
              className={`logo-carousel-img${logo.large ? ' logo-carousel-img--large' : ''}`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

export function StatsStrip() {
  return (
    <div className="sec-mid sp-sm">
      <div className="w">
        <div style={{maxWidth:'840px',margin:'0 auto'}}>
          <div className="stats-strip">
            <div className="st-it"><div className="st-n" id="s1">0</div><div className="st-l">Tasa de criminalidad en Medellín (casos por cada 1.000 hab.)</div></div>
            <div className="st-it"><div className="st-n" id="s2">0</div><div className="st-l">Casos en las 3 comunas más afectadas</div></div>
            <div className="st-it"><div className="st-n" id="s3">0</div><div className="st-l">Casos reportados en La Candelaria</div></div>
          </div>
        </div>
      </div>
    </div>
  );
}
