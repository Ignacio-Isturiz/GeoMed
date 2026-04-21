import { RouterProvider } from 'react-router-dom';
import router from './router';
import './index.css';
import AriaLiveRegion from '@/components/common/AriaLiveRegion';
import { useKeyboardNavigation } from '@/hooks/useKeyboardNavigation';

/**
 * Componente principal de la aplicación GEOMED
 * Configura React Router y proporciona las rutas
 */
function App() {
  useKeyboardNavigation();

  return (
    <>
      <AriaLiveRegion />
      <RouterProvider router={router} />
    </>
  );
}
export default App
