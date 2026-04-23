/**
 * llmService.js
 * Consume endpoints LLM reales del backend GeoMed.
 */

const BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000';

/**
 * System prompts por sección para enriquecer el contexto del chat general.
 */
const SECTION_PROMPTS = {
  analisis: `Eres GeoBot, asistente de análisis estratégico de movilidad urbana en Medellín para la plataforma GeoMed.
Tienes acceso a datos de corredores críticos, índices de congestión, anomalías de tráfico y recomendaciones de intervención.
Responde en español, de forma concisa y técnica. Si te preguntan por seguridad ciudadana, responde basándote en datos de comunas.`,

  inicio: `Eres GeoBot, asistente del Geovisor de Movilidad de GeoMed para Medellín.
Tienes acceso a datos de tráfico en tiempo real, velocidades por corredor, ocupación vehicular y comparativas horarias.
Responde en español, de forma clara y útil para el conductor o ciudadano que consulta.`,

  noticias: `Eres GeoBot, asistente de noticias y actualidad de GeoMed para Medellín y Antioquia.
Puedes comentar sobre movilidad urbana, obras viales, eventos que afectan el tráfico y noticias de ciudad.
Responde en español, de forma informativa y cercana.`,
};

/**
 * Envía un mensaje al chatbot según la sección activa.
 * Siempre usa el flujo de movilidad para mantener el reto alineado.
 *
 * @param {string} prompt - Mensaje del usuario
 * @param {string} section - 'analisis' | 'inicio' | 'noticias'
 * @returns {Promise<{ text: string, extra: object }>}
 */
export async function sendChatMessage(prompt, section = 'analisis') {
  const sectionPrompt = SECTION_PROMPTS[section] || SECTION_PROMPTS.analisis;
  const contextualPrompt = `${sectionPrompt}\n\n[Pregunta del usuario]\n${prompt}`;

  const res = await fetch(`${BASE}/api/llm/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({
      prompt: contextualPrompt,
      model: 'auto',
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.detail || `Error ${res.status}`);
  }

  const json = await res.json();
  return {
    text: json.data?.output || 'Sin respuesta del servidor.',
    extra: {
      mock: json.data?.mock ?? false,
      provider: json.data?.provider,
      status: json.data?.status,
    },
  };
}

/**
 * Compatibilidad con componentes antiguos que esperaban un método de seguridad.
 * Ahora reutiliza el flujo de movilidad para evitar respuestas fuera del reto.
 *
 * @param {string} prompt
 * @returns {Promise<{ text: string, extra: object }>}
 */
export async function sendSecurityMessage(prompt) {
  return sendChatMessage(prompt, 'analisis');
}

// Compatibilidad con componentes antiguos que usan llmService.securityChat(...)
export const llmService = {
  async chat({ prompt, section = 'analisis' }) {
    return sendChatMessage(prompt, section);
  },
  async securityChat({ prompt }) {
    const result = await sendSecurityMessage(prompt);
    return {
      success: true,
      data: {
        output: result.text,
        mostrar_mapa: result.extra?.mostrarMapa,
        comunas_destacadas: result.extra?.comunasDestacadas,
        provider: result.extra?.provider,
        mock: result.extra?.mock,
      },
    };
  },
};