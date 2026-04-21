// src/pages/ResetPasswordPage.jsx
import { useNavigate, Link } from 'react-router-dom';
import { ResetPasswordForm } from '@/components/auth';
import ThemeToggle from '@/components/common/ThemeToggle';
import './AuthPages.css';

export default function ResetPasswordPage() {
  const navigate = useNavigate();
  const handleResetSuccess = () => navigate('/login');

  return (
    <div className="auth-reset-layout">
      <div className="auth-orb auth-orb-1" />
      <div className="auth-orb auth-orb-2" />
      <ThemeToggle className="auth-theme-card-btn" />

      <div className="auth-reset-card">
        <Link to="/" className="auth-reset-brand">
          <div className="auth-logo-mark">
            <svg width="15" height="15" viewBox="0 0 36 36" fill="none">
              <path d="M6 8C6 6.9 6.9 6 8 6H22C22 6 28 6 28 12V20" stroke="white" strokeWidth="3.4" strokeLinecap="round"/>
              <path d="M6 8V28C6 29.1 6.9 30 8 30H28" stroke="white" strokeWidth="3.4" strokeLinecap="round"/>
              <circle cx="25" cy="10" r="3" fill="white"/>
            </svg>
          </div>
          <span className="auth-brand-name">MECIA</span>
        </Link>
        <div className="auth-reset-icon">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none"
            stroke="#00C896" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
            <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
          </svg>
        </div>
        <div className="auth-form-header" style={{textAlign:'center'}}>
          <h1 className="auth-form-title">Nueva Contraseña</h1>
          <p className="auth-form-subtitle">Crea una contraseña segura para tu cuenta MECIA.</p>
        </div>
        <ResetPasswordForm onSuccess={handleResetSuccess} />
        <p className="auth-switch" style={{marginTop:'16px'}}>
          <Link to="/login" className="auth-switch-link">← Volver al inicio de sesión</Link>
        </p>
      </div>
    </div>
  );
}