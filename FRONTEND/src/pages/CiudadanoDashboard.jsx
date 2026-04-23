import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import mobilityService from '@/services/mobilityService';

import DashboardLayout, { Icons } from '@/components/dashboard/DashboardLayout';
import MobilityMap from '@/components/MobilityMap';
import MobilityDashboard from '@/components/MobilityDashboard';

const NAV = [
  { id: 'analisis', label: 'Análisis Estratégico', icon: <Icons.Chart /> },
  { id: 'inicio', label: 'Movilidad', icon: <Icons.Dashboard /> },
  { id: 'noticias', label: 'Noticias', icon: <Icons.News /> },
];

const CAT_OPTIONS = [
  { value: 'general', label: 'General' },
  { value: 'seguridad', label: 'Seguridad' },
  { value: 'emprendimiento', label: 'Emprendimiento' },
  { value: 'movilidad', label: 'Movilidad' },
  { value: 'salud', label: 'Salud' },
  { value: 'economia', label: 'Economía' },
];

export default function CiudadanoDashboard() {
  const navigate = useNavigate();
  const user = { full_name: 'Invitado GEOMED' };
  const [mod, setMod] = useState('analisis');

  const [comunaData, setComunaData] = useState([]);
  const [corridors, setCorridors] = useState([]);
  const [topNoticias, setTopNoticias] = useState([]);
  const [hourData, setHourData] = useState([]);
  const [filterType, setFilterType] = useState('all');
  const [dashboardData, setDashboardData] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      const loadSection = async (method, setter) => {
        try {
          const res = await method();
          setter(res);
        } catch (err) {
          console.error(err);
        }
      };

      loadSection(mobilityService.getHourSummary, setHourData);
      loadSection(mobilityService.getComunaSummary, setComunaData);
      loadSection(mobilityService.getCriticalCorridors, setCorridors);
      loadSection(mobilityService.getDashboardSummary, setDashboardData);
    };

    fetchData();
  }, []);

  const handleLogout = () => {
    navigate('/');
  };

  const META = {
    analisis: { accent: 'Análisis', title: 'Estratégico', subtitle: 'Visión de alto nivel y detección de anomalías' },
    inicio: { accent: 'Geovisor de', title: 'Movilidad', subtitle: 'Exploración de tráfico en tiempo real' },
    noticias: { accent: '', title: 'Noticias', subtitle: 'Actualidad de Medellín y Antioquia' },
  };

  const m = META[mod];

  const peakHourItem = [...hourData].sort((a, b) => b.criticidad - a.criticidad)[0];
  const peakHour = peakHourItem ? peakHourItem.hora : null;

  const inicioLeft = (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', gap: '20px' }}>
      {/* SOLO MAPA */}
      <div className="db-card" style={{ padding: '15px', flex: 1, display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
          <div>
            <h2 style={{ fontSize: 16, fontWeight: 700, margin: 0 }}>
              Geovisor de Tráfico 3D
            </h2>
            <div style={{ fontSize: 11, color: 'var(--text-dim)' }}>
              Monitoreo de corredores y velocidad
            </div>
          </div>
        </div>

        <div style={{ flex: 1 }}>
          <MobilityMap
            data={comunaData}
            corridors={corridors}
            filterType={filterType}
            peakHour={peakHour}
          />
        </div>
      </div>
    </div>
  );

  const analisisLeft = (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', gap: '20px' }}>
      <MobilityDashboard data={dashboardData} />
    </div>
  );

  const noticiasLeft = (
    <div className="db-card" style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', padding: 0 }}>
      <div style={{ padding: '18px' }}>
        <div className="db-card-title">Noticias</div>
      </div>
      <div style={{ flex: 1, overflowY: 'auto', padding: '0 18px' }}>
        {topNoticias?.map?.((art, i) => (
          <a key={i} href={art.url} target="_blank" rel="noreferrer" className="db-news-item">
            <div className="db-news-title">{art.title}</div>
          </a>
        ))}
      </div>
    </div>
  );

  return (
    <DashboardLayout
      user={user}
      navItems={NAV}
      activeItem={mod}
      onSelect={setMod}
      onLogout={handleLogout}
      pageTitleAccent={m.accent}
      pageTitle={m.title}
      pageSubtitle={m.subtitle}
      breadcrumb={`Ciudadano / ${m.title}`}
      colL={mod === 'inicio' ? inicioLeft : (mod === 'analisis' ? analisisLeft : noticiasLeft)}
      colR={null}
    />
  );
}