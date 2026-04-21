import { createBrowserRouter } from 'react-router-dom';
import { ProtectedRoute } from '@/components/auth';
import { PageLoader, LazyRoute } from '@/components/common/RouteLoading';
import { 
  HomePage, 
  LoginPage, 
  RegisterPage, 
  ForgotPasswordPage, 
  ResetPasswordPage, 
  EmprendedorDashboard, 
  CiudadanoDashboard 
} from './lazyComponents';

/**
 * Configuración de rutas
 * - Ruta raíz: Home con "Hola"
 * - Rutas públicas: login, register, forgot-password, reset-password
 * - Rutas protegidas: dashboards
 */
export const router = createBrowserRouter([
  // Ruta inicial - Home
  {
    path: '/',
    element: <LazyRoute element={<HomePage />} />
  },

  // Rutas públicas de autenticación
  {
    path: '/login',
    element: <LazyRoute element={<LoginPage />} />
  },
  {
    path: '/register',
    element: <LazyRoute element={<RegisterPage />} />
  },
  {
    path: '/forgot-password',
    element: <LazyRoute element={<ForgotPasswordPage />} />
  },
  {
    path: '/reset-password',
    element: <LazyRoute element={<ResetPasswordPage />} />
  },

  // Rutas protegidas para emprendedor
  {
    path: '/emprendedor/dashboard',
    element: (
      <ProtectedRoute>
        <LazyRoute element={<EmprendedorDashboard />} />
      </ProtectedRoute>
    )
  },

  // Rutas protegidas para ciudadano
  {
    path: '/ciudadano/dashboard',
    element: (
      <ProtectedRoute>
        <LazyRoute element={<CiudadanoDashboard />} />
      </ProtectedRoute>
    )
  }
]);

export default router;
