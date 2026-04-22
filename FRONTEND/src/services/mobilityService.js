const API_URL = 'http://127.0.0.1:8000/api';

const mobilityService = {
    getMobilityGeoData: async () => {
        const response = await fetch(`${API_URL}/movilidad`);
        if (!response.ok) throw new Error('Error al cargar datos geoespaciales de movilidad');
        return await response.json();
    },
    getHourSummary: async () => {
        const response = await fetch(`${API_URL}/mobility/summary/hour`);
        if (!response.ok) throw new Error('Error al cargar resumen por hora');
        return await response.json();
    },
    getComunaSummary: async () => {
        const response = await fetch(`${API_URL}/mobility/summary/comuna`);
        if (!response.ok) throw new Error('Error al cargar resumen por comuna');
        return await response.json();
    },
    getCriticalCorridors: async () => {
        const response = await fetch(`${API_URL}/mobility/critical-corridors`);
        if (!response.ok) throw new Error('Error al cargar corredores críticos');
        return await response.json();
    },
    getRecommendations: async () => {
        const response = await fetch(`${API_URL}/mobility/recommendations`);
        if (!response.ok) throw new Error('Error al cargar recomendaciones');
        return await response.json();
    },
    getCiclorrutas: async () => {
        const response = await fetch(`${API_URL}/datasets/ciclorrutas`);
        if (!response.ok) throw new Error('Error al cargar ciclorrutas');
        const result = await response.json();
        return result.data || [];
    }
};

export default mobilityService;
