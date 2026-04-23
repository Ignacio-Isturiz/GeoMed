import { createBrowserRouter } from 'react-router-dom';
import { LazyRoute } from '@/components/common/RouteLoading';
import { 
  HomePage, 
  CiudadanoDashboard 
} from './lazyComponents';

/**
 * Configuración de rutas
 * - Ruta raíz: Landing
 * - Ruta dashboard: acceso directo sin autenticación
 */
export const router = createBrowserRouter([
  // Ruta inicial - Home
  {
    path: '/',
    element: <LazyRoute element={<HomePage />} />
  },

  // Ruta pública de dashboard
  {
    path: '/dashboard',
    element: <LazyRoute element={<CiudadanoDashboard />} />
  }
]);

export default router;
