import { RouterProvider } from 'react-router-dom';
import router from './router';
import './index.css';
import AriaLiveRegion from '@/components/common/AriaLiveRegion';
import AccessibilityVoiceGuide from '@/components/common/AccessibilityVoiceGuide';
import { useKeyboardNavigation } from '@/hooks/useKeyboardNavigation';

/**
 * Componente principal de la aplicación MECIA
 * Configura React Router y proporciona las rutas
 */
function App() {
  useKeyboardNavigation();

  return (
    <>
      <AriaLiveRegion />
      <RouterProvider router={router} />
      <AccessibilityVoiceGuide />
    </>
  );
}
export default App
