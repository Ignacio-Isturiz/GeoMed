import React from 'react';
import { Link } from 'react-router-dom';

export default function Roles() {
  return (
    <section id="roles" className="sec-trans sp">
      <div className="w">
        <div className="sh">
          <div className="eye">Explora MECIA</div>
          <h2 className="d3" style={{marginTop:'12px'}}>Elige tu camino en la ciudad</h2>
        </div>

        {/* ── Mapa de Medellín ── */}
        <div className="roles-map-wrap">
          <div className="roles-map-badge">Medellín · Valle de Aburrá</div>
          <iframe
            title="Mapa de Medellín"
            src="https://www.openstreetmap.org/export/embed.html?bbox=-75.6530%2C6.1500%2C-75.5400%2C6.2950&layer=mapnik&marker=6.2442%2C-75.5812"
            className="roles-map-frame"
            loading="lazy"
          />
        </div>

        <div className="roles-grid">
          <div className="role-card">
            <div className="role-header">
              <div className="role-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="var(--g)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                  <circle cx="12" cy="7" r="4"/>
                </svg>
              </div>
              <div className="role-title">Ciudadano</div>
            </div>

            <div className="role-body">
              <p className="role-subtitle">Tu ciudad en tiempo real</p>
              <ul className="role-list">
                <li>Mapa de seguridad en directo</li>
                <li>Sugerencias para tus planes</li>
                <li>Novedades de Medellín</li>
                <li>Tu factura EPM</li>
                <li>Chatbot Guardián 24/7</li>
              </ul>
            </div>

            <div className="role-footer">
              <Link to="/login" className="btn btn-g" style={{width:'100%',textAlign:'center'}}>Acceder →</Link>
            </div>
          </div>

          <div className="role-card emprendedor">
            <div className="role-header">
              <div className="role-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="var(--g)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 4H4a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2z"/>
                  <path d="M8 9h8M8 13h8"/>
                </svg>
              </div>
              <div className="role-title">Emprendedor</div>
            </div>

            <div className="role-body">
              <p className="role-subtitle">Datos para crecer tu negocio</p>
              <ul className="role-list">
                <li>Análisis de afluencia zonal</li>
                <li>Indicadores de seguridad por zona</li>
                <li>Tendencias de costos de servicios</li>
                <li>Mapa de ruta para empezar tu negocio</li>
                <li>Comparativa entre comunas</li>
              </ul>
            </div>

            <div className="role-footer">
              <Link to="/login" className="btn btn-g" style={{width:'100%',textAlign:'center'}}>Acceder →</Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
