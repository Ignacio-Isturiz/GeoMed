import { useEffect, useRef, useState } from 'react';
import newsService from '@/services/newsService';

const CATEGORY_OPTIONS = [
  { value: 'general', label: 'General' },
  { value: 'seguridad', label: 'Seguridad' },
  { value: 'emprendimiento', label: 'Emprendimiento' },
  { value: 'movilidad', label: 'Movilidad' },
  { value: 'salud', label: 'Salud' },
  { value: 'economia', label: 'Economia' },
];

export default function CitizenNewsSection({
  title = 'Noticias de Medellin',
  defaultCategory = 'general',
  showCategoryFilter = true,
}) {
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [category, setCategory] = useState(defaultCategory);
  const cacheRef = useRef({});

  useEffect(() => {
    setCategory(defaultCategory);
  }, [defaultCategory]);

  useEffect(() => {
    const loadNews = async () => {
      if (cacheRef.current[category]) {
        setArticles(cacheRef.current[category]);
        setLoading(false);
        setError('');
        return;
      }

      try {
        setLoading(true);
        setError('');
        const response = await newsService.getMedellinNews(6, category);
        const nextArticles = response?.data || [];
        setArticles(nextArticles);
        cacheRef.current[category] = nextArticles;
      } catch (err) {
        setError(err.message || 'No se pudieron cargar noticias');
      } finally {
        setLoading(false);
      }
    };

    loadNews();
  }, [category]);

  if (loading) {
    return (
      <div style={{ border: '1px solid #ccc', padding: '1rem' }}>
        <h2>{title}</h2>
        {showCategoryFilter && (
          <p style={{ marginTop: '0.25rem', color: '#6b7280', fontSize: '0.9rem' }}>
            Categoria: {CATEGORY_OPTIONS.find((item) => item.value === category)?.label || category}
          </p>
        )}
        <p>Cargando noticias...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ border: '1px solid #fca5a5', padding: '1rem', backgroundColor: '#fef2f2' }}>
        <h2>{title}</h2>
        <p style={{ color: '#b91c1c' }}>{error}</p>
      </div>
    );
  }

  return (
    <div style={{ border: '1px solid #ccc', padding: '1rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
        <h2 style={{ margin: 0 }}>{title}</h2>
        {showCategoryFilter && (
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            style={{
              border: '1px solid #d1d5db',
              borderRadius: '0.5rem',
              padding: '0.35rem 0.5rem',
              backgroundColor: '#fff'
            }}
          >
            {CATEGORY_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        )}
      </div>
      <div style={{ display: 'grid', gap: '0.75rem' }}>
        {articles.length === 0 && (
          <p style={{ margin: 0, color: '#6b7280' }}>
            No hay noticias disponibles para esta categoría en este momento.
          </p>
        )}
        {articles.slice(0, 6).map((article, index) => (
          <a
            key={`${article.url}-${index}`}
            href={article.url}
            target="_blank"
            rel="noreferrer"
            style={{
              display: 'block',
              padding: '0.75rem',
              border: '1px solid #e5e7eb',
              borderRadius: '0.5rem',
              textDecoration: 'none',
              color: '#111827',
              backgroundColor: '#f9fafb'
            }}
          >
            <p style={{ margin: 0, fontSize: '0.8rem', color: '#6b7280' }}>
              {article.source || 'Fuente no disponible'}
            </p>
            <p style={{ margin: '0.3rem 0 0.4rem', fontWeight: 700 }}>
              {article.title || 'Sin titular'}
            </p>
            {article.description && (
              <p style={{ margin: 0, color: '#4b5563', fontSize: '0.92rem' }}>
                {article.description}
              </p>
            )}
          </a>
        ))}
      </div>
    </div>
  );
}
