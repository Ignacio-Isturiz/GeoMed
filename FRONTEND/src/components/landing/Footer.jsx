import React from 'react';

export default function Footer() {
  const scrollToTop = () => window.scrollTo({ top: 0, behavior: 'smooth' });

  return (
    <div className="footer-shell">
      <div className="footer-card">
        <div className="fg">
          <div>
            <a className="fl" href="#">
              <div className="logo-mark"><svg width="16" height="16" viewBox="0 0 36 36" fill="none"><path d="M6 8C6 6.9 6.9 6 8 6H22C22 6 28 6 28 12V20" stroke="white" strokeWidth="3.4" strokeLinecap="round"/><path d="M6 8V28C6 29.1 6.9 30 8 30H28" stroke="white" strokeWidth="3.4" strokeLinecap="round"/><circle cx="25" cy="10" r="3" fill="white"/></svg></div>
              <span className="fl-text">MECIA</span>
            </a>
            <p className="f-tag">Inteligencia ciudadana para Medellín. Seguridad, movilidad y servicios públicos en un solo dashboard.</p>
            <div className="f-socs">
              <a href="https://x.com/AlcaldiadeMED" target="_blank" rel="noreferrer" className="fsoc"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M23 3a10.9 10.9 0 0 1-3.14 1.53 4.48 4.48 0 0 0-7.86 3v1A10.66 10.66 0 0 1 3 4s-4 9 5 13a11.64 11.64 0 0 1-7 2c9 5 20 0 20-11.5a4.5 4.5 0 0 0-.08-.83A7.72 7.72 0 0 0 23 3z"/></svg></a>
              <a href="https://www.instagram.com/semillerounabot/" target="_blank" rel="noreferrer" className="fsoc"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="2" width="20" height="20" rx="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/></svg></a>
              <a href="https://www.linkedin.com/company/alcaldia-de-medellin/" target="_blank" rel="noreferrer" className="fsoc"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"/><rect x="2" y="9" width="4" height="12"/><circle cx="4" cy="4" r="2"/></svg></a>
              <a href="https://github.com/Ignacio-Isturiz/MECIA-" target="_blank" rel="noreferrer" className="fsoc"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"/></svg></a>
            </div>
          </div>
          <div className="fcol"><h4>Plataforma</h4><ul><li><a href="#">Dashboard</a></li><li><a href="#">Módulo Seguridad</a></li><li><a href="#">Módulo Servicios</a></li><li><a href="#">Módulo Movilidad</a></li><li><a href="#">Chatbot Guardián</a></li></ul></div>
          <div className="fcol"><h4>Recursos</h4><ul><li><a href="#">Documentación</a></li><li><a href="#">Blog</a></li><li><a href="#">Casos de Uso</a></li><li><a href="#">Open Data</a></li><li><a href="https://github.com/Ignacio-Isturiz/MECIA-" target="_blank" rel="noreferrer">GitHub</a></li></ul></div>
          <div className="fcol"><h4>Accesos</h4><ul><li><a href="#">Explorar Datos</a></li><li><a href="#">Telegram</a></li><li><a href="#">Reportar Error</a></li><li><a href="#">Ayuda</a></li></ul></div>
          <div className="fcol"><h4>Legal</h4><ul><li><a href="#">Términos de Uso</a></li><li><a href="#">Privacidad</a></li><li><a href="#">Cookies</a></li><li><a href="#">Licencias</a></li><li><a href="#">Datos Abiertos</a></li></ul></div>
        </div>
        <div className="fbot">
          <span className="f-copy">© 2026 MECIA · UNAULA · unabot@unaula.edu.co · ig. @unabot · www.mecia.com</span>
          <div className="fbot-r">
            <a href="https://www.facebook.com/AlcaldiadeMedellin" target="_blank" rel="noreferrer" className="fib"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/></svg></a>
            <a href="https://www.instagram.com/semillerounabot/" target="_blank" rel="noreferrer" className="fib"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="2" width="20" height="20" rx="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/></svg></a>
            <a href="https://www.youtube.com/@AlcaldiaMedellin" target="_blank" rel="noreferrer" className="fib"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22.54 6.42a2.78 2.78 0 0 0-1.95-1.96C18.88 4 12 4 12 4s-6.88 0-8.59.46a2.78 2.78 0 0 0-1.95 1.96A29 29 0 0 0 1 12a29 29 0 0 0 .46 5.58A2.78 2.78 0 0 0 3.41 19.6C5.12 20 12 20 12 20s6.88 0 8.59-.46a2.78 2.78 0 0 0 1.95-1.95A29 29 0 0 0 23 12a29 29 0 0 0-.46-5.58z"/><polygon points="9.75 15.02 15.5 12 9.75 8.98 9.75 15.02"/></svg></a>
            <div className="fib" id="scroll-top" onClick={scrollToTop} style={{cursor:'pointer'}}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="18 15 12 9 6 15"/></svg></div>
          </div>
        </div>
      </div>
    </div>
  );
}
