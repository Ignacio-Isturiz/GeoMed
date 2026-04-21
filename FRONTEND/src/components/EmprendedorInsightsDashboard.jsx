import { useEffect, useMemo, useState } from "react";
import { datasetsService } from "@/services/datasetsService";

function formatNumber(value) {
  return Number(value || 0).toLocaleString("es-CO");
}

export default function EmprendedorInsightsDashboard() {
  const [years, setYears] = useState([]);
  const [selectedYear, setSelectedYear] = useState("");
  const [limit, setLimit] = useState(5);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [overview, setOverview] = useState(null);
  const [empresarialSummary, setEmpresarialSummary] = useState(null);
  const [topActividades, setTopActividades] = useState([]);
  const [topComunas, setTopComunas] = useState([]);
  const [criminalidadData, setCriminalidadData] = useState([]);

  useEffect(() => {
    const loadYears = async () => {
      try {
        const response = await datasetsService.getEmpresarialYears();
        const availableYears = response?.data || [];
        setYears(availableYears);
      } catch (err) {
        console.error("Error cargando años:", err);
      }
    };

    loadYears();
  }, []);

  useEffect(() => {
    const loadDashboard = async () => {
      try {
        setLoading(true);
        setError(null);

        const yearParam = selectedYear === "" ? null : Number(selectedYear);

        const [
          overviewResponse,
          summaryResponse,
          actividadesResponse,
          comunasResponse,
          criminalidadResponse,
        ] =
          await Promise.all([
            datasetsService.getEmprendedorOverview(yearParam, limit),
            datasetsService.getEmpresarialSummary(yearParam),
            datasetsService.getEmpresarialTopActividades(yearParam, limit),
            datasetsService.getEmpresarialTopComunas(yearParam, limit),
            datasetsService.getCriminalidadData(),
          ]);

        setOverview(overviewResponse?.data || null);
        setEmpresarialSummary(summaryResponse?.data || null);
        setTopActividades(actividadesResponse?.data || []);
        setTopComunas(comunasResponse?.data || []);
        setCriminalidadData(criminalidadResponse?.data || []);
      } catch (err) {
        setError(err.message || "No se pudo cargar el dashboard emprendedor");
      } finally {
        setLoading(false);
      }
    };

    loadDashboard();
  }, [selectedYear, limit]);

  const maxComunaValue = useMemo(() => {
    return topComunas.length > 0
      ? Math.max(...topComunas.map((item) => item.total_empresas || 0))
      : 1;
  }, [topComunas]);

  const maxActividadValue = useMemo(() => {
    return topActividades.length > 0
      ? Math.max(...topActividades.map((item) => item.total_empresas || 0))
      : 1;
  }, [topActividades]);

  const topCrimen = useMemo(() => {
    return [...criminalidadData]
      .sort((a, b) => (b.tasa_criminalidad || 0) - (a.tasa_criminalidad || 0))
      .slice(0, limit);
  }, [criminalidadData, limit]);

  if (loading) {
    return (
      <div className="mt-8 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <p className="text-slate-600">Cargando dashboard empresarial...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mt-8 rounded-xl border border-red-200 bg-red-50 p-6">
        <p className="font-semibold text-red-700">Error al cargar insights</p>
        <p className="text-red-600">{error}</p>
      </div>
    );
  }

  return (
    <section className="mt-8 space-y-6">
      <div className="rounded-2xl border border-slate-200 bg-gradient-to-r from-white to-slate-50 p-6 shadow-sm">
        <div className="mb-5 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <h2 className="text-3xl font-bold text-slate-900">Inteligencia Empresarial</h2>
            <p className="text-slate-600">
              Cruce de estructura empresarial y contexto de criminalidad para decisiones de zona.
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <label className="flex flex-col text-sm text-slate-700">
              Año
              <select
                className="mt-1 rounded-lg border border-slate-300 bg-white px-3 py-2"
                value={selectedYear}
                onChange={(e) => setSelectedYear(e.target.value)}
              >
                <option value="">Todos</option>
                {years.map((year) => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
              </select>
            </label>

            <label className="flex flex-col text-sm text-slate-700">
              Top a mostrar: {limit}
              <input
                className="mt-2 w-44"
                type="range"
                min="3"
                max="10"
                value={limit}
                onChange={(e) => setLimit(Number(e.target.value))}
              />
            </label>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-xl border border-blue-200 bg-blue-50 p-4">
            <p className="text-sm font-semibold text-blue-700">Total Actividades</p>
            <p className="text-3xl font-bold text-blue-900">
              {formatNumber(empresarialSummary?.total_actividades)}
            </p>
          </div>

          <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4">
            <p className="text-sm font-semibold text-emerald-700">Total Empresas</p>
            <p className="text-3xl font-bold text-emerald-900">
              {formatNumber(empresarialSummary?.total_empresas)}
            </p>
          </div>

          <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
            <p className="text-sm font-semibold text-amber-700">Comuna Top Empresas</p>
            <p className="text-xl font-bold text-amber-900">
              {empresarialSummary?.comuna_top?.nombre || "N/A"}
            </p>
          </div>

          <div className="rounded-xl border border-rose-200 bg-rose-50 p-4">
            <p className="text-sm font-semibold text-rose-700">Comuna Más Afectada (Crimen)</p>
            <p className="text-xl font-bold text-rose-900">
              {overview?.criminalidad?.comuna_mas_afectada || "N/A"}
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="mb-4 text-lg font-bold text-slate-900">Top Actividades Económicas</h3>
          <div className="space-y-3">
            {topActividades.map((item) => {
              const width = Math.max(
                8,
                Math.round(((item.total_empresas || 0) / maxActividadValue) * 100)
              );

              return (
                <div key={`${item.ciiu}-${item.descripcion}`}>
                  <div className="mb-1 flex items-center justify-between text-sm">
                    <p className="truncate font-medium text-slate-700">{item.descripcion}</p>
                    <span className="ml-3 font-semibold text-slate-900">
                      {formatNumber(item.total_empresas)}
                    </span>
                  </div>
                  <div className="h-2 rounded-full bg-slate-100">
                    <div
                      className="h-2 rounded-full bg-indigo-500"
                      style={{ width: `${width}%` }}
                    />
                  </div>
                  <p className="mt-1 text-xs text-slate-500">
                    CIIU {item.ciiu} - Mayor concentración: {item.top_comuna}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="mb-4 text-lg font-bold text-slate-900">Top Comunas por Empresas</h3>
          <div className="space-y-3">
            {topComunas.map((item) => {
              const width = Math.max(
                8,
                Math.round(((item.total_empresas || 0) / maxComunaValue) * 100)
              );

              return (
                <div key={item.comuna}>
                  <div className="mb-1 flex items-center justify-between text-sm">
                    <p className="font-medium text-slate-700">{item.comuna}</p>
                    <span className="ml-3 font-semibold text-slate-900">
                      {formatNumber(item.total_empresas)}
                    </span>
                  </div>
                  <div className="h-2 rounded-full bg-slate-100">
                    <div
                      className="h-2 rounded-full bg-emerald-500"
                      style={{ width: `${width}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-bold text-slate-900">Dataset de Criminalidad por Comuna</h3>
          <span className="rounded-full bg-slate-100 px-3 py-1 text-sm text-slate-700">
            Registros: {formatNumber(criminalidadData.length)}
          </span>
        </div>

        <div className="mb-5 grid grid-cols-1 gap-4 md:grid-cols-3">
          <div className="rounded-xl border border-rose-200 bg-rose-50 p-4">
            <p className="text-sm font-semibold text-rose-700">Total Casos</p>
            <p className="text-2xl font-bold text-rose-900">
              {formatNumber(overview?.criminalidad?.total_casos)}
            </p>
          </div>

          <div className="rounded-xl border border-orange-200 bg-orange-50 p-4">
            <p className="text-sm font-semibold text-orange-700">Tasa Promedio</p>
            <p className="text-2xl font-bold text-orange-900">
              {Number(overview?.criminalidad?.tasa_promedio || 0).toLocaleString("es-CO")}
            </p>
          </div>

          <div className="rounded-xl border border-indigo-200 bg-indigo-50 p-4">
            <p className="text-sm font-semibold text-indigo-700">Comuna Más Afectada</p>
            <p className="text-xl font-bold text-indigo-900">
              {overview?.criminalidad?.comuna_mas_afectada || "N/A"}
            </p>
          </div>
        </div>

        <div className="overflow-x-auto rounded-xl border border-slate-200">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-700">
              <tr>
                <th className="px-4 py-3 font-semibold">Comuna</th>
                <th className="px-4 py-3 font-semibold">Casos</th>
                <th className="px-4 py-3 font-semibold">Tasa</th>
              </tr>
            </thead>
            <tbody>
              {topCrimen.map((item) => (
                <tr key={item.nombre} className="border-t border-slate-100">
                  <td className="px-4 py-3 font-medium text-slate-800">{item.nombre}</td>
                  <td className="px-4 py-3 text-slate-700">{formatNumber(item.total_casos)}</td>
                  <td className="px-4 py-3 text-slate-700">
                    {Number(item.tasa_criminalidad || 0).toLocaleString("es-CO")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
