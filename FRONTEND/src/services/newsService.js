import { API_CONFIG } from '@/config/api';

const newsService = {
  async getMedellinNews(pageSize = 8, category = 'general') {
    const response = await fetch(
      `${API_CONFIG.baseURL}/api/news/medellin?page_size=${pageSize}&category=${encodeURIComponent(category)}`
    );

    if (!response.ok) {
      const payload = await response.json().catch(() => ({}));
      throw new Error(payload.detail || `Error ${response.status}: ${response.statusText}`);
    }

    return response.json();
  },
};

export default newsService;