// src/components/auth/ProtectedRoute.jsx
// Componente para proteger rutas que requieren autenticación

import { Navigate } from 'react-router-dom';
import authService from '@/services/authService';

/**
 * Componente para envolver rutas que requieren autenticación
 * Si el usuario no está autenticado, redirige a login
 */
export default function ProtectedRoute({ children }) {
  const isAuthenticated = authService.isAuthenticated();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return children;
}
