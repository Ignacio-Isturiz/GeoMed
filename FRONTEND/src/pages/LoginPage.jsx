// src/pages/LoginPage.jsx
import { useNavigate, Link } from 'react-router-dom';
import { LoginForm } from '@/components/auth';
import ThemeToggle from '@/components/common/ThemeToggle';
import './AuthPages.css';

export default function LoginPage() {
  const navigate = useNavigate();

  const handleLoginSuccess = (result) => {
    const role = result.user.role;
    if (role === 'emprendedor') navigate('/emprendedor/dashboard');
    else navigate('/ciudadano/dashboard');
  };

  return (
    <div className="auth-layout">

      {/* Panel verde — izquierda */}
      <div className="auth-left">
        <div className="auth-left-inner">
          <div className="auth-orb auth-orb-1" />
          <div className="auth-orb auth-orb-2" />
          <div className="auth-orb auth-orb-3" />
          <div className="auth-orb auth-orb-4" />

          <Link to="/" className="auth-brand">
            <img src="/mecialogoog.png" alt="MECIA" className="auth-brand-logo-img auth-logo-dark" />
            <img src="/mecialogoblanco2.png" alt="MECIA" className="auth-brand-logo-img auth-logo-light" />
          </Link>

          <div className="auth-left-content">
            <h2 className="auth-left-title">Bienvenido de<br/><em>vuelta</em></h2>
            <p className="auth-left-desc">
              Tu ciudad en tiempo real. Seguridad, movilidad y servicios públicos en un solo lugar.
            </p>
            <div className="auth-steps">
              <div className="auth-step auth-step-active">
                <div className="auth-step-num">1</div>
                <span>Inicia sesión en tu cuenta</span>
              </div>
              <div className="auth-step">
                <div className="auth-step-num">2</div>
                <span>Accede a tu dashboard</span>
              </div>
              <div className="auth-step">
                <div className="auth-step-num">3</div>
                <span>Explora tu ciudad</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Formulario — derecha */}
      <div className="auth-right">
        <div className="auth-panel-actions">
          <Link to="/" className="auth-home-btn" aria-label="Ir al inicio">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
              <polyline points="9 22 9 12 15 12 15 22"/>
            </svg>
          </Link>
          <ThemeToggle className="auth-theme-panel-btn" />
        </div>

        <div className="auth-form-wrap">
          <div className="auth-form-header">
            <h1 className="auth-form-title">Iniciar Sesión</h1>
            <p className="auth-form-subtitle">Ingresa tus datos para acceder a tu cuenta.</p>
          </div>

          <LoginForm onSuccess={handleLoginSuccess} />

          <p className="auth-switch">
            ¿No tienes cuenta?{' '}
            <Link to="/register" className="auth-switch-link" viewTransition>
              Regístrate
            </Link>
          </p>
          <p className="auth-switch" style={{marginTop:'8px'}}>
            <Link to="/forgot-password" className="auth-switch-link" viewTransition>
              ¿Olvidaste tu contraseña?
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
