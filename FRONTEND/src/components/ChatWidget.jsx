/**
 * ChatWidget.jsx
 * Chatbot flotante para GeoMed. Se monta una vez en CiudadanoDashboard
 * y recibe la sección activa como prop para adaptar su comportamiento.
 *
 * Props:
 *   activeSection: 'analisis' | 'inicio' | 'noticias'
 */

import { useState, useRef, useEffect } from 'react';
import { useChatbot } from '@/hooks/useChatbot';
import './ChatWidget.css';

// Renderer de markdown básico (negrita, listas, saltos de línea)
function SimpleMarkdown({ text }) {
  if (!text) return null;

  const lines = text.split('\n');
  const elements = [];

  lines.forEach((line, i) => {
    // Lista con guión
    if (line.startsWith('- ')) {
      const content = line.slice(2);
      elements.push(
        <li key={i} className="cw-md-li">
          <BoldText text={content} />
        </li>
      );
    } else if (line.trim() === '') {
      elements.push(<br key={i} />);
    } else {
      elements.push(
        <p key={i} className="cw-md-p">
          <BoldText text={line} />
        </p>
      );
    }
  });

  // Wrap consecutive <li> in <ul>
  const wrapped = [];
  let listBuffer = [];
  elements.forEach((el, i) => {
    if (el.type === 'li') {
      listBuffer.push(el);
    } else {
      if (listBuffer.length > 0) {
        wrapped.push(<ul key={`ul_${i}`} className="cw-md-ul">{listBuffer}</ul>);
        listBuffer = [];
      }
      wrapped.push(el);
    }
  });
  if (listBuffer.length > 0) {
    wrapped.push(<ul key="ul_end" className="cw-md-ul">{listBuffer}</ul>);
  }

  return <>{wrapped}</>;
}

function BoldText({ text }) {
  // Render **bold** text
  const parts = text.split(/\*\*(.*?)\*\*/g);
  return (
    <>
      {parts.map((part, i) =>
        i % 2 === 1 ? <strong key={i}>{part}</strong> : part
      )}
    </>
  );
}

// Íconos SVG inline
const SendIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
    <line x1="22" y1="2" x2="11" y2="13" />
    <polygon points="22 2 15 22 11 13 2 9 22 2" />
  </svg>
);

const ChatIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    <circle cx="9" cy="10" r="1" fill="currentColor" />
    <circle cx="12" cy="10" r="1" fill="currentColor" />
    <circle cx="15" cy="10" r="1" fill="currentColor" />
  </svg>
);

const CloseIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

const TrashIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polyline points="3 6 5 6 21 6" />
    <path d="M19 6l-1 14H6L5 6" />
    <path d="M10 11v6M14 11v6" />
  </svg>
);

const BotIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 2a2 2 0 0 1 2 2c0 .74-.4 1.39-1 1.73V7h1a7 7 0 0 1 7 7h1a1 1 0 0 1 1 1v3a1 1 0 0 1-1 1h-1v1a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-1H2a1 1 0 0 1-1-1v-3a1 1 0 0 1 1-1h1a7 7 0 0 1 7-7h1V5.73c-.6-.34-1-.99-1-1.73a2 2 0 0 1 2-2zM9 11a2 2 0 1 0 0 4 2 2 0 0 0 0-4zm6 0a2 2 0 1 0 0 4 2 2 0 0 0 0-4z" />
  </svg>
);

const SECTION_LABELS = {
  analisis: 'Análisis Estratégico',
  inicio: 'Movilidad',
  noticias: 'Noticias',
};

export default function ChatWidget({ activeSection = 'analisis' }) {
  const [isOpen, setIsOpen] = useState(false);
  const { messages, isLoading, error, sendMessage, clearMessages, suggestions } = useChatbot(activeSection);
  const [input, setInput] = useState('');
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const textareaRef = useRef(null);

  // Scroll al fondo cuando llegan mensajes
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  // Focus al abrir
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => textareaRef.current?.focus(), 120);
    }
  }, [isOpen]);

  // Auto-resize textarea
  useEffect(() => {
    const ta = textareaRef.current;
    if (!ta) return;
    ta.style.height = 'auto';
    ta.style.height = Math.min(ta.scrollHeight, 96) + 'px';
  }, [input]);

  const handleSend = () => {
    if (!input.trim() || isLoading) return;
    sendMessage(input);
    setInput('');
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <>
      {/* ── FAB ── */}
      <button
        className={`cw-fab ${isOpen ? 'cw-fab--open' : ''}`}
        onClick={() => setIsOpen((v) => !v)}
        aria-label="Abrir GeoBot"
        title="GeoBot — Asistente de movilidad"
      >
        {isOpen ? <CloseIcon /> : <ChatIcon />}
        {!isOpen && <span className="cw-fab-ring" />}
      </button>

      {/* ── Ventana de chat ── */}
      {isOpen && (
        <div className="cw-window" role="dialog" aria-label="GeoBot chat">

          {/* Header */}
          <div className="cw-header">
            <div className="cw-header-left">
              <div className="cw-header-avatar">
                <BotIcon />
              </div>
              <div>
                <div className="cw-header-title">GeoBot</div>
                <div className="cw-header-sub">{SECTION_LABELS[activeSection] || 'Asistente'}</div>
              </div>
            </div>
            <div className="cw-header-actions">
              <button
                className="cw-icon-btn"
                onClick={clearMessages}
                title="Limpiar conversación"
              >
                <TrashIcon />
              </button>
              <button
                className="cw-icon-btn"
                onClick={() => setIsOpen(false)}
                title="Cerrar"
              >
                <CloseIcon />
              </button>
            </div>
          </div>

          {/* Mensajes */}
          <div className="cw-messages">
            {messages.map((msg) => (
              <div key={msg.id} className={`cw-msg cw-msg--${msg.role}`}>
                {msg.role === 'bot' && (
                  <div className="cw-bot-dot">
                    <BotIcon />
                  </div>
                )}
                <div className="cw-bubble">
                  <SimpleMarkdown text={msg.text} />
                </div>
              </div>
            ))}

            {/* Sugerencias (solo cuando no hay mensajes reales) */}
            {suggestions.length > 0 && (
              <div className="cw-suggestions">
                {suggestions.map((s, i) => (
                  <button
                    key={i}
                    className="cw-chip"
                    onClick={() => sendMessage(s)}
                  >
                    {s}
                  </button>
                ))}
              </div>
            )}

            {/* Loading */}
            {isLoading && (
              <div className="cw-msg cw-msg--bot">
                <div className="cw-bot-dot"><BotIcon /></div>
                <div className="cw-bubble cw-bubble--loading">
                  <span className="cw-dot" />
                  <span className="cw-dot" />
                  <span className="cw-dot" />
                </div>
              </div>
            )}

            {/* Error */}
            {error && (
              <div className="cw-error">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="12" />
                  <line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
                {error}
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="cw-input-area">
            <textarea
              ref={textareaRef}
              className="cw-input"
              placeholder="Pregunta sobre movilidad, comunas, seguridad..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={isLoading}
              rows={1}
            />
            <button
              className="cw-send"
              onClick={handleSend}
              disabled={!input.trim() || isLoading}
              title="Enviar"
            >
              <SendIcon />
            </button>
          </div>
        </div>
      )}
    </>
  );
}