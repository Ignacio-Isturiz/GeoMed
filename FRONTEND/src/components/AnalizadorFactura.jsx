// src/components/AnalizadorFactura.jsx
// Módulo de análisis de facturas EPM con GPT-4o Vision

import { useState, useRef } from 'react';
import { llmService } from '@/services/llmService';

export default function AnalizadorFactura() {
  const [imagenes, setImagenes] = useState([]); // [{file, preview}]
  const [resultado, setResultado] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef(null);

  const agregarArchivos = (files) => {
    const validos = Array.from(files).filter(f => f.type.startsWith('image/'));
    if (validos.length === 0) { setError('Solo se aceptan imágenes (JPG, PNG, WEBP).'); return; }
    setError(null);
    setResultado(null);
    setImagenes(prev => {
      const nuevas = validos.map(f => ({ file: f, preview: URL.createObjectURL(f) }));
      const combinadas = [...prev, ...nuevas];
      if (combinadas.length > 6) { setError('Máximo 6 imágenes.'); return prev; }
      return combinadas;
    });
  };

  const eliminarImagen = (idx) => {
    setImagenes(prev => prev.filter((_, i) => i !== idx));
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    agregarArchivos(e.dataTransfer.files);
  };

  const handleAnalizar = async () => {
    if (imagenes.length === 0) return;
    setLoading(true);
    setError(null);
    try {
      const res = await llmService.analyzeFactura(imagenes.map(i => i.file));
      setResultado(res.data);
    } catch (e) {
      setError('No se pudo analizar la factura. Intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  const resetear = () => {
    setImagenes([]);
    setResultado(null);
    setError(null);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', height: '100%' }}>

      {/* Zona de upload */}
      {!resultado && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {/* Drop zone */}
          <div
            onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={handleDrop}
            onClick={() => inputRef.current?.click()}
            style={{
              border: `2px dashed ${dragging ? '#3b82f6' : '#475569'}`,
              borderRadius: '0.75rem',
              padding: '1.25rem',
              textAlign: 'center',
              cursor: 'pointer',
              backgroundColor: dragging ? '#1e3a5f22' : 'transparent',
              transition: 'all 0.2s',
            }}
          >
            <input
              ref={inputRef}
              type="file"
              accept="image/*"
              multiple
              style={{ display: 'none' }}
              onChange={(e) => agregarArchivos(e.target.files)}
            />
            <div style={{ color: '#94a3b8' }}>
              <div style={{ fontSize: '1.75rem', marginBottom: '0.4rem' }}>📄</div>
              <p style={{ margin: 0, fontSize: '0.85rem' }}>
                Arrastra las fotos de tu factura o <span style={{ color: '#3b82f6' }}>haz clic para agregar</span>
              </p>
              <p style={{ margin: '0.2rem 0 0', fontSize: '0.72rem' }}>
                Varias imágenes permitidas · Energía · Acueducto · Gas · JPG, PNG, WEBP
              </p>
            </div>
          </div>

          {/* Previews */}
          {imagenes.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
              {imagenes.map((img, idx) => (
                <div key={idx} style={{ position: 'relative' }}>
                  <img
                    src={img.preview}
                    alt={`Página ${idx + 1}`}
                    style={{ width: '80px', height: '80px', objectFit: 'cover', borderRadius: '0.5rem', border: '1px solid #334155' }}
                  />
                  <button
                    onClick={() => eliminarImagen(idx)}
                    disabled={loading}
                    style={{
                      position: 'absolute', top: '-6px', right: '-6px',
                      width: '18px', height: '18px',
                      backgroundColor: '#ef4444', color: 'white',
                      border: 'none', borderRadius: '50%',
                      cursor: 'pointer', fontSize: '0.65rem', lineHeight: 1,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}
                  >✕</button>
                </div>
              ))}
            </div>
          )}

          {/* Botón analizar */}
          {imagenes.length > 0 && (
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button
                onClick={handleAnalizar}
                disabled={loading}
                style={{
                  flex: 1,
                  padding: '0.5rem 1rem',
                  backgroundColor: loading ? '#475569' : '#3b82f6',
                  color: 'white', border: 'none', borderRadius: '0.5rem',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  fontWeight: 'bold', fontSize: '0.9rem',
                }}
              >
                {loading ? 'Analizando...' : `Analizar ${imagenes.length} imagen${imagenes.length > 1 ? 'es' : ''}`}
              </button>
              <button
                onClick={resetear}
                disabled={loading}
                style={{
                  padding: '0.5rem 1rem',
                  backgroundColor: 'transparent', color: '#94a3b8',
                  border: '1px solid #475569', borderRadius: '0.5rem',
                  cursor: 'pointer', fontSize: '0.85rem',
                }}
              >
                Limpiar
              </button>
            </div>
          )}
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div style={{ textAlign: 'center', color: '#94a3b8', fontSize: '0.85rem', padding: '0.5rem' }}>
          Procesando con GPT-4o Vision y tarifas EPM reales...
        </div>
      )}

      {/* Error */}
      {error && (
        <div style={{ backgroundColor: '#450a0a', border: '1px solid #7f1d1d', borderRadius: '0.5rem', padding: '0.75rem 1rem', color: '#fca5a5', fontSize: '0.85rem' }}>
          {error}
        </div>
      )}

      {/* Resultados */}
      {resultado && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', overflowY: 'auto' }}>

          {/* Resumen */}
          <div style={{ backgroundColor: '#1e293b', borderRadius: '0.75rem', padding: '1rem' }}>
            <h4 style={{ margin: '0 0 0.5rem', color: '#38bdf8', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Resumen de tu factura
            </h4>
            <p style={{ margin: 0, fontSize: '0.9rem', lineHeight: '1.5', color: '#e2e8f0' }}>
              {resultado.resumen}
            </p>
            {resultado.datos_extraidos && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginTop: '0.75rem' }}>
                {Object.entries(resultado.datos_extraidos).map(([k, v]) => v && (
                  <span key={k} style={{
                    backgroundColor: '#0f172a',
                    border: '1px solid #334155',
                    borderRadius: '0.4rem',
                    padding: '0.2rem 0.6rem',
                    fontSize: '0.75rem',
                    color: '#94a3b8',
                  }}>
                    <strong style={{ color: '#e2e8f0' }}>{k.replace('_', ' ')}: </strong>{v}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Recomendaciones */}
          {resultado.recomendaciones?.length > 0 && (
            <div style={{ backgroundColor: '#14532d22', border: '1px solid #166534', borderRadius: '0.75rem', padding: '1rem' }}>
              <h4 style={{ margin: '0 0 0.5rem', color: '#4ade80', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Recomendaciones de ahorro
              </h4>
              <ul style={{ margin: 0, paddingLeft: '1.2rem', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                {resultado.recomendaciones.map((rec, i) => (
                  <li key={i} style={{ fontSize: '0.875rem', lineHeight: '1.5', color: '#d1fae5' }}>{rec}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Predicción */}
          {resultado.prediccion && (
            <div style={{ backgroundColor: '#1e1b4b22', border: '1px solid #3730a3', borderRadius: '0.75rem', padding: '1rem' }}>
              <h4 style={{ margin: '0 0 0.5rem', color: '#818cf8', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Predicción próxima factura
              </h4>
              <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginBottom: '0.5rem' }}>
                <div style={{ backgroundColor: '#0f172a', borderRadius: '0.5rem', padding: '0.5rem 1rem', textAlign: 'center' }}>
                  <div style={{ fontSize: '1.3rem', fontWeight: 'bold', color: '#818cf8' }}>
                    {resultado.prediccion.valor_estimado}
                  </div>
                  <div style={{ fontSize: '0.7rem', color: '#64748b' }}>estimado</div>
                </div>
                <div style={{ backgroundColor: '#0f172a', borderRadius: '0.5rem', padding: '0.5rem 1rem', textAlign: 'center' }}>
                  <div style={{ fontSize: '1.3rem', fontWeight: 'bold', color: '#4ade80' }}>
                    {resultado.prediccion.ahorro_estimado}
                  </div>
                  <div style={{ fontSize: '0.7rem', color: '#64748b' }}>ahorro posible</div>
                </div>
              </div>
              <p style={{ margin: 0, fontSize: '0.8rem', color: '#a5b4fc', lineHeight: '1.5' }}>
                {resultado.prediccion.explicacion}
              </p>
            </div>
          )}

          {/* Nueva factura */}
          <button
            onClick={resetear}
            style={{
              padding: '0.5rem',
              backgroundColor: 'transparent',
              color: '#94a3b8',
              border: '1px solid #334155',
              borderRadius: '0.5rem',
              cursor: 'pointer',
              fontSize: '0.85rem',
            }}
          >
            Analizar otra factura
          </button>
        </div>
      )}
    </div>
  );
}
