import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import authService from '@/services/authService';
import newsService from '@/services/newsService';
import mobilityService from '@/services/mobilityService';

import DashboardLayout, { Icons } from '@/components/dashboard/DashboardLayout';
import MobilityMap from '@/components/MobilityMap';

const NAV = [
  { id: 'inicio',    label: 'Movilidad', icon: <Icons.Dashboard /> },
  { id: 'noticias',  label: 'Noticias',  icon: <Icons.News /> },
];

const CAT_OPTIONS = [
  { value:'general',        label:'General' },
  { value:'seguridad',      label:'Seguridad' },
  { value:'emprendimiento', label:'Emprendimiento' },
  { value:'movilidad',      label:'Movilidad' },
  { value:'salud',          label:'Salud' },
  { value:'economia',       label:'Economía' },
];

export default function CiudadanoDashboard() {
  const navigate = useNavigate();
  const [user, setUser]       = useState(null);
  const [loading, setLoading] = useState(true);
  const [mod, setMod]         = useState('inicio');

  const [comunaData, setComunaData] = useState([]);
  const [corridors, setCorridors]   = useState([]);
  const [recs, setRecs]             = useState([]);
  const [topNoticias, setTopNoticias] = useState([]);
  const [hourData, setHourData] = useState([]);
  const [filterType, setFilterType] = useState('all');

  useEffect(() => {
    authService.getMe()
      .then(setUser)
      .catch(() => navigate('/login'))
      .finally(() => setLoading(false));
  }, [navigate]);

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
      loadSection(mobilityService.getRecommendations, setRecs);
      loadSection(() => newsService.getMedellinNews(6, 'movilidad'), setTopNoticias);
    };

    fetchData();
  }, []);

  const handleLogout = () => {
    authService.logout();
    navigate('/login');
  };

  if (loading) return <div className="db-loading"><div className="db-spinner"/>Analizando movilidad...</div>;
  if (!user) return null;

  const firstName = user.full_name?.split(' ')[0] || 'Usuario';

  const META = {
    inicio:    { accent:'Bienvenido,', title:firstName, subtitle:'' },
    noticias:  { accent:'', title:'Noticias', subtitle:'Actualidad de Medellín y Antioquia' },
  };

  const m = META[mod];

  const peakHourItem = [...hourData].sort((a,b) => b.criticidad - a.criticidad)[0];
  const peakHour = peakHourItem ? peakHourItem.hora : null;

  const inicioLeft = (
    <div style={{display:'flex', flexDirection:'column', height:'100%'}}>

      {/* SOLO MAPA */}
      <div className="db-card" style={{ padding: '15px', flex:1, display:'flex', flexDirection:'column' }}>
        
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:10 }}>
          <div>
            <h2 style={{ fontSize:16, fontWeight:700, margin:0 }}>
              Análisis de Criticidad Vial 3D
            </h2>
            <div style={{ fontSize:11, color:'var(--text-dim)' }}>
              Visualización en tiempo real
            </div>
          </div>

          {/* Filtros */}
          <div style={{ display:'flex', gap:8 }}>
            <button onClick={()=>setFilterType('all')}>TODOS</button>
            <button onClick={()=>setFilterType('corridors')}>PEOR</button>
            <button onClick={()=>setFilterType('hour')}>HORA</button>
          </div>
        </div>

        <div style={{ flex:1 }}>
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

  const noticiasLeft = (
    <div className="db-card" style={{flex:1,display:'flex',flexDirection:'column',overflow:'hidden',padding:0}}>
      <div style={{padding:'18px'}}>
        <div className="db-card-title">Noticias</div>
      </div>
      <div style={{flex:1,overflowY:'auto',padding:'0 18px'}}>
        {topNoticias.map((art,i)=>(
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
      colL={mod === 'inicio' ? inicioLeft : noticiasLeft}
      colR={null}
    />
  );
}