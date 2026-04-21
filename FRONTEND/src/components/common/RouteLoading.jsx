import React, { Suspense } from 'react';

/**
 * Componente de carga para transiciones de ruta
 */
export const PageLoader = () => (
  <div style={{
    height: '100vh',
    width: '100vw',
    background: '#050810',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  }}>
    <div style={{
      width: '40px',
      height: '40px',
      border: '2px solid rgba(0,200,150,0.1)',
      borderTopColor: '#00C896',
      borderRadius: '50%',
      animation: 'spin 0.8s linear infinite'
    }}></div>
    <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
  </div>
);

/**
 * Envoltorio para rutas con carga perezosa
 */
export const LazyRoute = ({ element }) => (
  <Suspense fallback={<PageLoader />}>
    {element}
  </Suspense>
);
