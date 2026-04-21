// src/components/auth/ResetPasswordForm.jsx
// Wireframe: Formulario para confirmar reset de contraseña

import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import authService from '@/services/authService';

/**
 * Componente para confirmar reset de contraseña
 * Espera un token en la URL: ?token=xxx
 * WIREFRAME: Solo tiene la estructura básica
 * TODO: Agregar estilos Tailwind y validaciones avanzadas
 */
export default function ResetPasswordForm({ onSuccess }) {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');

  const [formData, setFormData] = useState({
    password: '',
    passwordConfirm: ''
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!token) {
      setError('Token inválido o faltante');
      return;
    }

    if (formData.password !== formData.passwordConfirm) {
      setError('Las contraseñas no coinciden');
      return;
    }

    if (formData.password.length < 8) {
      setError('La contraseña debe tener al menos 8 caracteres');
      return;
    }

    if (formData.password.length > 72) {
      setError('La contraseña no puede exceder 72 caracteres');
      return;
    }

    setLoading(true);

    try {
      await authService.confirmPasswordReset(token, formData.password);
      setSuccess('Contraseña actualizada exitosamente. Redirigiendo al login...');
      
      setTimeout(() => {
        onSuccess?.();
      }, 2000);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <div>
        <h2>Error</h2>
        <p>No se encontró el token de recuperación</p>
        <a href="/login">Volver al login</a>
      </div>
    );
  }

  return (
    <div>
      <h2>Establecer Nueva Contraseña</h2>

      {error && (
        <div style={{ color: 'red', marginBottom: '1rem' }}>
          {error}
        </div>
      )}

      {success && (
        <div style={{ color: 'green', marginBottom: '1rem' }}>
          {success}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: '1rem' }}>
          <label htmlFor="password">Nueva Contraseña:</label>
          <input
            type="password"
            id="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            required
            placeholder="••••••••"
            minLength="8"
            maxLength="72"
          />
          <small>Mínimo 8 caracteres, máximo 72</small>
        </div>

        <div style={{ marginBottom: '1rem' }}>
          <label htmlFor="passwordConfirm">Confirma tu Contraseña:</label>
          <input
            type="password"
            id="passwordConfirm"
            name="passwordConfirm"
            value={formData.passwordConfirm}
            onChange={handleChange}
            required
            placeholder="••••••••"
            minLength="8"
            maxLength="72"
          />
        </div>

        <button type="submit" disabled={loading}>
          {loading ? 'Actualizando...' : 'Actualizar Contraseña'}
        </button>
      </form>

      <p>
        <a href="/login">Volver al login</a>
      </p>
    </div>
  );
}
