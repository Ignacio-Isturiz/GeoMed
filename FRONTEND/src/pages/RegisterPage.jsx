// src/pages/RegisterPage.jsx
import { useNavigate, Link } from 'react-router-dom';
import { RegisterForm } from '@/components/auth';
import ThemeToggle from '@/components/common/ThemeToggle';
import './AuthPages.css';

export default function RegisterPage() {
  const navigate = useNavigate();

  const handleRegisterSuccess = (result) => {
    const role = result.user.role;
    if (role === 'emprendedor') navigate('/emprendedor/dashboard');
    else navigate('/ciudadano/dashboard');
  };

  return (
    <div className="auth-layout auth-flipped">

      {/* Panel verde — derecha (por auth-flipped) */}
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
            <h2 className="auth-left-title">Empieza con<br/><em>nosotros</em> hoy</h2>
            <p className="auth-left-desc">
              Completa estos pasos para crear tu cuenta y acceder a la inteligencia ciudadana de Medellín.
            </p>
            <div className="auth-steps">
              <div className="auth-step auth-step-active">
                <div className="auth-step-num">1</div>
                <span>Crea tu cuenta</span>
              </div>
              <div className="auth-step">
                <div className="auth-step-num">2</div>
                <span>Elige tu perfil ciudadano</span>
              </div>
              <div className="auth-step">
                <div className="auth-step-num">3</div>
                <span>Explora tu ciudad</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Formulario — izquierda (por auth-flipped order:1) */}
      <div className="auth-right">
        <div className="auth-panel-actions auth-panel-actions--left">
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
            <h1 className="auth-form-title">Crear Cuenta</h1>
            <p className="auth-form-subtitle">Ingresa tus datos para registrarte en MECIA.</p>
          </div>

          <RegisterForm onSuccess={handleRegisterSuccess} />

          <p className="auth-switch">
            ¿Ya tienes cuenta?{' '}
            <Link to="/login" className="auth-switch-link" viewTransition>
              Inicia sesión
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
