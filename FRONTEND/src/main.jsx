import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

// Suppress repetitive Spline/WebGL warnings that flood the console and slow down the main thread
const originalWarn = console.warn;
console.warn = (...args) => {
  if (args[0] && typeof args[0] === 'string' && args[0].includes('f_blur')) return;
  originalWarn(...args);
};

createRoot(document.getElementById('root')).render(
  
    <App />
  
)
