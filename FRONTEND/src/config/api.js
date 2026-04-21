// src/config/api.js
// Configuración de la API del backend

export const API_CONFIG = {
  baseURL: import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
};

export const API_ENDPOINTS = {
  auth: {
    register: '/api/auth/register',
    login: '/api/auth/login',
    logout: '/api/auth/logout',
    refresh: '/api/auth/refresh',
    me: '/api/auth/me',
    passwordResetRequest: '/api/auth/password-reset-request',
    passwordResetConfirm: '/api/auth/password-reset-confirm'
  }
};

// Helper para obtener headers con token
export const getAuthHeaders = () => {
  const token = localStorage.getItem('access_token');
  return {
    ...API_CONFIG.headers,
    'Authorization': token ? `Bearer ${token}` : ''
  };
};
