// src/components/dashboard/DashboardLayout.jsx
import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTheme } from '@/hooks/useTheme';
import AccessibilityHelpModal from '@/components/common/AccessibilityHelpModal';
import '@/pages/Dashboard.css';

function moveFocusWithArrows(event, selector) {
  const keys = ['ArrowRight', 'ArrowDown', 'ArrowLeft', 'ArrowUp', 'Home', 'End'];
  if (!keys.includes(event.key)) return;

  const items = Array.from(event.currentTarget.querySelectorAll(selector));
  if (!items.length) return;

  const activeIndex = items.indexOf(document.activeElement);
  if (activeIndex < 0) return;

  event.preventDefault();

  if (event.key === 'Home') {
    items[0]?.focus();
    return;
  }

  if (event.key === 'End') {
    items[items.length - 1]?.focus();
    return;
  }

  const delta = event.key === 'ArrowRight' || event.key === 'ArrowDown' ? 1 : -1;
  const nextIndex = (activeIndex + delta + items.length) % items.length;
  items[nextIndex]?.focus();
}

/* ── SVG Icons ── */
export const Icons = {
  Dashboard: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false"><rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/></svg>,
  Shield: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>,
  Bolt: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>,
  MapPin: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>,
  News: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M4 22h16a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v16a2 2 0 0 0-1.414 1.914"/><path d="M8 6h8M8 10h8M8 14h4"/></svg>,
  Chart: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/><line x1="2" y1="20" x2="22" y2="20"/></svg>,
  Store: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>,
  Rocket: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z"/><path d="m12 15-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z"/><path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0"/><path d="M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5"/></svg>,
  LogOut: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>,
  ChevronLeft: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>,
  Bell: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>,
  Search: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>,
  Sun: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/></svg>,
  Moon: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>,
  Pencil: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>,
  Sliders: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><line x1="4" y1="21" x2="4" y2="14"/><line x1="4" y1="10" x2="4" y2="3"/><line x1="12" y1="21" x2="12" y2="12"/><line x1="12" y1="8" x2="12" y2="3"/><line x1="20" y1="21" x2="20" y2="16"/><line x1="20" y1="12" x2="20" y2="3"/><line x1="1" y1="14" x2="7" y2="14"/><line x1="9" y1="8" x2="15" y2="8"/><line x1="17" y1="16" x2="23" y2="16"/></svg>,
  TrendUp: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>,
  Building: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="7" width="20" height="15" rx="2"/><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/></svg>,
};

/* ── TabBar ── */
export function TabBar({ tabs, active, onChange }) {
  return (
    <div className="db-tab-bar" role="tablist" aria-label="Pestañas" onKeyDown={(event) => moveFocusWithArrows(event, '[role="tab"]')}>
      {tabs.map(t => (
        <button
          key={t.id}
          className={`db-tab${active === t.id ? ' active' : ''}`}
          onClick={() => onChange(t.id)}
          role="tab"
          aria-selected={active === t.id}
          aria-controls={`tabpanel-${t.id}`}
          id={`tab-${t.id}`}
        >
          {t.label}
        </button>
      ))}
    </div>
  );
}

/* ── StyledSelect ── */
export function StyledSelect({ value, onChange, options, placeholder = 'Seleccionar', className = '' }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const close = (e) => { if (!ref.current?.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, []);

  const selected = options.find(o => String(o.value) === String(value));

  return (
    <div ref={ref} className={`db-sel${open ? ' open' : ''}${className ? ' ' + className : ''}`}>
      <button type="button" className="db-sel-trigger" onClick={() => setOpen(v => !v)}>
        <span className="db-sel-value">{selected?.label ?? placeholder}</span>
        <svg className="db-sel-arrow" viewBox="0 0 10 6" fill="none" aria-hidden="true">
          <path d="M1 1l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
        </svg>
      </button>
      {open && (
        <div className="db-sel-dropdown" role="listbox" aria-label="Opciones">
          {options.map(o => (
            <button key={o.value} type="button" role="option"
              aria-selected={String(o.value) === String(value)}
              className={`db-sel-option${String(o.value) === String(value) ? ' active' : ''}`}
              onClick={() => { onChange(o.value); setOpen(false); }}
            >{o.label}</button>
          ))}
        </div>
      )}
    </div>
  );
}

/**
 * DashboardLayout
 * colL = contenido principal (col izquierda)
 * colR = widgets de derecha
 */
export default function DashboardLayout({
  user,
  navItems = [],
  activeItem,
  onSelect,
  onLogout,
  pageTitle,
  pageTitleAccent,
  pageSubtitle,
  breadcrumb,
  colL,
  colR,
  fullWidth,
  children,
}) {
  const { theme, toggle: toggleTheme } = useTheme();

  useEffect(() => {
    if (!window.announceToScreenReader) return;
    const page = pageTitle || 'Panel';
    window.announceToScreenReader(`Página cargada: ${page}. Usa Tab y flechas para navegar, Enter o Espacio para activar.`, true);
  }, [pageTitle]);

  const initials = user?.full_name
    ? user.full_name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()
    : '?';

  const mainContent = colL || children;

  return (
    <>
      <div className="db-bg" />
      <a href="#db-main-content" className="sr-only sr-only-focusable">
        Saltar al contenido principal
      </a>
      <div className="db-shell">

        {/* ══ SIDEBAR ══ */}
        <aside className="db-sidebar" aria-label="Navegación lateral">

          <Link to="/" className="db-logo" aria-label="Ir al inicio de MECIA">
            <div className="db-logo-mark">
              <img src="/mecialogoog.png" alt="MECIA" style={{width:'100%',height:'100%',objectFit:'contain',borderRadius:6}} />
            </div>
            <span className="db-logo-text">MECIA</span>
          </Link>

          <div className="db-sidebar-user" role="region" aria-label="Información de usuario">
            <div className="db-user-avatar" title={user?.full_name} aria-label={`Avatar de ${user?.full_name || 'usuario'}`}>{initials}</div>
            <div className="db-user-info">
              <div className="db-user-name">{user?.full_name}</div>
              <div className="db-user-role">{user?.role}</div>
            </div>
          </div>

          <nav className="db-nav" aria-label="Secciones principales" onKeyDown={(event) => moveFocusWithArrows(event, '.db-nav-item')}>
            <div className="db-nav-section">Navegación</div>
            {navItems.map(item => (
              <button
                key={item.id}
                className={`db-nav-item${activeItem === item.id ? ' active' : ''}`}
                onClick={() => onSelect(item.id)}
                title={item.label}
                aria-label={item.label}
                aria-current={activeItem === item.id ? 'page' : undefined}
                {...(item.chatbot && { 'data-chatbot-nav': 'true' })}
              >
                <span className="db-nav-icon">{item.icon}</span>
                <span className="db-nav-label">{item.label}</span>
              </button>
            ))}
          </nav>

          {/* Footer: logout */}
          <div className="db-sidebar-footer">
            <button className="db-logout-btn" onClick={onLogout} aria-label="Cerrar sesión">
              <span className="db-nav-icon"><Icons.LogOut /></span>
              <span className="db-nav-label">Cerrar Sesión</span>
            </button>
          </div>
        </aside>

        {/* ══ MAIN ══ */}
        <div className="db-main">
          <header className="db-topbar" role="banner">
            <div className="db-breadcrumbs">
              <span>MECIA</span>
              <span className="bc-sep">›</span>
              <span className="bc-active">{breadcrumb || pageTitle}</span>
            </div>
            <div className="db-topbar-right">
              <AccessibilityHelpModal />
              {/* Theme toggle — SOLO aquí, no en el sidebar */}
              <button className="db-theme-toggle" onClick={toggleTheme} title={theme === 'dark' ? 'Modo claro' : 'Modo oscuro'} aria-label={theme === 'dark' ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'} aria-pressed={theme === 'dark'}>
                {theme === 'dark' ? <Icons.Moon /> : <Icons.Sun />}
              </button>
              <div className="db-main-avatar" title={user?.full_name}>{initials}</div>
            </div>
          </header>

          <main className={`db-content${fullWidth || !colR ? ' db-content--full' : ''}`} id="db-main-content" tabIndex={-1}>
            <div className="db-col-l">
              {(pageTitle || pageSubtitle) && (
                <div className="db-page-header">
                  {pageTitle && (
                    <h1 className="db-page-title">
                      {pageTitleAccent && <span className="lt">{pageTitleAccent} </span>}
                      {pageTitle}
                    </h1>
                  )}
                  {pageSubtitle && <p className="db-page-subtitle">{pageSubtitle}</p>}
                </div>
              )}
              {mainContent}
            </div>
            {colR && <div className="db-col-r" role="complementary" aria-label="Panel complementario">{colR}</div>}
          </main>
        </div>
      </div>
    </>
  );
}