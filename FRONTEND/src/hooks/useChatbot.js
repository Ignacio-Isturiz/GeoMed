/**
 * useChatbot.js - Versión Optimizada para la Hackathon
 */
import { useState, useCallback, useRef, useEffect } from 'react';
import { sendChatMessage } from '@/services/llmService';

const WELCOME_BY_SECTION = {
  analisis: {
    id: '__welcome__',
    role: 'bot',
    text: '¡Hola! Soy **GeoBot** 🗺️\n\nPuedo ayudarte con:\n- Corredores más críticos entre semana\n- Comunas con mayor presión vehicular\n- Anomalías de tráfico detectadas\n- Recomendaciones de intervención\n\n¿Qué quieres saber?',
  },
  inicio: {
    id: '__welcome__',
    role: 'bot',
    text: '¡Hola! Soy **GeoBot** 🚦\n\nPuedo ayudarte con:\n- Estado del tráfico por corredor\n- Velocidades y ocupación vehicular\n- Horas pico y comparativas\n- Rutas alternas y gestión semafórica\n\n¿En qué te ayudo?',
  },
  noticias: {
    id: '__welcome__',
    role: 'bot',
    text: '¡Hola! Soy **GeoBot** 📰\n\nPuedo ayudarte con:\n- Noticias de movilidad en Medellín\n- Obras viales y cierres\n- Eventos que afectan el tráfico\n- Recomendaciones operativas\n\n¿Qué quieres consultar?',
  },
};

const SUGGESTIONS_BY_SECTION = {
  analisis: [
    '¿Cuáles son los 10 corredores más críticos entre semana?',
    '¿Qué comunas concentran más presión vehicular en hora pico?',
    '¿Qué anomalías hay esta semana?',
    '¿Dónde hay baja velocidad y alto flujo al mismo tiempo?',
  ],
  inicio: [
    '¿Cuál es la hora pico más congestionada?',
    '¿Cómo está el tráfico en Autopista Norte?',
    '¿Qué corredor debo evitar ahora?',
    '¿Qué zona debería priorizar rutas alternas?',
  ],
  noticias: [
    '¿Hay obras en la ciudad hoy?',
    '¿Qué está pasando con la movilidad?',
    '¿Qué zonas deberían reforzar gestión semafórica?',
  ],
};

export function useChatbot(activeSection = 'analisis') {
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const lastSectionRef = useRef(null);

  // Sincronizar el mensaje de bienvenida
  useEffect(() => {
    if (lastSectionRef.current !== activeSection) {
      lastSectionRef.current = activeSection;
      setMessages((prev) => {
        const hasRealMessages = prev.some((m) => m.id !== '__welcome__');
        if (hasRealMessages) return prev; 
        return []; 
      });
    }
  }, [activeSection]);

  const welcome = WELCOME_BY_SECTION[activeSection] || WELCOME_BY_SECTION.analisis;
  const suggestions = SUGGESTIONS_BY_SECTION[activeSection] || SUGGESTIONS_BY_SECTION.analisis;

  const sendMessage = useCallback(
    async (text) => {
      const trimmedText = text?.trim();
      if (!trimmedText || isLoading) return;

      const userMsg = {
        id: `u_${Date.now()}`,
        role: 'user',
        text: trimmedText,
      };

      setMessages((prev) => [...prev, userMsg]);
      setIsLoading(true);
      setError(null);

      try {
        // Pasamos el historial básico para que Claude no pierda el hilo
        const response = await sendChatMessage(trimmedText, activeSection);

        const botMsg = {
          id: `b_${Date.now()}`,
          role: 'bot',
          text: response.text || response.output || "No tengo una respuesta clara para eso.",
          extra: response.extra || { mock: false },
        };

        setMessages((prev) => [...prev, botMsg]);
      } catch (err) {
        console.error("Chat Error:", err);
        setError('Lo siento, Manuel. No pude procesar tu solicitud ahora.');
      } finally {
        setIsLoading(false);
      }
    },
    [activeSection, isLoading] // El isLoading aquí previene envíos dobles
  );

  const clearMessages = useCallback(() => {
    setMessages([]);
    setError(null);
  }, []);

  const hasRealMessages = messages.length > 0;

  return {
    messages: [welcome, ...messages],
    isLoading,
    error,
    sendMessage,
    clearMessages,
    suggestions: hasRealMessages ? [] : suggestions,
    hasRealMessages,
  };
}