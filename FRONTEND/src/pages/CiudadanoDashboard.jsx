import { useEffect, useState } from 'react';
import authService from '@/services/authService';
import mobilityService from '@/services/mobilityService';

import DashboardLayout, { Icons } from '@/components/dashboard/DashboardLayout';
import MobilityMap from '@/components/MobilityMap';
import MobilityDashboard from '@/components/MobilityDashboard';
import ChatWidget from '@/components/ChatWidget';

const NAV = [
  { id: 'analisis', label: 'Análisis Estratégico', icon: <Icons.Chart /> },
  { id: 'inicio', label: 'Geovisor 3D', icon: <Icons.Dashboard /> },
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
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState('');
  const [mod, setMod] = useState('analisis');

  const [comunaData, setComunaData] = useState([]);
  const [corridors, setCorridors] = useState([]);
  const [recs, setRecs] = useState([]);
  const [hourData, setHourData] = useState([]);
  const [filterType, setFilterType] = useState('all');
  const [dashboardData, setDashboardData] = useState(null);
  const [dashboardLoading, setDashboardLoading] = useState(true);
  const [dashboardError, setDashboardError] = useState('');
  const [inicioLoaded, setInicioLoaded] = useState(false);

  const guestUser = { full_name: 'Invitado GEOMED' };

  useEffect(() => {
    // El dashboard es público: si no hay token, seguimos como invitado.
    if (!authService.isAuthenticated()) {
      setUser(guestUser);
      setAuthError('');
      setLoading(false);
      return;
    }

    authService.getMe()
      .then((u) => {
        setUser(u);
        setAuthError('');
      })
      .catch(() => {
        // Si falla auth en entorno Docker o sesión vencida, no bloqueamos dashboard público.
        setUser(guestUser);
        setAuthError('');
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!user) return;

    let cancelled = false;
    const fetchDashboard = async () => {
      setDashboardLoading(true);
      setDashboardError('');
      try {
        const res = await mobilityService.getDashboardSummary();
        if (!cancelled) setDashboardData(res);
      } catch (err) {
        console.error(err);
        if (!cancelled) setDashboardError('No fue posible cargar el análisis estratégico. Intenta recargar.');
      } finally {
        if (!cancelled) setDashboardLoading(false);
      }
    };

    fetchDashboard();
    return () => {
      cancelled = true;
    };
  }, [user]);

  useEffect(() => {
    if (!user || mod !== 'inicio' || inicioLoaded) return;

    let cancelled = false;
    const fetchInicioData = async () => {
      const loadSection = async (method, setter) => {
        try {
          const res = await method();
          if (!cancelled) setter(res);
        } catch (err) {
          console.error(err);
        }
      };

      await Promise.all([
        loadSection(mobilityService.getHourSummary, setHourData),
        loadSection(mobilityService.getComunaSummary, setComunaData),
        loadSection(mobilityService.getCriticalCorridors, setCorridors),
        loadSection(mobilityService.getRecommendations, setRecs),
      ]);

      if (!cancelled) setInicioLoaded(true);
    };

    fetchInicioData();
    return () => {
      cancelled = true;
    };
  }, [mod, inicioLoaded, user]);

  const handleLogout = () => {
    navigate('/');
  };

  if (loading) return <div className="db-loading"><div className="db-spinner" />Analizando movilidad...</div>;
  if (authError) return <div className="db-loading">{authError}</div>;
  if (!user) return null;

  const firstName = user.full_name?.split(' ')[0] || 'Usuario';
  const META = {
    analisis: { accent: 'Análisis', title: 'Estratégico', subtitle: 'Visión de alto nivel y detección de anomalías' },
    inicio: { accent: 'Geovisor de', title: 'Movilidad', subtitle: 'Exploración de tráfico en tiempo real' },
  };

  const m = META[mod];

  const peakHourItem = [...hourData].sort((a, b) => b.criticidad - a.criticidad)[0];
  const peakHour = peakHourItem ? peakHourItem.hora : null;

  const inicioLeft = (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', gap: '20px' }}>
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
      {dashboardLoading ? (
        <div className="db-card" style={{ padding: '24px', minHeight: '220px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ opacity: 0.8 }}>Cargando análisis estratégico...</div>
        </div>
      ) : dashboardError ? (
        <div className="db-card" style={{ padding: '24px', minHeight: '220px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#f43f5e' }}>
          {dashboardError}
        </div>
      ) : (
        <MobilityDashboard data={dashboardData} />
      )}
    </div>
  );



  return (
    <>
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
        colL={mod === 'inicio' ? inicioLeft : analisisLeft}
        colR={null}
      />
      {/* GeoBot — chatbot flotante, se adapta a la sección activa */}
      <ChatWidget activeSection={mod} />
    </>
  );
}