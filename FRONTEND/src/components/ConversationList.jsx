// src/components/ConversationList.jsx

import { useState, useEffect } from 'react';
import { llmService } from '@/services/llmService';

export default function ConversationList({ currentId, onSelect, onNew, onDelete }) {
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadConversations();
  }, []);

  const loadConversations = async () => {
    try {
      setLoading(true);
      const res = await llmService.getConversations();
      if (res.success) {
        setConversations(res.data || []);
      }
    } catch (error) {
      console.error('Error loading conversations:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (e, convId) => {
    e.stopPropagation();
    if (confirm('¿Eliminar esta conversación?')) {
      try {
        await llmService.deleteConversation(convId);
        setConversations(conversations.filter(c => c.id !== convId));
      } catch (error) {
        console.error('Error deleting conversation:', error);
      }
    }
  };

  return (
    <div style={{
      width: '240px',
      backgroundColor: 'rgba(15, 23, 42, 0.8)',
      borderRight: '1px solid rgba(255, 255, 255, 0.06)',
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      overflow: 'hidden',
    }}>
      {/* Header con botón New */}
      <div style={{
        padding: '16px',
        borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
      }}>
        <button
          onClick={onNew}
          style={{
            width: '100%',
            padding: '10px 12px',
            backgroundColor: '#00C896',
            color: '#0F172A',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            fontWeight: 600,
            fontSize: '0.9rem',
            transition: 'background-color 0.2s',
          }}
          onMouseEnter={(e) => e.target.style.backgroundColor = '#00D4A1'}
          onMouseLeave={(e) => e.target.style.backgroundColor = '#00C896'}
        >
          + Nuevo Chat
        </button>
      </div>

      {/* Lista de conversaciones */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        padding: '8px',
      }}>
        {loading ? (
          <div style={{
            padding: '16px 12px',
            fontSize: '0.85rem',
            color: 'rgba(255, 255, 255, 0.38)',
            textAlign: 'center',
          }}>
            Cargando...
          </div>
        ) : conversations.length === 0 ? (
          <div style={{
            padding: '16px 12px',
            fontSize: '0.85rem',
            color: 'rgba(255, 255, 255, 0.38)',
            textAlign: 'center',
          }}>
            No hay conversaciones
          </div>
        ) : (
          conversations.map((conv) => (
            <div
              key={conv.id}
              onClick={() => onSelect(conv.id)}
              style={{
                padding: '12px',
                marginBottom: '6px',
                borderRadius: '8px',
                backgroundColor: currentId === conv.id
                  ? 'rgba(0, 200, 150, 0.15)'
                  : 'rgba(255, 255, 255, 0.04)',
                border: currentId === conv.id
                  ? '1px solid rgba(0, 200, 150, 0.3)'
                  : '1px solid rgba(255, 255, 255, 0.08)',
                cursor: 'pointer',
                transition: 'all 0.2s',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                gap: '8px',
              }}
              onMouseEnter={(e) => {
                if (currentId !== conv.id) {
                  e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.08)';
                }
              }}
              onMouseLeave={(e) => {
                if (currentId !== conv.id) {
                  e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.04)';
                }
              }}
            >
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{
                  fontSize: '0.9rem',
                  color: currentId === conv.id ? '#00C896' : 'rgba(255, 255, 255, 0.88)',
                  fontWeight: 500,
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}>
                  {conv.title || 'Sin título'}
                </div>
                <div style={{
                  fontSize: '0.75rem',
                  color: 'rgba(255, 255, 255, 0.32)',
                  marginTop: '4px',
                }}>
                  {new Date(conv.created_at).toLocaleDateString('es-CO', { month: 'short', day: 'numeric' })}
                </div>
              </div>
              <button
                onClick={(e) => handleDelete(e, conv.id)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'rgba(255, 255, 255, 0.38)',
                  cursor: 'pointer',
                  padding: '4px 8px',
                  fontSize: '1rem',
                  transition: 'color 0.2s',
                }}
                onMouseEnter={(e) => e.target.style.color = '#EF4444'}
                onMouseLeave={(e) => e.target.style.color = 'rgba(255, 255, 255, 0.38)'}
                title="Eliminar conversación"
              >
                ✕
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
