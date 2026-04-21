import { API_CONFIG } from "../config/api";

/**
 * Servicio para consumir endpoints de datasets
 */
export const datasetsService = {
  /**
   * Obtiene todos los datos de criminalidad
   * @returns {Promise<Object>} Datos de criminalidad
   */
  async getCriminalidadData() {
    try {
      const response = await fetch(`${API_CONFIG.baseURL}/api/datasets/criminalidad`);
      
      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error("Error al obtener datos de criminalidad:", error);
      throw error;
    }
  },

  /**
   * Obtiene resumen estadístico de criminalidad
   * @returns {Promise<Object>} Resumen con estadísticas
   */
  async getCriminalidadSummary() {
    try {
      const response = await fetch(`${API_CONFIG.baseURL}/api/datasets/criminalidad/resumen`);
      
      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error("Error al obtener resumen de criminalidad:", error);
      throw error;
    }
  },

  async getEmpresarialYears() {
    try {
      const response = await fetch(`${API_CONFIG.baseURL}/api/datasets/empresarial/years`);

      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error("Error al obtener años empresariales:", error);
      throw error;
    }
  },

  async getEmpresarialSummary(year = null) {
    try {
      const params = new URLSearchParams();
      if (year !== null && year !== undefined && year !== "") {
        params.set("year", String(year));
      }

      const query = params.toString();
      const response = await fetch(
        `${API_CONFIG.baseURL}/api/datasets/empresarial/resumen${query ? `?${query}` : ""}`
      );

      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error("Error al obtener resumen empresarial:", error);
      throw error;
    }
  },

  async getEmpresarialTopActividades(year = null, limit = 5) {
    try {
      const params = new URLSearchParams();
      if (year !== null && year !== undefined && year !== "") {
        params.set("year", String(year));
      }
      params.set("limit", String(limit));

      const response = await fetch(
        `${API_CONFIG.baseURL}/api/datasets/empresarial/top-actividades?${params.toString()}`
      );

      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error("Error al obtener top actividades:", error);
      throw error;
    }
  },

  async getEmpresarialTopComunas(year = null, limit = 5) {
    try {
      const params = new URLSearchParams();
      if (year !== null && year !== undefined && year !== "") {
        params.set("year", String(year));
      }
      params.set("limit", String(limit));

      const response = await fetch(
        `${API_CONFIG.baseURL}/api/datasets/empresarial/top-comunas?${params.toString()}`
      );

      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error("Error al obtener top comunas:", error);
      throw error;
    }
  },

  async getEmprendedorOverview(year = null, limit = 5) {
    try {
      const params = new URLSearchParams();
      if (year !== null && year !== undefined && year !== "") {
        params.set("year", String(year));
      }
      params.set("limit", String(limit));

      const response = await fetch(
        `${API_CONFIG.baseURL}/api/datasets/emprendedor/overview?${params.toString()}`
      );

      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error("Error al obtener overview de emprendedor:", error);
      throw error;
    }
  },

  async getEstratificacionData({ servicio = null, estrato = null, periodo = null, limit = 200 } = {}) {
    try {
      const params = new URLSearchParams();
      if (servicio) params.set("servicio", String(servicio));
      if (estrato !== null && estrato !== undefined && estrato !== "") params.set("estrato", String(estrato));
      if (periodo) params.set("periodo", String(periodo));
      params.set("limit", String(limit));

      const response = await fetch(
        `${API_CONFIG.baseURL}/api/datasets/estratificacion-cobertura?${params.toString()}`
      );

      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error("Error al obtener dataset de estratificacion:", error);
      throw error;
    }
  },

  async getEstratificacionSummary(periodo = null) {
    try {
      const params = new URLSearchParams();
      if (periodo) params.set("periodo", String(periodo));

      const response = await fetch(
        `${API_CONFIG.baseURL}/api/datasets/estratificacion-cobertura/resumen${
          params.toString() ? `?${params.toString()}` : ""
        }`
      );

      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error("Error al obtener resumen de estratificacion:", error);
      throw error;
    }
  },

  async getEstratificacionPorServicio(periodo = null) {
    try {
      const params = new URLSearchParams();
      if (periodo) params.set("periodo", String(periodo));

      const response = await fetch(
        `${API_CONFIG.baseURL}/api/datasets/estratificacion-cobertura/por-servicio${
          params.toString() ? `?${params.toString()}` : ""
        }`
      );

      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error("Error al obtener agregacion por servicio:", error);
      throw error;
    }
  },

  async getEstratificacionPorEstrato(periodo = null) {
    try {
      const params = new URLSearchParams();
      if (periodo) params.set("periodo", String(periodo));

      const response = await fetch(
        `${API_CONFIG.baseURL}/api/datasets/estratificacion-cobertura/por-estrato${
          params.toString() ? `?${params.toString()}` : ""
        }`
      );

      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error("Error al obtener agregacion por estrato:", error);
      throw error;
    }
  },

  async getEstratificacionTopCobertura(periodo = null, limit = 5) {
    try {
      const params = new URLSearchParams();
      if (periodo) params.set("periodo", String(periodo));
      params.set("limit", String(limit));

      const response = await fetch(
        `${API_CONFIG.baseURL}/api/datasets/estratificacion-cobertura/top-cobertura?${params.toString()}`
      );

      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error("Error al obtener top de cobertura:", error);
      throw error;
    }
  },

  async getTarifasData(dataset, { year = null, mes = null, limit = 300 } = {}) {
    try {
      const params = new URLSearchParams();
      if (year !== null && year !== undefined && year !== "") params.set("year", String(year));
      if (mes) params.set("mes", String(mes));
      params.set("limit", String(limit));

      const response = await fetch(
        `${API_CONFIG.baseURL}/api/datasets/tarifas/${encodeURIComponent(dataset)}?${params.toString()}`
      );

      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error("Error al obtener data de tarifas:", error);
      throw error;
    }
  },

  async getTarifasSummary(dataset, year = null) {
    try {
      const params = new URLSearchParams();
      if (year !== null && year !== undefined && year !== "") params.set("year", String(year));

      const response = await fetch(
        `${API_CONFIG.baseURL}/api/datasets/tarifas/${encodeURIComponent(dataset)}/resumen${
          params.toString() ? `?${params.toString()}` : ""
        }`
      );

      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error("Error al obtener resumen de tarifas:", error);
      throw error;
    }
  },

  async getTarifasPorEstrato(dataset, year = null) {
    try {
      const params = new URLSearchParams();
      if (year !== null && year !== undefined && year !== "") params.set("year", String(year));

      const response = await fetch(
        `${API_CONFIG.baseURL}/api/datasets/tarifas/${encodeURIComponent(dataset)}/por-estrato${
          params.toString() ? `?${params.toString()}` : ""
        }`
      );

      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error("Error al obtener tarifas por estrato:", error);
      throw error;
    }
  },

  async getTarifasTendencia(dataset, year = null, limit = 24) {
    try {
      const params = new URLSearchParams();
      if (year !== null && year !== undefined && year !== "") params.set("year", String(year));
      params.set("limit", String(limit));

      const response = await fetch(
        `${API_CONFIG.baseURL}/api/datasets/tarifas/${encodeURIComponent(dataset)}/tendencia?${params.toString()}`
      );

      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error("Error al obtener tendencia de tarifas:", error);
      throw error;
    }
  },

  async getNegociosMedellinData({
    comuna = null,
    barrio = null,
    categoria = null,
    tipo_negocio = null,
    fecha_recoleccion = null,
    limit = 200,
  } = {}) {
    try {
      const params = new URLSearchParams();
      if (comuna) params.set("comuna", String(comuna));
      if (barrio) params.set("barrio", String(barrio));
      if (categoria) params.set("categoria", String(categoria));
      if (tipo_negocio) params.set("tipo_negocio", String(tipo_negocio));
      if (fecha_recoleccion) params.set("fecha_recoleccion", String(fecha_recoleccion));
      params.set("limit", String(limit));

      const response = await fetch(
        `${API_CONFIG.baseURL}/api/datasets/negocios-medellin?${params.toString()}`
      );

      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error("Error al obtener datos de negocios medellin:", error);
      throw error;
    }
  },

  async getNegociosMedellinSummary({ comuna = null, fecha_recoleccion = null } = {}) {
    try {
      const params = new URLSearchParams();
      if (comuna) params.set("comuna", String(comuna));
      if (fecha_recoleccion) params.set("fecha_recoleccion", String(fecha_recoleccion));

      const response = await fetch(
        `${API_CONFIG.baseURL}/api/datasets/negocios-medellin/resumen${
          params.toString() ? `?${params.toString()}` : ""
        }`
      );

      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error("Error al obtener resumen de negocios medellin:", error);
      throw error;
    }
  },

  async getNegociosMedellinFilters() {
    try {
      const response = await fetch(`${API_CONFIG.baseURL}/api/datasets/negocios-medellin/filtros`);

      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error("Error al obtener filtros de negocios medellin:", error);
      throw error;
    }
  },

  async getNegociosMedellinTopBarrios({ comuna = null, fecha_recoleccion = null, limit = 10 } = {}) {
    try {
      const params = new URLSearchParams();
      if (comuna) params.set("comuna", String(comuna));
      if (fecha_recoleccion) params.set("fecha_recoleccion", String(fecha_recoleccion));
      params.set("limit", String(limit));

      const response = await fetch(
        `${API_CONFIG.baseURL}/api/datasets/negocios-medellin/top-barrios?${params.toString()}`
      );

      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error("Error al obtener top barrios de negocios medellin:", error);
      throw error;
    }
  },

  async getNegociosMedellinTopTipos({
    comuna = null,
    categoria = null,
    fecha_recoleccion = null,
    limit = 10,
  } = {}) {
    try {
      const params = new URLSearchParams();
      if (comuna) params.set("comuna", String(comuna));
      if (categoria) params.set("categoria", String(categoria));
      if (fecha_recoleccion) params.set("fecha_recoleccion", String(fecha_recoleccion));
      params.set("limit", String(limit));

      const response = await fetch(
        `${API_CONFIG.baseURL}/api/datasets/negocios-medellin/top-tipos?${params.toString()}`
      );

      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error("Error al obtener top tipos de negocios medellin:", error);
      throw error;
    }
  }
};
