// src/components/auth/RegisterForm.jsx
import { useState } from 'react';
import authService from '@/services/authService';

export default function RegisterForm({ onSuccess }) {
  const [formData, setFormData] = useState({
    email: '',
    full_name: '',
    password: '',
    passwordConfirm: '',
    role: 'ciudadano'
  });
  const [showPwd, setShowPwd] = useState(false);
  const [showPwdConfirm, setShowPwdConfirm] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Read DOM values directly to handle browser autocomplete
    const email = e.target.email.value || formData.email;
    const full_name = e.target.full_name.value || formData.full_name;
    const password = e.target.password.value || formData.password;
    const passwordConfirm = e.target.passwordConfirm.value || formData.passwordConfirm;

    if (password !== passwordConfirm) {
      setError('Las contraseñas no coinciden');
      return;
    }
    if (password.length < 8) {
      setError('La contraseña debe tener al menos 8 caracteres');
      return;
    }
    if (password.length > 72) {
      setError('La contraseña no puede exceder 72 caracteres');
      return;
    }

    setLoading(true);
    try {
      const result = await authService.register({
        email,
        full_name,
        password,
        role: formData.role
      });
      onSuccess?.(result);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const EyeIcon = ({ visible }) => visible ? (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
      <line x1="1" y1="1" x2="23" y2="23"/>
    </svg>
  ) : (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
      <circle cx="12" cy="12" r="3"/>
    </svg>
  );

  return (
    <div>
      <h2>Crear Cuenta</h2>

      {error && (
        <div style={{ color: 'red', marginBottom: '1rem' }}>{error}</div>
      )}

      <form onSubmit={handleSubmit} autoComplete="on">
        <div style={{ marginBottom: '1rem' }}>
          <label htmlFor="email">Correo electrónico</label>
          <input
            type="email"
            id="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            required
            placeholder="tu@email.com"
            autoComplete="email"
          />
        </div>

        <div style={{ marginBottom: '1rem' }}>
          <label htmlFor="full_name">Nombre completo</label>
          <input
            type="text"
            id="full_name"
            name="full_name"
            value={formData.full_name}
            onChange={handleChange}
            required
            placeholder="Juan Pérez"
            minLength="2"
            autoComplete="name"
          />
        </div>

        <div style={{ marginBottom: '1rem' }}>
          <label>¿Cuál es tu perfil?</label>
          <div className="auth-role-toggle">
            <button
              type="button"
              className={`auth-role-btn${formData.role === 'ciudadano' ? ' active' : ''}`}
              onClick={() => setFormData(p => ({ ...p, role: 'ciudadano' }))}
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                <circle cx="12" cy="7" r="4"/>
              </svg>
              Ciudadano
            </button>
            <button
              type="button"
              className={`auth-role-btn${formData.role === 'emprendedor' ? ' active' : ''}`}
              onClick={() => setFormData(p => ({ ...p, role: 'emprendedor' }))}
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z"/>
                <path d="m12 15-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z"/>
                <path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0"/>
                <path d="M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5"/>
              </svg>
              Emprendedor
            </button>
          </div>
        </div>

        <div style={{ marginBottom: '1rem' }}>
          <label htmlFor="password">Contraseña</label>
          <div className="auth-input-wrap">
            <input
              type={showPwd ? 'text' : 'password'}
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
              placeholder="••••••••"
              minLength="8"
              maxLength="72"
              autoComplete="new-password"
            />
            <button type="button" className="auth-eye-btn"
              onClick={() => setShowPwd(v => !v)}
              aria-label={showPwd ? 'Ocultar contraseña' : 'Mostrar contraseña'}
              tabIndex={-1}>
              <EyeIcon visible={showPwd} />
            </button>
          </div>
          <small>Mínimo 8 caracteres, máximo 72</small>
        </div>

        <div style={{ marginBottom: '1rem' }}>
          <label htmlFor="passwordConfirm">Confirma tu contraseña</label>
          <div className="auth-input-wrap">
            <input
              type={showPwdConfirm ? 'text' : 'password'}
              id="passwordConfirm"
              name="passwordConfirm"
              value={formData.passwordConfirm}
              onChange={handleChange}
              required
              placeholder="••••••••"
              minLength="8"
              maxLength="72"
              autoComplete="new-password"
            />
            <button type="button" className="auth-eye-btn"
              onClick={() => setShowPwdConfirm(v => !v)}
              aria-label={showPwdConfirm ? 'Ocultar contraseña' : 'Mostrar contraseña'}
              tabIndex={-1}>
              <EyeIcon visible={showPwdConfirm} />
            </button>
          </div>
        </div>

        <button type="submit" disabled={loading}>
          {loading ? 'Creando cuenta...' : 'Registrarse'}
        </button>
      </form>

      <p>¿Ya tienes cuenta? <a href="/login">Inicia sesión aquí</a></p>
    </div>
  );
}
