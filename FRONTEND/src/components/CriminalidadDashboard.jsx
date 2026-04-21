import { useState, useEffect } from "react";
import { datasetsService } from "../services/datasetsService";

/**
 * Componente de Dashboard de Criminalidad
 * Muestra estadísticas y tabla de datos de criminalidad por comuna
 */
export default function CriminalidadDashboard() {
  const [data, setData] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sortConfig, setSortConfig] = useState({
    key: "tasa_criminalidad",
    direction: "desc"
  });

  // Cargar datos al montar el componente
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Cargar datos y resumen en paralelo
      const [dataResponse, summaryResponse] = await Promise.all([
        datasetsService.getCriminalidadData(),
        datasetsService.getCriminalidadSummary()
      ]);

      if (dataResponse.success) {
        setData(dataResponse.data);
      }

      if (summaryResponse.success) {
        setSummary(summaryResponse.data);
      }
    } catch (err) {
      setError(
        err.message || "Error al cargar los datos de criminalidad"
      );
      console.error("Error en CriminalidadDashboard:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSort = (key) => {
    let direction = "asc";
    if (sortConfig.key === key && sortConfig.direction === "asc") {
      direction = "desc";
    }
    setSortConfig({ key, direction });
  };

  const sortedData = [...data].sort((a, b) => {
    const key = sortConfig.key;
    const aValue = a[key];
    const bValue = b[key];

    if (typeof aValue === "string") {
      return sortConfig.direction === "asc"
        ? aValue.localeCompare(bValue)
        : bValue.localeCompare(aValue);
    }

    return sortConfig.direction === "asc"
      ? aValue - bValue
      : bValue - aValue;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-xl text-gray-600">Cargando datos de criminalidad...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 p-4 rounded-lg">
        <h3 className="font-semibold text-red-800 mb-2">Error</h3>
        <p className="text-red-700">{error}</p>
        <button
          onClick={loadData}
          className="mt-4 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
        >
          Intentar de nuevo
        </button>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Encabezado */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-2">
          Dashboard de Criminalidad
        </h1>
        <p className="text-gray-600">
          Análisis de tasas de criminalidad por comuna
        </p>
      </div>

      {/* Tarjetas de resumen */}
      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          {/* Total de comunas */}
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
            <p className="text-blue-600 text-sm font-semibold mb-1">Total de Comunas</p>
            <p className="text-3xl font-bold text-blue-900">{summary.total_comunas}</p>
          </div>

          {/* Total de casos */}
          <div className="bg-red-50 p-4 rounded-lg border border-red-200">
            <p className="text-red-600 text-sm font-semibold mb-1">Total de Casos</p>
            <p className="text-3xl font-bold text-red-900">{summary.total_casos.toLocaleString()}</p>
          </div>

          {/* Tasa promedio */}
          <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
            <p className="text-yellow-600 text-sm font-semibold mb-1">Tasa Promedio</p>
            <p className="text-3xl font-bold text-yellow-900">
              {summary.tasa_promedio.toLocaleString('es-CO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
          </div>

          {/* Tasa máxima */}
          <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
            <p className="text-orange-600 text-sm font-semibold mb-1">Tasa Máxima</p>
            <p className="text-3xl font-bold text-orange-900">
              {summary.tasa_maxima.toLocaleString('es-CO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
          </div>

          {/* Tasa mínima */}
          <div className="bg-green-50 p-4 rounded-lg border border-green-200">
            <p className="text-green-600 text-sm font-semibold mb-1">Tasa Mínima</p>
            <p className="text-3xl font-bold text-green-900">
              {summary.tasa_minima.toLocaleString('es-CO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
          </div>
        </div>
      )}

      {/* Comuna más afectada */}
      {summary && summary.comuna_mas_afectada && (
        <div className="bg-gradient-to-r from-red-600 to-red-700 text-white p-6 rounded-lg">
          <p className="text-sm font-semibold mb-2">Comuna con Mayor Criminalidad</p>
          <p className="text-3xl font-bold">{summary.comuna_mas_afectada}</p>
        </div>
      )}

      {/* Tabla de datos */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-100 border-b border-gray-300">
              <tr>
                <th
                  className="px-6 py-4 text-left text-sm font-semibold text-gray-700 cursor-pointer hover:bg-gray-200"
                  onClick={() => handleSort("nombre")}
                >
                  Comuna {sortConfig.key === "nombre" && (sortConfig.direction === "asc" ? "↑" : "↓")}
                </th>
                <th
                  className="px-6 py-4 text-right text-sm font-semibold text-gray-700 cursor-pointer hover:bg-gray-200"
                  onClick={() => handleSort("total_casos")}
                >
                  Casos {sortConfig.key === "total_casos" && (sortConfig.direction === "asc" ? "↑" : "↓")}
                </th>
                <th
                  className="px-6 py-4 text-right text-sm font-semibold text-gray-700 cursor-pointer hover:bg-gray-200"
                  onClick={() => handleSort("tasa_criminalidad")}
                >
                  Tasa de Criminalidad {sortConfig.key === "tasa_criminalidad" && (sortConfig.direction === "asc" ? "↑" : "↓")}
                </th>
              </tr>
            </thead>
            <tbody>
              {sortedData.map((item, index) => (
                <tr
                  key={index}
                  className={index % 2 === 0 ? "bg-white" : "bg-gray-50"}
                >
                  <td className="px-6 py-4 text-sm text-gray-900 font-medium">
                    {item.nombre}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-700 text-right">
                    {item.total_casos.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 text-sm text-right">
                    <span
                      className={`inline-block px-3 py-1 rounded-full text-white font-semibold ${
                        item.tasa_criminalidad > summary.tasa_promedio
                          ? "bg-red-500"
                          : "bg-green-500"
                      }`}
                    >
                      {item.tasa_criminalidad.toLocaleString('es-CO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Información adicional */}
      <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
        <p className="text-sm text-gray-600">
          <span className="font-semibold">Nota:</span> Los datos de criminalidad están ordenados por tasa en orden descendente.
          Las tasas superiores al promedio aparecen en rojo para fácil identificación de áreas problemáticas.
        </p>
      </div>
    </div>
  );
}
