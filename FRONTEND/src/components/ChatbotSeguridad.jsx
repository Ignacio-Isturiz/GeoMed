// src/components/ChatbotSeguridad.jsx

import { useState, useRef, useEffect } from 'react';
import { llmService } from '@/services/llmService';
import MapaLeafletComunas from '@/components/MapaLeafletComunas';

const SUGERENCIAS = [
  '¿Cuál es el barrio más seguro para vivir?',
  'Quiero ir a trotar por La Candelaria, ¿es seguro?',
  'Compara la seguridad entre Laureles y Buenos Aires',
  '¿Cuáles son las zonas más peligrosas de Medellín?',
];

function Mensaje({ msg }) {
  const esBot = msg.role === 'bot';
  return (
    <div style={{
      display: 'flex',
      justifyContent: esBot ? 'flex-start' : 'flex-end',
      marginBottom: '0.75rem',
    }}>
      <div style={{
        maxWidth: esBot && msg.mapa ? '95%' : '80%',
        padding: '0.75rem 1rem',
        borderRadius: esBot ? '0 1rem 1rem 1rem' : '1rem 0 1rem 1rem',
        backgroundColor: esBot ? '#1e293b' : '#ef4444',
        color: 'white',
        fontSize: '0.9rem',
        lineHeight: '1.5',
        whiteSpace: 'pre-wrap',
      }}>
        {msg.text}
        {esBot && msg.mapa && <MapaLeafletComunas comunas={msg.mapa} destacadas={msg.destacadas} />}
      </div>
    </div>
  );
}

export default function ChatbotSeguridad() {
  const [messages, setMessages] = useState([
    {
      role: 'bot',
      text: '¡Hola! Soy tu asistente de seguridad de Medellín. Pregúntame sobre cualquier barrio o comuna y te digo qué tan seguro es según los datos más recientes. 🛡️',
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const enviar = async (texto) => {
    const prompt = texto.trim();
    if (!prompt || loading) return;

    setInput('');
    setMessages((prev) => [...prev, { role: 'user', text: prompt }]);
    setLoading(true);

    try {
      const res = await llmService.securityChat({ prompt });
      const data = res?.data;
      setMessages((prev) => [
        ...prev,
        {
          role: 'bot',
          text: data?.output || 'No pude obtener una respuesta. Intenta de nuevo.',
          mapa: data?.mostrar_mapa ? data?.datos_mapa : null,
          destacadas: data?.comunas_destacadas || [],
        },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: 'bot', text: 'Hubo un error al consultar los datos. Por favor intenta más tarde.' },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      enviar(input);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '480px' }}>
      {/* Área de mensajes */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        padding: '1rem',
        display: 'flex',
        flexDirection: 'column',
      }}>
        {messages.map((msg, i) => (
          <Mensaje key={i} msg={msg} />
        ))}

        {loading && (
          <div style={{ display: 'flex', justifyContent: 'flex-start', marginBottom: '0.75rem' }}>
            <div style={{
              padding: '0.75rem 1rem',
              borderRadius: '0 1rem 1rem 1rem',
              backgroundColor: '#1e293b',
              color: '#94a3b8',
              fontSize: '0.85rem',
            }}>
              Analizando datos de seguridad...
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Sugerencias rápidas */}
      {messages.length <= 1 && (
        <div style={{ padding: '0 1rem', display: 'flex', flexWrap: 'wrap', gap: '0.4rem', marginBottom: '0.5rem' }}>
          {SUGERENCIAS.map((s, i) => (
            <button
              key={i}
              onClick={() => enviar(s)}
              disabled={loading}
              style={{
                padding: '0.3rem 0.7rem',
                fontSize: '0.75rem',
                backgroundColor: 'transparent',
                border: '1px solid #475569',
                borderRadius: '1rem',
                color: '#94a3b8',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
              }}
            >
              {s}
            </button>
          ))}
        </div>
      )}

      {/* Input */}
      <div style={{
        display: 'flex',
        gap: '0.5rem',
        padding: '0.75rem 1rem',
        borderTop: '1px solid #334155',
      }}>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Pregunta sobre un barrio o zona..."
          disabled={loading}
          style={{
            flex: 1,
            padding: '0.6rem 0.9rem',
            borderRadius: '0.5rem',
            border: '1px solid #475569',
            backgroundColor: '#0f172a',
            color: 'white',
            fontSize: '0.9rem',
            outline: 'none',
          }}
        />
        <button
          onClick={() => enviar(input)}
          disabled={loading || !input.trim()}
          style={{
            padding: '0.6rem 1.1rem',
            borderRadius: '0.5rem',
            backgroundColor: loading || !input.trim() ? '#475569' : '#ef4444',
            color: 'white',
            border: 'none',
            cursor: loading || !input.trim() ? 'not-allowed' : 'pointer',
            fontWeight: 'bold',
            fontSize: '0.9rem',
            transition: 'background-color 0.2s',
          }}
        >
          Enviar
        </button>
      </div>
    </div>
  );
}
