// src/components/auth/ForgotPasswordForm.jsx
// Wireframe: Formulario de Solicitud de Reset de Contraseña

import { useState } from 'react';
import authService from '@/services/authService';

/**
 * Componente para solicitar reset de contraseña
 * WIREFRAME: Solo tiene la estructura básica
 * TODO: Agregar estilos Tailwind, feedback visual y confirmación de email
 */
export default function ForgotPasswordForm({ onSuccess }) {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      await authService.requestPasswordReset(email);
      setSuccess('Si el email existe, recibirás un enlace para resetear tu contraseña');
      setEmail('');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h2>Recuperar Contraseña</h2>

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
          <label htmlFor="email">Email:</label>
          <input
            type="email"
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            placeholder="tu@email.com"
          />
          <small>Ingresa el email asociado a tu cuenta</small>
        </div>

        <button type="submit" disabled={loading}>
          {loading ? 'Enviando...' : 'Enviar Enlace de Recuperación'}
        </button>
      </form>

      <p>
        <a href="/login">Volver al login</a>
      </p>
    </div>
  );
}
