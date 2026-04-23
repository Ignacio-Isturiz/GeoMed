const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';
const CACHE_TTL_MS = 120000;
const memoryCache = new Map();
const inFlight = new Map();

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const getCacheValue = (key) => {
    const now = Date.now();
    const memoryEntry = memoryCache.get(key);
    if (memoryEntry && now - memoryEntry.ts < CACHE_TTL_MS) {
        return memoryEntry.data;
    }

    try {
        const raw = sessionStorage.getItem(`mobility-cache:${key}`);
        if (!raw) return null;
        const parsed = JSON.parse(raw);
        if (now - parsed.ts < CACHE_TTL_MS) {
            memoryCache.set(key, parsed);
            return parsed.data;
        }
    } catch {
        // No-op: fallback a red si cache falla.
    }

    return null;
};

const setCacheValue = (key, data) => {
    const entry = { ts: Date.now(), data };
    memoryCache.set(key, entry);
    try {
        sessionStorage.setItem(`mobility-cache:${key}`, JSON.stringify(entry));
    } catch {
        // No-op: en caso de cuota/sesión bloqueada.
    }
};

/**
 * Función base para peticiones JSON con reintentos y timeout manual.
 */
const requestJson = async (url, options = {}, { timeoutMs = 30000, retries = 1 } = {}) => {
    let lastError;

    for (let attempt = 0; attempt <= retries; attempt += 1) {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), timeoutMs);

        try {
            const response = await fetch(url, { ...options, signal: controller.signal });
            if (!response.ok) {
                throw new Error(`HTTP ${response.status} en ${url}`);
            }
            return await response.json();
        } catch (error) {
            if (error?.name === 'AbortError') {
                lastError = new Error(`Timeout excedido (${timeoutMs}ms) para ${url}`);
            } else {
                lastError = error;
            }
            if (attempt < retries) {
                await sleep(500 * (attempt + 1));
            }
        } finally {
            clearTimeout(timeout);
        }
    }

    throw lastError;
};

const requestJsonCached = async (cacheKey, url, options = {}, requestOpts = {}) => {
    const cached = getCacheValue(cacheKey);
    if (cached) return cached;

    if (inFlight.has(cacheKey)) {
        return inFlight.get(cacheKey);
    }

    const requestPromise = requestJson(url, options, requestOpts)
        .then((json) => {
            setCacheValue(cacheKey, json);
            return json;
        })
        .finally(() => {
            inFlight.delete(cacheKey);
        });

    inFlight.set(cacheKey, requestPromise);
    return requestPromise;
};

const mobilityService = {
    // --- DATOS DE MOVILIDAD ---
    getMobilityGeoData: async (limit = 3500) => {
        return await requestJson(`${API_URL}/api/movilidad?limit=${limit}`, {}, { timeoutMs: 35000, retries: 1 });
    },
    getHourSummary: async () => {
        return await requestJsonCached('summary-hour', `${API_URL}/api/mobility/summary/hour`, {}, { timeoutMs: 10000, retries: 1 });
    },
    getComunaSummary: async () => {
        return await requestJsonCached('summary-comuna', `${API_URL}/api/mobility/summary/comuna`, {}, { timeoutMs: 10000, retries: 1 });
    },
    getCriticalCorridors: async () => {
        return await requestJsonCached('critical-corridors', `${API_URL}/api/mobility/critical-corridors`, {}, { timeoutMs: 10000, retries: 1 });
    },
    getRecommendations: async () => {
        return await requestJsonCached('recommendations', `${API_URL}/api/mobility/recommendations`, {}, { timeoutMs: 10000, retries: 1 });
    },

    // --- DATASETS ADICIONALES ---
    getCiclorrutas: async () => {
        const result = await requestJson(`${API_URL}/api/datasets/ciclorrutas`, {}, { timeoutMs: 12000, retries: 1 });
        return result.data || [];
    },

    // --- ANALÍTICA AVANZADA ---
    getDashboardSummary: async () => {
        const result = await requestJsonCached('dashboard-summary', `${API_URL}/api/analytics/dashboard-summary`, {}, { timeoutMs: 35000, retries: 2 });
        return result.data || null;
    },
    analyzeCorridorHour: async (corredor, hora) => {
        const result = await requestJson(`${API_URL}/api/analytics/analyze`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ corredor, hora })
        }, { timeoutMs: 30000, retries: 1 });
        return result.data || null;
    },

    /**
     * Consume la API real de Anthropic/Claude para el Chatbot de GEOMED.
     * @param {string} prompt - Pregunta del usuario.
     * @param {string} section - Contexto actual (analisis, inicio, noticias).
     */
    askChatbot: async (prompt, section = 'general') => {
        return await requestJson(`${API_URL}/api/chat/ask`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ prompt, section })
        }, { timeoutMs: 25000, retries: 0 }); // Bajamos retries para respuesta inmediata
    }
};

export default mobilityService;