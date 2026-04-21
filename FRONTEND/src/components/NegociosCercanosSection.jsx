import { useEffect, useMemo, useState } from "react";
import { datasetsService } from "../services/datasetsService";

const cardStyle = {
  border: "1px solid #e5e7eb",
  borderRadius: "12px",
  padding: "0.85rem",
  background: "#f8fafc",
};

const barContainerStyle = {
  width: "100%",
  height: "24px",
  borderRadius: "999px",
  overflow: "hidden",
  background: "#e2e8f0",
};

function HorizontalBars({ items, labelKey, valueKey, color }) {
  const maxValue = Math.max(...items.map((item) => Number(item?.[valueKey] || 0)), 1);

  if (!items.length) {
    return <p style={{ color: "#64748b" }}>Sin datos para el filtro seleccionado.</p>;
  }

  return (
    <div style={{ display: "grid", gap: "0.6rem" }}>
      {items.map((item) => {
        const value = Number(item?.[valueKey] || 0);
        const width = `${Math.max((value / maxValue) * 100, 2)}%`;

        return (
          <div key={`${item.comuna || ""}-${item[labelKey] || ""}`}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.2rem", fontSize: "0.92rem" }}>
              <span>{item[labelKey]}</span>
              <strong>{value}</strong>
            </div>
            <div style={barContainerStyle}>
              <div
                style={{
                  width,
                  height: "100%",
                  background: color,
                }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default function NegociosCercanosSection() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [filters, setFilters] = useState({
    comuna: "",
    categoria: "",
    fecha_recoleccion: "",
  });

  const [available, setAvailable] = useState({
    comunas: [],
    categorias: [],
    fechas_recoleccion: [],
  });

  const [summary, setSummary] = useState(null);
  const [rows, setRows] = useState([]);
  const [topBarrios, setTopBarrios] = useState([]);
  const [topTipos, setTopTipos] = useState([]);

  const query = useMemo(
    () => ({
      comuna: filters.comuna || null,
      categoria: filters.categoria || null,
      fecha_recoleccion: filters.fecha_recoleccion || null,
    }),
    [filters]
  );

  useEffect(() => {
    let mounted = true;

    const loadInitial = async () => {
      setLoading(true);
      setError("");
      try {
        const filtersResp = await datasetsService.getNegociosMedellinFilters();
        if (!mounted) return;

        const data = filtersResp?.data || {};
        setAvailable({
          comunas: data.comunas || [],
          categorias: data.categorias || [],
          fechas_recoleccion: data.fechas_recoleccion || [],
        });

        const defaultFecha = data.fechas_recoleccion?.[0] || "";
        setFilters((prev) => ({
          ...prev,
          fecha_recoleccion: prev.fecha_recoleccion || defaultFecha,
        }));
      } catch (err) {
        if (mounted) {
          setError(err.message || "No se pudieron cargar los filtros del dataset.");
        }
      } finally {
        if (mounted) setLoading(false);
      }
    };

    loadInitial();
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (loading) return;

    let mounted = true;

    const loadData = async () => {
      setError("");
      try {
        const [summaryResp, dataResp, barriosResp, tiposResp] = await Promise.all([
          datasetsService.getNegociosMedellinSummary(query),
          datasetsService.getNegociosMedellinData({ ...query, limit: 12 }),
          datasetsService.getNegociosMedellinTopBarrios({ ...query, limit: 6 }),
          datasetsService.getNegociosMedellinTopTipos({ ...query, limit: 6 }),
        ]);

        if (!mounted) return;

        setSummary(summaryResp?.data || null);
        setRows(dataResp?.data?.data || []);
        setTopBarrios(barriosResp?.data || []);
        setTopTipos(tiposResp?.data || []);
      } catch (err) {
        if (mounted) {
          setError(err.message || "No se pudieron cargar los datos de negocios.");
        }
      }
    };

    loadData();
    return () => {
      mounted = false;
    };
  }, [loading, query]);

  if (loading) {
    return <p>Cargando dataset de negocios cercanos...</p>;
  }

  return (
    <div>
      <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap", marginBottom: "1rem" }}>
        <label>
          Comuna
          <select
            style={{ marginLeft: "0.5rem" }}
            value={filters.comuna}
            onChange={(e) => setFilters((prev) => ({ ...prev, comuna: e.target.value }))}
          >
            <option value="">Todas</option>
            {available.comunas.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </label>

        <label>
          Categoria
          <select
            style={{ marginLeft: "0.5rem" }}
            value={filters.categoria}
            onChange={(e) => setFilters((prev) => ({ ...prev, categoria: e.target.value }))}
          >
            <option value="">Todas</option>
            {available.categorias.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </label>

        <label>
          Fecha
          <select
            style={{ marginLeft: "0.5rem" }}
            value={filters.fecha_recoleccion}
            onChange={(e) => setFilters((prev) => ({ ...prev, fecha_recoleccion: e.target.value }))}
          >
            <option value="">Todas</option>
            {available.fechas_recoleccion.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </label>
      </div>

      {error && (
        <p style={{ color: "#b91c1c", marginBottom: "0.75rem" }}>
          Error: {error}
        </p>
      )}

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
          gap: "0.75rem",
          marginBottom: "1rem",
        }}
      >
        <div style={cardStyle}>
          <strong>Registros</strong>
          <div>{summary?.total_registros ?? 0}</div>
        </div>
        <div style={cardStyle}>
          <strong>Cantidad total</strong>
          <div>{summary?.total_cantidad ?? 0}</div>
        </div>
        <div style={cardStyle}>
          <strong>Barrios unicos</strong>
          <div>{summary?.barrios_unicos ?? 0}</div>
        </div>
        <div style={cardStyle}>
          <strong>Tipos de negocio</strong>
          <div>{summary?.tipos_unicos ?? 0}</div>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginBottom: "1rem" }}>
        <div style={{ border: "1px solid #ddd", borderRadius: "10px", padding: "0.75rem" }}>
          <h3 style={{ marginTop: 0 }}>Top barrios</h3>
          <HorizontalBars
            items={topBarrios.map((item) => ({
              ...item,
              etiqueta: `C${item.comuna} - ${item.barrio}`,
            }))}
            labelKey="etiqueta"
            valueKey="total_cantidad"
            color="linear-gradient(90deg, #0ea5e9, #2563eb)"
          />
          <ul style={{ margin: 0, paddingLeft: "1rem" }}>
            {topBarrios.map((item) => (
              <li key={`${item.comuna}-${item.barrio}`}>
                Comuna {item.comuna} - {item.barrio}: {item.total_cantidad}
              </li>
            ))}
          </ul>
        </div>

        <div style={{ border: "1px solid #ddd", borderRadius: "10px", padding: "0.75rem" }}>
          <h3 style={{ marginTop: 0 }}>Top tipos de negocio</h3>
          <HorizontalBars
            items={topTipos.map((item) => ({
              ...item,
              etiqueta: item.tipo_negocio,
            }))}
            labelKey="etiqueta"
            valueKey="total_cantidad"
            color="linear-gradient(90deg, #22c55e, #0f766e)"
          />
          <ul style={{ margin: 0, paddingLeft: "1rem" }}>
            {topTipos.map((item) => (
              <li key={item.tipo_negocio}>
                {item.tipo_negocio} ({item.categoria}): {item.total_cantidad}
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr>
              <th style={{ textAlign: "left", borderBottom: "1px solid #ddd", padding: "0.4rem" }}>Comuna</th>
              <th style={{ textAlign: "left", borderBottom: "1px solid #ddd", padding: "0.4rem" }}>Barrio</th>
              <th style={{ textAlign: "left", borderBottom: "1px solid #ddd", padding: "0.4rem" }}>Tipo negocio</th>
              <th style={{ textAlign: "left", borderBottom: "1px solid #ddd", padding: "0.4rem" }}>Categoria</th>
              <th style={{ textAlign: "right", borderBottom: "1px solid #ddd", padding: "0.4rem" }}>Cantidad</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id}>
                <td style={{ padding: "0.4rem", borderBottom: "1px solid #eee" }}>{row.comuna}</td>
                <td style={{ padding: "0.4rem", borderBottom: "1px solid #eee" }}>{row.barrio}</td>
                <td style={{ padding: "0.4rem", borderBottom: "1px solid #eee" }}>{row.tipo_negocio}</td>
                <td style={{ padding: "0.4rem", borderBottom: "1px solid #eee" }}>{row.categoria}</td>
                <td style={{ padding: "0.4rem", borderBottom: "1px solid #eee", textAlign: "right" }}>
                  {row.cantidad_actual}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
