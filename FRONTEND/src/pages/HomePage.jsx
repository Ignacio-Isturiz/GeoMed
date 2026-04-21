import React, { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { initLandingPageAnimation } from './HomePageAnimation';

function useNavScroll() {
  useEffect(() => {
    let lastY = window.scrollY;
    const nav = document.getElementById('nav');
    const onScroll = () => {
      const y = window.scrollY;
      if (y < 60) {
        nav?.classList.remove('nav--hidden');
      } else if (y > lastY) {
        nav?.classList.add('nav--hidden');
      } else {
        nav?.classList.remove('nav--hidden');
      }
      lastY = y;
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);
}

// Landing Components
import Hero from '@/components/landing/Hero';
import { TrustedLogos, StatsStrip } from '@/components/landing/TrustedStats';
import Features from '@/components/landing/Features';
import FAQ from '@/components/landing/FAQ';
import Roles from '@/components/landing/Roles';
import Footer from '@/components/landing/Footer';

export default function HomePage() {
  useNavScroll();
  const containerRef = useRef(null);

  useEffect(() => {
    // Delay initialization slightly to let the browser prioritize LCP (hero text)
    const timeout = setTimeout(() => {
      const cleanup = initLandingPageAnimation(containerRef.current);
      window._mecia_cleanup = cleanup;
    }, 150); // Increased 150ms for even better LCP priority

    return () => {
      clearTimeout(timeout);
      if (window._mecia_cleanup) window._mecia_cleanup();
    };
  }, []);

  return (
    <div ref={containerRef}>

      {/* ══ WEBGL CANVAS ══ */}
      <div className="hero-canvas-bg">
        <canvas id="city-canvas"></canvas>
      </div>

      {/* ══ NAVBAR ══ */}
      <header id="nav">
        <Link className="logo" to="/">
          <img src="/mecialogoog.png" alt="MECIA" style={{ height: '36px', width: 'auto' }} />
        </Link>
        <nav className="nav-links">
          <a href="#" className="active">Inicio</a>
          <a href="#features">Características</a>
          <a href="#faq">Preguntas</a>
          <a href="#roles">Explorar</a>
        </nav>
        <div className="nav-r">
          <button className="theme-btn" id="theme-btn">
            <svg className="sun" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/>
              <line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/>
              <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/>
              <line x1="21" y1="12" x2="23" y2="12"/>
            </svg>
            <svg className="moon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
            </svg>
          </button>
          <Link to="/login" className="btn btn-outline" style={{padding:'9px 20px',fontSize:'13px'}} viewTransition>Iniciar Sesión</Link>
          <Link to="/register" className="btn btn-g" style={{padding:'9px 20px',fontSize:'13px'}} viewTransition>Explorar MECIA →</Link>
        </div>
      </header>

      {/* ══ TELEGRAM FLOATING BUTTON ══ */}
      <a
        href="https://t.me/MECIA_bot"
        target="_blank"
        rel="noopener noreferrer"
        className="tg-fab"
        aria-label="Abrir bot de Telegram"
      >
        <svg viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2zm4.93 6.793-1.784 8.4c-.13.58-.47.72-.953.45l-2.63-1.938-1.27 1.22c-.14.14-.258.258-.527.258l.188-2.676 4.863-4.393c.21-.188-.047-.293-.327-.105L7.93 14.47l-2.598-.813c-.565-.177-.577-.565.118-.836l10.155-3.914c.47-.17.882.115.726.886z"/>
        </svg>
        <span className="tg-fab-label">Bot de Telegram</span>
      </a>

      {/* ══ SECTIONS ══ */}
      <Hero />
      <TrustedLogos />
      <StatsStrip />
      <Features />
      <Roles />
      <FAQ />
      <Footer />
    </div>
  );
}