// src/components/ChatbotEmprendedor.jsx

import { useState, useRef, useEffect } from 'react';
import { llmService } from '@/services/llmService';
import ChatMap from './ChatMap';

const SUGERENCIAS = [
  'Quiero montar una cafetería en Medellín',
  '¿Cuántas cafeterías hay en el Poblado?',
  'Negocio de ropa en Aranjuez, estratos 3 y 4',
  '¿Dónde abro una tienda con bajo presupuesto?',
];

function Mensaje({ msg }) {
  const esBot = msg.role === 'bot';
  return (
    <div style={{
      display: 'flex',
      justifyContent: esBot ? 'flex-start' : 'flex-end',
      marginBottom: '0.75rem',
      alignItems: esBot ? 'flex-start' : 'flex-end',
    }}>
      <div style={{
        maxWidth: '85%',
        padding: '0.75rem 1rem',
        borderRadius: esBot ? '0 1rem 1rem 1rem' : '1rem 0 1rem 1rem',
        backgroundColor: esBot ? '#1e293b' : '#00C896',
        color: 'white',
        fontSize: '0.9rem',
        lineHeight: '1.5',
        whiteSpace: 'pre-wrap',
      }}>
        {msg.text}
        
        {/* Mapa */}
        {esBot && msg.mapData && msg.mapData.locations && msg.mapData.locations.length > 0 && (
          <ChatMap locations={msg.mapData.locations} />
        )}

        {esBot && msg.recomendaciones && msg.recomendaciones.length > 0 && (
          <div style={{ marginTop: '1rem', borderTop: '1px solid #475569', paddingTop: '0.75rem' }}>
            <div style={{ fontSize: '0.85rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>
              📋 Recomendaciones:
            </div>
            <ul style={{ margin: '0.3rem 0', paddingLeft: '1.2rem', fontSize: '0.85rem' }}>
              {msg.recomendaciones.map((rec, idx) => (
                <li key={idx} style={{ marginBottom: '0.3rem' }}>
                  {rec}
                </li>
              ))}
            </ul>
          </div>
        )}
        {esBot && msg.costos && msg.costos.total_servicios && (
          <div style={{
            marginTop: '0.75rem',
            backgroundColor: 'rgba(0,200,150,0.2)',
            padding: '0.6rem',
            borderRadius: '0.4rem',
            fontSize: '0.85rem',
            border: '1px solid #00C896',
          }}>
            <div style={{ fontWeight: 'bold', marginBottom: '0.3rem' }}>💰 Costos mensuales estimados:</div>
            {msg.costos.energia_estimada && (
              <div>Energía: ${msg.costos.energia_estimada.toLocaleString('es-CO')}</div>
            )}
            {msg.costos.agua_estimada && (
              <div>Agua: ${msg.costos.agua_estimada.toLocaleString('es-CO')}</div>
            )}
            {msg.costos.gas_estimada && (
              <div>Gas: ${msg.costos.gas_estimada.toLocaleString('es-CO')}</div>
            )}
            {msg.costos.total_servicios && (
              <div style={{ fontWeight: 'bold', marginTop: '0.3rem', color: '#00FF88' }}>
                Total: ${msg.costos.total_servicios.toLocaleString('es-CO')}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default function ChatbotEmprendedor({ conversationId = null, onConversationChange = null }) {
  const [messages, setMessages] = useState([
    {
      role: 'bot',
      text: '¡Hola emprendedor! 🚀 Soy tu asistente para abrir un negocio en Medellín. Te ayudaré a elegir la mejor ubicación analizando datos reales de competencia, costos de servicios y tendencias de mercado.',
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [currentConvId, setCurrentConvId] = useState(conversationId);
  const bottomRef = useRef(null);

  // Load conversation history when conversationId changes
  useEffect(() => {
    if (conversationId !== currentConvId) {
      setCurrentConvId(conversationId);
      loadConversationHistory(conversationId);
    }
  }, [conversationId, currentConvId]);

  const loadConversationHistory = async (convId) => {
    if (!convId) {
      // New conversation
      setMessages([
        {
          role: 'bot',
          text: '¡Hola emprendedor! 🚀 Soy tu asistente para abrir un negocio en Medellín. Te ayudaré a elegir la mejor ubicación analizando datos reales de competencia, costos de servicios y tendencias de mercado.',
        },
      ]);
      return;
    }

    try {
      const res = await llmService.getConversation(convId);
      if (res.success && res.data.messages) {
        setMessages(res.data.messages);
      }
    } catch (error) {
      console.error('Error loading conversation:', error);
    }
  };

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
      const res = await llmService.entrepreneurChat({ prompt, conversation_id: currentConvId });
      const data = res?.data;

      // Update conversation ID if it's a new one
      if (data?.conversation_id && data.conversation_id !== currentConvId) {
        setCurrentConvId(data.conversation_id);
        if (onConversationChange) {
          onConversationChange(data.conversation_id);
        }
      }

      setMessages((prev) => [
        ...prev,
        {
          role: 'bot',
          text: data?.output || 'No pude procesar tu consulta. Intenta describir mejor tu idea de negocio.',
          recomendaciones: data?.recomendaciones_especificas || [],
          costos: data?.prediccion_costo_mensual || {},
          mapData: data?.map_data,
        },
      ]);
    } catch (error) {
      console.error('Error:', error);
      setMessages((prev) => [
        ...prev,
        { role: 'bot', text: 'Hubo un error al procesar tu consulta. Por favor intenta más tarde.' },
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
              Analizando datos de negocios en Medellín...
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
                border: '1px solid #00C896',
                borderRadius: '1rem',
                color: '#00C896',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                transition: 'all 0.2s',
              }}
              onHover={(e) => {
                if (!loading) {
                  e.target.style.backgroundColor = 'rgba(0, 200, 150, 0.1)';
                }
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
          placeholder="Cuéntame tu idea de negocio, ubicación y presupuesto..."
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
            backgroundColor: loading || !input.trim() ? '#475569' : '#00C896',
            color: loading || !input.trim() ? '#94a3b8' : '#0F172A',
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
