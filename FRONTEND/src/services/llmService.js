import { API_CONFIG, getAuthHeaders } from "../config/api";

export const llmService = {
  async getModels() {
    const response = await fetch(`${API_CONFIG.baseURL}/api/llm/models`);
    if (!response.ok) throw new Error(`Error ${response.status}: ${response.statusText}`);
    return response.json();
  },

  async chat({ prompt, model = "gpt-4o-mini-sim" }) {
    const response = await fetch(`${API_CONFIG.baseURL}/api/llm/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt, model }),
    });

    if (!response.ok) throw new Error(`Error ${response.status}: ${response.statusText}`);
    return response.json();
  },

  async recommendation({ business_type, comuna = null }) {
    const response = await fetch(`${API_CONFIG.baseURL}/api/llm/recommendation`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ business_type, comuna }),
    });

    if (!response.ok) throw new Error(`Error ${response.status}: ${response.statusText}`);
    return response.json();
  },

  async securityChat({ prompt }) {
    const response = await fetch(`${API_CONFIG.baseURL}/api/llm/seguridad/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt }),
    });

    if (!response.ok) throw new Error(`Error ${response.status}: ${response.statusText}`);
    return response.json();
  },
};
