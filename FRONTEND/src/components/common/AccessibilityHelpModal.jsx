import { useEffect, useState } from 'react';
import '@/pages/Dashboard.css';

const KEYBOARD_COMMANDS = [
  { key: '?', desc: 'Abrir esta ayuda de accesibilidad' },
  { key: 'Alt+H', desc: 'Abrir ayuda (alternativa)' },
  { key: 'Alt+N', desc: 'Apagar / Prender la guía de voz' },
  { key: 'Alt+C', desc: 'Acceder directamente al chatbot' },
  { key: 'Alt+G', desc: 'Ir al contenido principal de la página' },
  { key: 'Alt+L', desc: 'Navegar a la siguiente sección' },
  { key: 'Alt+K', desc: 'Ir a la sección anterior' },
  { key: 'Tab / Shift+Tab', desc: 'Navegar entre todos los elementos' },
  { key: 'Flechas ↑↓←→', desc: 'Navegar dentro de menús y listas' },
  { key: 'Enter / Espacio', desc: 'Activar botones y enlaces' },
  { key: 'Home / End', desc: 'Ir al primer o último item en un menú' },
];

export default function AccessibilityHelpModal() {
  const [isOpen, setIsOpen] = useState(false);

  // Anuncio de comandos principales para screen readers
  const getCommandsAnnouncement = () => {
    return `Comandos de accesibilidad disponibles: 
    Signo de interrogación para abrir esta ayuda. 
    Alt más N para apagar o prender la voz. 
    Alt más C para acceder al chatbot. 
    Alt más G para ir al contenido principal. 
    Alt más L para siguiente sección. 
    Alt más K para sección anterior. 
    Tab para navegar, Flechas en menús, Enter o Espacio para activar.`;
  };

  useEffect(() => {
    const handleKeyDown = (event) => {
      // Abrir con "?" (sin modificadores) o Alt+H
      if (event.key === '?' || (event.altKey && (event.key === 'h' || event.key === 'H'))) {
        // No prevenir si estás escribiendo en un input
        if (event.target.matches('input, textarea')) {
          return;
        }
        
        event.preventDefault();
        setIsOpen(!isOpen);
        
        setTimeout(() => {
          if (!isOpen) {
            const modalTitle = document.getElementById('a11y-help-title');
            if (modalTitle) {
              modalTitle.focus();
              if (window.announceToScreenReader) {
                // Anunciar los comandos cuando se abre
                window.announceToScreenReader(getCommandsAnnouncement(), true);
              }
            }
          }
        }, 100);
      }
      
      if (event.key === 'Escape' && isOpen) {
        event.preventDefault();
        setIsOpen(false);
        if (window.announceToScreenReader) {
          window.announceToScreenReader('Ayuda cerrada', false);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  if (!isOpen) {
    return (
      <button
        className="db-icon-btn db-help-btn"
        onClick={() => setIsOpen(true)}
        title="Ayuda de accesibilidad (Presiona ? o Alt+H)"
        aria-label="Ayuda de accesibilidad - Presiona ? para ver comandos de teclado"
      >
        ?
      </button>
    );
  }

  return (
    <>
      {/* Overlay */}
      <div
        className="a11y-modal-overlay"
        onClick={() => setIsOpen(false)}
        aria-hidden="true"
      />

      {/* Modal */}
      <div
        className="a11y-help-modal"
        role="dialog"
        aria-labelledby="a11y-help-title"
        aria-describedby="a11y-help-desc"
      >
        <div className="a11y-modal-header">
          <h2 id="a11y-help-title" tabIndex={-1}>
            Comandos de Accesibilidad
          </h2>
          <button
            className="a11y-close-btn"
            onClick={() => setIsOpen(false)}
            title="Cerrar (Escape)"
            aria-label="Cerrar diálogo de ayuda"
          >
            ✕
          </button>
        </div>

        <div id="a11y-help-desc" className="a11y-modal-content">
          <p style={{ marginBottom: 16, color: 'var(--text-mid)', fontSize: 13 }}>
            Usa estos atajos de teclado para navegar más rápido por la aplicación:
          </p>

          <div className="a11y-commands-list" role="list" aria-label="Lista de comandos de teclado disponibles">
            {KEYBOARD_COMMANDS.map((cmd, idx) => (
              <div 
                key={idx} 
                className="a11y-command-item"
                role="listitem"
                tabIndex={0}
                aria-label={`${cmd.key}: ${cmd.desc}`}
              >
                <div className="a11y-cmd-key">{cmd.key}</div>
                <div className="a11y-cmd-desc">{cmd.desc}</div>
              </div>
            ))}
          </div>

          <div style={{ marginTop: 20, paddingTop: 16, borderTop: '1px solid var(--border)', fontSize: 12, color: 'var(--text-dim)' }}>
            <p><strong>💡 Tip:</strong> Presiona <kbd>Tab</kbd> para navegar, <kbd>Enter</kbd> o <kbd>Espacio</kbd> para activar botones.</p>
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 16 }}>
          <button
            onClick={() => setIsOpen(false)}
            className="db-btn-primary"
            style={{
              padding: '8px 16px',
              backgroundColor: 'var(--accent)',
              color: 'white',
              border: 'none',
              borderRadius: 6,
              cursor: 'pointer',
              fontSize: 13,
              fontWeight: 600,
            }}
          >
            Cerrar (Escape)
          </button>
        </div>
      </div>
    </>
  );
}
