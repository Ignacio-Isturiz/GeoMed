// src/services/authService.js
// Servicio para manejar todas las llamadas de autenticación

import { API_CONFIG, API_ENDPOINTS, getAuthHeaders } from '@/config/api';

class AuthService {
  /**
   * Registra un nuevo usuario
   * @param {Object} userData - {email, full_name, password, role}
   * @returns {Promise} - {access_token, refresh_token, user}
   */
  async register(userData) {
    try {
      const response = await fetch(
        `${API_CONFIG.baseURL}${API_ENDPOINTS.auth.register}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(userData)
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Error en el registro');
      }

      const data = await response.json();
      this.saveTokens(data.access_token, data.refresh_token);
      return data;
    } catch (error) {
      console.error('Error en registro:', error);
      throw error;
    }
  }

  /**
   * Inicia sesión
   * @param {string} email 
   * @param {string} password 
   * @returns {Promise} - {access_token, refresh_token, user}
   */
  async login(email, password) {
    try {
      const response = await fetch(
        `${API_CONFIG.baseURL}${API_ENDPOINTS.auth.login}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ email, password })
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Error en el login');
      }

      const data = await response.json();
      this.saveTokens(data.access_token, data.refresh_token);
      return data;
    } catch (error) {
      console.error('Error en login:', error);
      throw error;
    }
  }

  /**
   * Cierra sesión
   */
  logout() {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user');
  }

  /**
   * Solicita un reset de contraseña
   * @param {string} email 
   * @returns {Promise}
   */
  async requestPasswordReset(email) {
    try {
      const response = await fetch(
        `${API_CONFIG.baseURL}${API_ENDPOINTS.auth.passwordResetRequest}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ email })
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Error al solicitar reset');
      }

      return await response.json();
    } catch (error) {
      console.error('Error en password reset request:', error);
      throw error;
    }
  }

  /**
   * Confirma el reset de contraseña
   * @param {string} token 
   * @param {string} newPassword 
   * @returns {Promise}
   */
  async confirmPasswordReset(token, newPassword) {
    try {
      const response = await fetch(
        `${API_CONFIG.baseURL}${API_ENDPOINTS.auth.passwordResetConfirm}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            token,
            new_password: newPassword
          })
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Error al confirmar reset');
      }

      return await response.json();
    } catch (error) {
      console.error('Error en password reset confirm:', error);
      throw error;
    }
  }

  /**
   * Obtiene el usuario actual
   * @returns {Promise} - Datos del usuario
   */
  async getMe() {
    try {
      const response = await fetch(
        `${API_CONFIG.baseURL}${API_ENDPOINTS.auth.me}`,
        {
          method: 'GET',
          headers: getAuthHeaders()
        }
      );

      if (!response.ok) {
        throw new Error('No autorizado');
      }

      return await response.json();
    } catch (error) {
      console.error('Error al obtener usuario:', error);
      throw error;
    }
  }

  /**
   * Renueva el token de acceso
   * @returns {Promise} - Nuevo access token
   */
  async refreshToken() {
    try {
      const refreshToken = localStorage.getItem('refresh_token');
      if (!refreshToken) throw new Error('No refresh token found');

      const response = await fetch(
        `${API_CONFIG.baseURL}${API_ENDPOINTS.auth.refresh}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ refresh_token: refreshToken })
        }
      );

      if (!response.ok) {
        this.logout();
        throw new Error('Token renovación fallida');
      }

      const data = await response.json();
      localStorage.setItem('access_token', data.access_token);
      return data;
    } catch (error) {
      console.error('Error renovando token:', error);
      this.logout();
      throw error;
    }
  }

  /**
   * Guarda los tokens en localStorage
   * @private
   */
  saveTokens(accessToken, refreshToken) {
    localStorage.setItem('access_token', accessToken);
    localStorage.setItem('refresh_token', refreshToken);
  }

  /**
   * Obtiene el token actual
   * @returns {string|null}
   */
  getToken() {
    return localStorage.getItem('access_token');
  }

  /**
   * Verifica si hay sesión activa
   * @returns {boolean}
   */
  isAuthenticated() {
    return !!this.getToken();
  }
}

export default new AuthService();
