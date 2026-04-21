import { useEffect, useMemo, useState } from 'react';
import { datasetsService } from '@/services/datasetsService';

function formatNumber(value) {
  return Number(value || 0).toLocaleString('es-CO');
}

function isMissingLabel(value) {
  if (value === null || value === undefined) return true;
  const text = String(value).trim().toLowerCase();
  return text === '' || text === 'n/a' || text === 'na' || text === 'null' || text === 'none' || text === '-';
}

function MiniBars({ items, labelKey, valueKey, color = '#2563eb', prefix = '', suffix = '' }) {
  const validItems = useMemo(
    () => items.filter((item) => !isMissingLabel(item[labelKey])),
    [items, labelKey]
  );

  const maxValue = useMemo(
    () => Math.max(...validItems.map((item) => Number(item[valueKey] || 0)), 1),
    [validItems, valueKey]
  );

  return (
    <div style={{ display: 'grid', gap: '0.45rem' }}>
      {validItems.map((item, index) => {
        const rawValue = Number(item[valueKey] || 0);
        const width = Math.max(6, Math.round((rawValue / maxValue) * 100));
        return (
          <div key={`${item[labelKey]}-${index}`}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.86rem' }}>
              <span>{item[labelKey]}</span>
              <strong>{prefix}{rawValue.toLocaleString('es-CO')}{suffix}</strong>
            </div>
            <div style={{ height: '7px', backgroundColor: '#e5e7eb', borderRadius: '999px' }}>
              <div
                style={{
                  width: `${width}%`,
                  height: '7px',
                  backgroundColor: color,
                  borderRadius: '999px'
                }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default function NegociosCoberturaSection() {
  const [activeView, setActiveView] = useState('estratificacion');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [periodo, setPeriodo] = useState('');
  const [periodos, setPeriodos] = useState([]);
  const [summary, setSummary] = useState(null);
  const [porServicio, setPorServicio] = useState([]);
  const [porEstrato, setPorEstrato] = useState([]);
  const [topCobertura, setTopCobertura] = useState([]);

  const [tarifaDataset, setTarifaDataset] = useState('acueducto');
  const [tarifaYear, setTarifaYear] = useState('');
  const [tarifaYears, setTarifaYears] = useState([]);
  const [tarifaSummary, setTarifaSummary] = useState(null);
  const [tarifaPorEstrato, setTarifaPorEstrato] = useState([]);
  const [tarifaTrend, setTarifaTrend] = useState([]);

  const tarifaLabels = {
    acueducto: 'Acueducto',
    gas: 'Gas',
    energia: 'Energia'
  };

  useEffect(() => {
    const loadEstratificacion = async () => {
      try {
        setLoading(true);
        setError('');
        const periodoParam = periodo || null;
        const [summaryRes, servicioRes, estratoRes, topRes] = await Promise.all([
          datasetsService.getEstratificacionSummary(periodoParam),
          datasetsService.getEstratificacionPorServicio(periodoParam),
          datasetsService.getEstratificacionPorEstrato(periodoParam),
          datasetsService.getEstratificacionTopCobertura(periodoParam, 5),
        ]);

        const summaryData = summaryRes?.data || null;
        setSummary(summaryData);
        setPorServicio(servicioRes?.data || []);
        setPorEstrato(estratoRes?.data || []);
        setTopCobertura(topRes?.data || []);
        setPeriodos(summaryData?.available_periodos || []);
      } catch (err) {
        setError(err.message || 'No se pudo cargar estratificacion y cobertura');
      } finally {
        setLoading(false);
      }
    };

    loadEstratificacion();
  }, [periodo]);

  useEffect(() => {
    const loadTarifas = async () => {
      try {
        setLoading(true);
        setError('');
        const yearParam = tarifaYear === '' ? null : Number(tarifaYear);
        const [summaryRes, estratoRes, trendRes] = await Promise.all([
          datasetsService.getTarifasSummary(tarifaDataset, yearParam),
          datasetsService.getTarifasPorEstrato(tarifaDataset, yearParam),
          datasetsService.getTarifasTendencia(tarifaDataset, yearParam, 12),
        ]);

        const summaryData = summaryRes?.data || null;
        setTarifaSummary(summaryData);
        setTarifaPorEstrato(estratoRes?.data || []);
        setTarifaTrend(trendRes?.data || []);
        setTarifaYears(summaryData?.available_years || []);
      } catch (err) {
        setError(err.message || 'No se pudo cargar tarifas EPM');
      } finally {
        setLoading(false);
      }
    };

    loadTarifas();
  }, [tarifaDataset, tarifaYear]);

  if (loading) {
    return <p style={{ color: '#6b7280', marginTop: '0.5rem' }}>Cargando analisis de datos...</p>;
  }

  if (error) {
    return <p style={{ color: '#b91c1c', marginTop: '0.5rem' }}>{error}</p>;
  }

  return (
    <div style={{ marginTop: '0.75rem' }}>
      <div style={{ display: 'flex', gap: '0.4rem', marginBottom: '0.75rem', flexWrap: 'wrap' }}>
        <button
          onClick={() => setActiveView('estratificacion')}
          style={{
            border: '1px solid #d1d5db',
            backgroundColor: activeView === 'estratificacion' ? '#111827' : '#fff',
            color: activeView === 'estratificacion' ? '#fff' : '#111827',
            borderRadius: '0.4rem',
            padding: '0.32rem 0.55rem',
            cursor: 'pointer'
          }}
        >
          Estratificacion y Cobertura
        </button>
        <button
          onClick={() => setActiveView('tarifas')}
          style={{
            border: '1px solid #d1d5db',
            backgroundColor: activeView === 'tarifas' ? '#111827' : '#fff',
            color: activeView === 'tarifas' ? '#fff' : '#111827',
            borderRadius: '0.4rem',
            padding: '0.32rem 0.55rem',
            cursor: 'pointer'
          }}
        >
          Tarifas EPM
        </button>
      </div>

      {activeView === 'estratificacion' && (
        <>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem', gap: '0.75rem' }}>
            <p style={{ margin: 0, color: '#4b5563' }}>Cobertura por estrato y comparativo por servicio.</p>
            <select
              value={periodo}
              onChange={(e) => setPeriodo(e.target.value)}
              style={{ border: '1px solid #d1d5db', borderRadius: '0.4rem', padding: '0.3rem 0.5rem', backgroundColor: '#fff' }}
            >
              <option value="">Todos los periodos</option>
              {periodos.map((item) => (
                <option key={item} value={item}>{item}</option>
              ))}
            </select>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: '0.5rem', marginBottom: '0.75rem' }}>
            <div style={{ border: '1px solid #dbeafe', backgroundColor: '#eff6ff', borderRadius: '0.5rem', padding: '0.6rem' }}>
              <p style={{ margin: 0, fontSize: '0.8rem', color: '#1d4ed8' }}>Total Suscriptores</p>
              <p style={{ margin: '0.2rem 0 0', fontWeight: 700 }}>{formatNumber(summary?.total_suscriptores)}</p>
            </div>
            <div style={{ border: '1px solid #dcfce7', backgroundColor: '#f0fdf4', borderRadius: '0.5rem', padding: '0.6rem' }}>
              <p style={{ margin: 0, fontSize: '0.8rem', color: '#15803d' }}>Cobertura Promedio</p>
              <p style={{ margin: '0.2rem 0 0', fontWeight: 700 }}>{Number(summary?.cobertura_promedio || 0).toLocaleString('es-CO')}%</p>
            </div>
            <div style={{ border: '1px solid #ffedd5', backgroundColor: '#fff7ed', borderRadius: '0.5rem', padding: '0.6rem' }}>
              <p style={{ margin: 0, fontSize: '0.8rem', color: '#c2410c' }}>Servicio Lider</p>
              <p style={{ margin: '0.2rem 0 0', fontWeight: 700 }}>{porServicio[0]?.servicio || 'N/A'}</p>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.75rem' }}>
            <div style={{ border: '1px solid #e5e7eb', borderRadius: '0.5rem', padding: '0.6rem' }}>
              <p style={{ margin: '0 0 0.4rem', fontWeight: 700 }}>Suscriptores por Servicio</p>
              <MiniBars items={porServicio.slice(0, 5)} labelKey="servicio" valueKey="total_suscriptores" color="#2563eb" />
            </div>
            <div style={{ border: '1px solid #e5e7eb', borderRadius: '0.5rem', padding: '0.6rem' }}>
              <p style={{ margin: '0 0 0.4rem', fontWeight: 700 }}>Top Cobertura (%)</p>
              <MiniBars
                items={topCobertura.slice(0, 5).map((item) => ({ etiqueta: `${item.servicio} E${item.estrato}`, valor: item.cobertura }))}
                labelKey="etiqueta"
                valueKey="valor"
                color="#16a34a"
                suffix="%"
              />
            </div>
            <div style={{ border: '1px solid #e5e7eb', borderRadius: '0.5rem', padding: '0.6rem' }}>
              <p style={{ margin: '0 0 0.4rem', fontWeight: 700 }}>Suscriptores por Estrato</p>
              <MiniBars
                items={porEstrato
                  .filter((item) => !isMissingLabel(item.estrato))
                  .map((item) => ({ etiqueta: `E${item.estrato}`, valor: item.total_suscriptores }))}
                labelKey="etiqueta"
                valueKey="valor"
                color="#7c3aed"
              />
            </div>
          </div>
        </>
      )}

      {activeView === 'tarifas' && (
        <>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem', gap: '0.75rem', flexWrap: 'wrap' }}>
            <p style={{ margin: 0, color: '#4b5563' }}>Tres datasets integrados: gas, acueducto y energia.</p>
            <div style={{ display: 'flex', gap: '0.4rem' }}>
              <select
                value={tarifaDataset}
                onChange={(e) => setTarifaDataset(e.target.value)}
                style={{ border: '1px solid #d1d5db', borderRadius: '0.4rem', padding: '0.3rem 0.5rem', backgroundColor: '#fff' }}
              >
                <option value="acueducto">Acueducto</option>
                <option value="gas">Gas</option>
                <option value="energia">Energia</option>
              </select>
              <select
                value={tarifaYear}
                onChange={(e) => setTarifaYear(e.target.value)}
                style={{ border: '1px solid #d1d5db', borderRadius: '0.4rem', padding: '0.3rem 0.5rem', backgroundColor: '#fff' }}
              >
                <option value="">Todos los anos</option>
                {tarifaYears.map((y) => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: '0.5rem', marginBottom: '0.75rem' }}>
            <div style={{ border: '1px solid #dbeafe', backgroundColor: '#eff6ff', borderRadius: '0.5rem', padding: '0.6rem' }}>
              <p style={{ margin: 0, fontSize: '0.8rem', color: '#1d4ed8' }}>Dataset</p>
              <p style={{ margin: '0.2rem 0 0', fontWeight: 700 }}>{tarifaLabels[tarifaDataset]}</p>
            </div>
            <div style={{ border: '1px solid #dcfce7', backgroundColor: '#f0fdf4', borderRadius: '0.5rem', padding: '0.6rem' }}>
              <p style={{ margin: 0, fontSize: '0.8rem', color: '#15803d' }}>Tarifa Promedio</p>
              <p style={{ margin: '0.2rem 0 0', fontWeight: 700 }}>${Number(tarifaSummary?.tarifa_promedio || 0).toLocaleString('es-CO')}</p>
            </div>
            <div style={{ border: '1px solid #ffedd5', backgroundColor: '#fff7ed', borderRadius: '0.5rem', padding: '0.6rem' }}>
              <p style={{ margin: 0, fontSize: '0.8rem', color: '#c2410c' }}>Registros</p>
              <p style={{ margin: '0.2rem 0 0', fontWeight: 700 }}>{formatNumber(tarifaSummary?.total_registros)}</p>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            <div style={{ border: '1px solid #e5e7eb', borderRadius: '0.5rem', padding: '0.6rem' }}>
              <p style={{ margin: '0 0 0.4rem', fontWeight: 700 }}>Tarifa promedio por estrato</p>
              <MiniBars
                items={tarifaPorEstrato
                  .filter((item) => !isMissingLabel(item.estrato))
                  .map((item) => ({ etiqueta: item.estrato, valor: item.tarifa_promedio }))}
                labelKey="etiqueta"
                valueKey="valor"
                color="#2563eb"
                prefix="$"
              />
            </div>
            <div style={{ border: '1px solid #e5e7eb', borderRadius: '0.5rem', padding: '0.6rem' }}>
              <p style={{ margin: '0 0 0.4rem', fontWeight: 700 }}>Tendencia mensual</p>
              <MiniBars
                items={tarifaTrend.slice(0, 10).map((item) => ({ etiqueta: item.periodo, valor: item.tarifa_promedio }))}
                labelKey="etiqueta"
                valueKey="valor"
                color="#16a34a"
                prefix="$"
              />
            </div>
          </div>
        </>
      )}
    </div>
  );
}
