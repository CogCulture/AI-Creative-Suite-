import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { marked } from 'marked';
import { getLLMIcon, LLM_BRAND } from '../../utils/llmIcons.jsx';
import Tooltip from '../Tooltip';

const refineVariants = async (sessionId, feedbacks) => {
  const response = await fetch(`/bff/chat/variants/session/${sessionId}/refine`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ feedbacks }),
  });
  if (!response.ok) throw new Error("Failed to refine variants");
  return response.json();
};

const selectVariant = async (sessionId, llmName, conversationId = null) => {
  const response = await fetch(`/bff/chat/variants/session/${sessionId}/select`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ llm_name: llmName, conversation_id: conversationId }),
  });
  if (!response.ok) throw new Error("Failed to select variant");
  return response.json();
};

// LLM brand config (mirrors backend LLM_CONFIGS + ModelPickerModal)
const LLM_META = {
  claude:          { ...LLM_BRAND.claude, label: 'Claude Sonnet' },
  'gpt-4o':        { ...LLM_BRAND['gpt-4o'], label: 'GPT-4o' },
  gemini:          { ...LLM_BRAND.gemini, label: 'Gemini Flash' },
  'gpt-4o-mini':   { ...LLM_BRAND['gpt-4o-mini'], label: 'GPT-4o Mini' },
};

const STATUS_LABEL = {
  pending:    '⏳ Queued…',
  generating: '⚡ Generating…',
  completed:  null,   // show content
  failed:     '❌ Failed',
};

export default function LLMComparisonCard({
  sessionId,
  userRequest,
  variants = [],          // [{llm_name, display_name, color, status, content, iteration, id}]
  conversationId = null,
  onVariantSelected,      // (selectedContent, llmName) => void  — called after successful selection
  isLocked = false,
}) {
  const [feedbacks, setFeedbacks]       = useState({});   // {llm_name: feedback_text}
  const [showFeedback, setShowFeedback] = useState({});   // {llm_name: bool}
  const [localVariants, setLocalVariants] = useState(variants);
  const [isRefining, setIsRefining]     = useState({});   // {llm_name: bool}
  const [isSelecting, setIsSelecting]   = useState(null); // llm_name | null
  const [error, setError]               = useState(null);
  const [selectedLlm, setSelectedLlm]  = useState(null);
  const [maximizedVariantName, setMaximizedVariantName] = useState(null); // 'claude', 'gpt-4o', etc.
  const [isArenaMaximized, setIsArenaMaximized] = useState(false);
  const backdropMouseDownRef = React.useRef(false);

  // Sync incoming prop changes and initialize selectedLlm state
  React.useEffect(() => {
    setLocalVariants(variants);
    const selected = (variants || []).find(v => v.is_selected);
    if (selected) {
      setSelectedLlm(selected.llm_name);
    } else {
      setSelectedLlm(null);
    }
  }, [variants]);

  // Handle ESC to close modals
  React.useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setMaximizedVariantName(null);
        setIsArenaMaximized(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // ── Refinement ─────────────────────────────────────────────────────────────
  const handleRefine = async (llmName) => {
    const fb = feedbacks[llmName]?.trim();
    if (!fb || isLocked) return;
    setIsRefining(r => ({ ...r, [llmName]: true }));
    setError(null);
    try {
      const result = await refineVariants(sessionId, { [llmName]: fb });
      const newRow = result.new_results?.find(r => r.llm_name === llmName);
      if (newRow) {
        setLocalVariants(prev =>
          prev.map(v => v.llm_name === llmName ? { ...v, ...newRow } : v)
        );
      }
      setFeedbacks(f => ({ ...f, [llmName]: '' }));
      setShowFeedback(s => ({ ...s, [llmName]: false }));
    } catch (err) {
      setError(`Refinement failed for ${llmName}: ${err.message}`);
    } finally {
      setIsRefining(r => ({ ...r, [llmName]: false }));
    }
  };

  // ── Selection ───────────────────────────────────────────────────────────────
  const handleSelect = async (llmName, content) => {
    setIsSelecting(llmName);
    setError(null);
    try {
      await selectVariant(sessionId, llmName, conversationId);
      setSelectedLlm(llmName);
      // Clean up localStorage entry so it doesn't re-appear on next reload
      if (conversationId) {
        localStorage.removeItem(`variantSession_${conversationId}`);
      }
      if (onVariantSelected) onVariantSelected(content, llmName);
    } catch (err) {
      setError(`Selection failed: ${err.message}`);
    } finally {
      setIsSelecting(null);
    }
  };

  // ── Copy helper ─────────────────────────────────────────────────────────────
  const copyText = (text) => {
    navigator.clipboard.writeText(text);
  };

  const allDone = localVariants.length > 0 && localVariants.every(v => v.status !== 'pending' && v.status !== 'generating');

  return (
    <>
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      gap: '12px',
      padding: '16px',
      background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
      border: '1px solid #e2e8f0',
      borderRadius: '0px',
      boxShadow: '0 4px 24px rgba(0,0,0,0.06)',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      filter: 'none',
      transition: 'all 0.3s ease',
      position: 'relative'
    }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <div style={{
          background: 'linear-gradient(135deg, #667eea, #764ba2)',
          borderRadius: '0px',
          padding: '6px 10px',
          color: 'white',
          fontSize: '12px',
          fontWeight: '700',
          letterSpacing: '0.5px',
          textTransform: 'uppercase',
        }}>⚡ AI Arena</div>
        <span style={{ fontSize: '13px', color: '#64748b', flex: 1 }}>
          {localVariants.length} models competing • pick the best
        </span>
        {!allDone && (
          <span style={{
            fontSize: '11px',
            color: '#8b5cf6',
            background: '#f5f3ff',
            padding: '3px 10px',
            borderRadius: '0px',
            border: '1px solid #ddd6fe',
            animation: 'pulse 2s infinite',
          }}>generating…</span>
        )}

        <Tooltip text="Open Arena in Full Screen">
          <button
            onClick={() => setIsArenaMaximized(true)}
            style={{
              position: 'absolute',
              top: '16px',
              right: '16px',
              background: '#ffffff',
              border: '1px solid #e2e8f0',
              borderRadius: '0px',
              padding: '6px 12px',
              cursor: 'pointer',
              fontSize: '12px',
              fontWeight: '600',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              color: '#475569',
              boxShadow: '0 2px 4px rgba(0,0,0,0.02)',
              transition: 'all 0.2s ease',
              zIndex: 10,
            }}
            onMouseOver={(e) => { e.currentTarget.style.background = '#f8fafc'; e.currentTarget.style.borderColor = '#cbd5e1'; }}
            onMouseOut={(e) => { e.currentTarget.style.background = '#ffffff'; e.currentTarget.style.borderColor = '#e2e8f0'; }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7"/>
            </svg>
            Maximize Arena
          </button>
        </Tooltip>
      </div>

      {/* Cards row */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
        gap: '12px',
      }}>
        {localVariants.map((v) => {
          const meta = LLM_META[v.llm_name] || { label: v.llm_name, color: '#6b7280', gradient: '#6b7280', icon: '●' };
          const isThisSelected = selectedLlm === v.llm_name || v.is_selected;
          const isThisRefining = isRefining[v.llm_name];
          const isThisSelecting = isSelecting === v.llm_name;

          return (
            <div
              key={v.llm_name}
              style={{
                background: isThisSelected ? 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)' : '#ffffff',
                borderRadius: '0px',
                border: isThisSelected ? `2px solid #10b981` : '1.5px solid #e2e8f0',
                boxShadow: isThisSelected
                  ? `0 0 0 4px #10b98122, 0 4px 16px rgba(0,0,0,0.08)`
                  : '0 2px 8px rgba(0,0,0,0.04)',
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden',
                transition: 'all 0.2s ease',
                position: 'relative',
              }}
            >
              {isThisRefining && (
                <div style={{
                  position: 'absolute',
                  inset: 0,
                  background: 'rgba(255, 255, 255, 0.72)',
                  backdropFilter: 'blur(3.5px)',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  zIndex: 20,
                  cursor: 'not-allowed',
                }}>
                  {/* Premium Spinner */}
                  <div style={{
                    width: '32px',
                    height: '32px',
                    border: '3.5px solid #f3f4f6',
                    borderTopColor: meta.color || '#7c3aed',
                    borderRadius: '50%',
                    animation: 'spin 0.8s linear infinite',
                    marginBottom: '10px',
                  }} />
                  <span style={{
                    fontSize: '13px',
                    fontWeight: '600',
                    color: '#1e293b',
                  }}>Improving variant…</span>
                </div>
              )}
              {/* LLM Badge header */}
              <div style={{
                background: meta.gradient,
                padding: '10px 14px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}>
                <span style={{ color: 'white', fontWeight: '700', fontSize: '13px' }}>{meta.label}</span>
                
                <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  {v.iteration > 0 && (
                    <Tooltip text={`Revision ${v.iteration} — refined ${v.iteration} time${v.iteration > 1 ? 's' : ''} using feedback`}>
                      <span style={{
                        background: 'rgba(255,255,255,0.25)',
                        color: 'white',
                        fontSize: '10px',
                        fontWeight: '600',
                        padding: '2px 8px',
                        borderRadius: '0px',
                        display: 'inline-block'
                      }}>Rev {v.iteration}</span>
                    </Tooltip>
                  )}
                  {isThisSelected && (
                    <span style={{
                      background: 'rgba(255,255,255,0.9)',
                      color: meta.color,
                      fontSize: '10px',
                      fontWeight: '700',
                      padding: '2px 8px',
                      borderRadius: '0px',
                    }}>✓ Selected</span>
                  )}
                  <Tooltip text="Focus on this model">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setMaximizedVariantName(v.llm_name);
                      }}
                      style={{
                        background: 'rgba(255,255,255,0.15)',
                        border: 'none',
                        borderRadius: '0px',
                        color: 'white',
                        cursor: 'pointer',
                        padding: '4px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        transition: 'all 0.2s',
                      }}
                      onMouseOver={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.3)'}
                      onMouseOut={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.15)'}
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="15 3 21 3 21 9"></polyline>
                        <polyline points="9 21 3 21 3 15"></polyline>
                        <line x1="21" y1="3" x2="14" y2="10"></line>
                        <line x1="3" y1="21" x2="10" y2="14"></line>
                      </svg>
                    </button>
                  </Tooltip>
                </div>
              </div>

              {/* Content area */}
              <div style={{ padding: '12px 14px', flex: 1, minHeight: '120px' }}>
                {v.status === 'completed' && v.content ? (
                  <div
                    style={{ fontSize: '13px', lineHeight: '1.65', color: '#374151', maxHeight: '280px', overflowY: 'auto', userSelect: 'text', WebkitUserSelect: 'text' }}
                    dangerouslySetInnerHTML={{ __html: marked(v.content) }}
                  />
                ) : v.status === 'failed' ? (
                  <div style={{ fontSize: '13px', color: '#ef4444', fontStyle: 'italic' }}>
                    {v.error_msg || 'Generation failed. Please try again.'}
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', padding: '20px 0' }}>
                    {/* Skeleton loader */}
                    {[100, 90, 75].map((w, i) => (
                      <div key={i} style={{
                        height: '12px',
                        background: `linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%)`,
                        backgroundSize: '200% 100%',
                        borderRadius: '0px',
                        width: `${w}%`,
                        animation: 'shimmer 1.5s infinite',
                      }} />
                    ))}
                    <span style={{ fontSize: '12px', color: '#9ca3af', marginTop: '4px' }}>
                      {STATUS_LABEL[v.status] || '⏳'}
                    </span>
                  </div>
                )}
              </div>

              {/* Action bar */}
              {v.status === 'completed' && v.content && !selectedLlm && (
                <div style={{
                  borderTop: '1px solid #f1f5f9',
                  padding: '10px 14px',
                  display: 'flex',
                  gap: '6px',
                  flexWrap: 'wrap',
                }}>
                  {/* Select button */}
                  <Tooltip text="" position="top" style={{ flex: 1 }}>
                    <button
                      onClick={() => handleSelect(v.llm_name, v.content)}
                      disabled={isSelecting === v.llm_name || v.status !== 'completed'}
                      style={{
                        width: '100%',
                        padding: '7px 12px',
                        background: (v.status !== 'completed') ? '#f1f5f9' : meta.gradient,
                        color: (v.status !== 'completed') ? '#94a3b8' : 'white',
                        border: 'none',
                        borderRadius: '0px',
                        fontSize: '12px',
                        fontWeight: '700',
                        cursor: ((isSelecting === v.llm_name) || v.status !== 'completed') ? 'not-allowed' : 'pointer',
                        transition: 'opacity 0.15s',
                        opacity: ((isSelecting === v.llm_name) || v.status !== 'completed') ? 0.5 : 1,
                      }}
                    >
                      {isSelecting === v.llm_name ? '…' : '✓ Use This'}
                    </button>
                  </Tooltip>

                  {/* Copy */}
                  <Tooltip text="Copy to clipboard">
                    <button
                      onClick={() => copyText(v.content)}
                      style={{
                        padding: '7px 10px',
                        background: '#f8fafc',
                        border: '1px solid #e2e8f0',
                        borderRadius: '0px',
                        fontSize: '13px',
                        cursor: 'pointer',
                        color: '#64748b',
                        opacity: 1,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                        <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                      </svg>
                    </button>
                  </Tooltip>

                  {/* Feedback toggle */}
                  <Tooltip text="Give feedback to improve">
                    <button
                      onClick={() => setShowFeedback(s => ({ ...s, [v.llm_name]: !s[v.llm_name] }))}
                      disabled={isLocked}
                      style={{
                        padding: '7px 10px',
                        background: showFeedback[v.llm_name] ? '#f0fdf4' : '#f8fafc',
                        border: `1px solid ${showFeedback[v.llm_name] ? '#86efac' : '#e2e8f0'}`,
                        borderRadius: '0px',
                        fontSize: '13px',
                        cursor: isLocked ? 'not-allowed' : 'pointer',
                        color: '#64748b',
                        opacity: isLocked ? 0.5 : 1,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                      </svg>
                    </button>
                  </Tooltip>
                </div>
              )}

              {/* "Use This" button if already selected another but want to switch */}
              {v.status === 'completed' && v.content && selectedLlm && !isThisSelected && (
                <div style={{ borderTop: '1px solid #f1f5f9', padding: '10px 14px' }}>
                  <button
                    onClick={() => handleSelect(v.llm_name, v.content)}
                    style={{
                      width: '100%',
                      padding: '7px',
                      background: '#f8fafc',
                      color: meta.color,
                      border: `1.5px solid ${meta.color}`,
                      borderRadius: '0px',
                      fontSize: '12px',
                      fontWeight: '600',
                      cursor: 'pointer',
                      opacity: 1,
                    }}
                  >
                    Switch to {meta.label}
                  </button>
                </div>
              )}

              {/* Feedback input */}
              {showFeedback[v.llm_name] && (
                <div style={{ padding: '0 14px 12px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <textarea
                    value={feedbacks[v.llm_name] || ''}
                    onChange={e => setFeedbacks(f => ({ ...f, [v.llm_name]: e.target.value }))}
                    placeholder="E.g. Make it shorter and more punchy…"
                    rows={3}
                    style={{
                      width: '100%',
                      padding: '8px 10px',
                      fontSize: '12px',
                      border: '1px solid #d1d5db',
                      borderRadius: '0px',
                      resize: 'vertical',
                      outline: 'none',
                      fontFamily: 'inherit',
                      boxSizing: 'border-box',
                    }}
                  />
                  <button
                    onClick={() => handleRefine(v.llm_name)}
                    disabled={isLocked || !feedbacks[v.llm_name]?.trim() || isRefining[v.llm_name]}
                    style={{
                      alignSelf: 'flex-end',
                      padding: '6px 14px',
                      background: (isLocked || !feedbacks[v.llm_name]?.trim()) ? '#e5e7eb' : meta.gradient,
                      color: (isLocked || !feedbacks[v.llm_name]?.trim()) ? '#9ca3af' : 'white',
                      border: 'none',
                      borderRadius: '0px',
                      fontSize: '12px',
                      fontWeight: '600',
                      cursor: (isLocked || !feedbacks[v.llm_name]?.trim()) ? 'not-allowed' : 'pointer',
                    }}
                  >
                    {isRefining[v.llm_name] ? 'Improving…' : '⚡ Improve'}
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Error display */}
      {error && (
        <div style={{
          padding: '10px 14px',
          background: '#fef2f2',
          border: '1px solid #fecaca',
          borderRadius: '0px',
          fontSize: '13px',
          color: '#dc2626',
        }}>
          {error}
        </div>
      )}

      {/* Selected banner */}
      {selectedLlm && (
        <div style={{
          padding: '12px 16px',
          background: 'linear-gradient(135deg, #f0fdf4, #dcfce7)',
          border: '1px solid #86efac',
          borderRadius: '0px',
          fontSize: '13px',
          color: '#15803d',
          fontWeight: '600',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
        }}>
          <span>✅</span>
          <span>
            {LLM_META[selectedLlm]?.label || selectedLlm} selected as your baseline.{' '}
            Subsequent messages will continue with this model.
          </span>
        </div>
      )}

      {/* Shimmer animation styles */}
      <style>{`
        @keyframes shimmer {
          0%   { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50%       { opacity: 0.6; }
        }
        @keyframes scaleUp {
          from { transform: scale(0.95); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>

    {/* ── Maximize Arena Modal ─────────────────────────────────────────────── */}
    {isArenaMaximized && createPortal(
      <div style={{
        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
        zIndex: 100000, background: 'rgba(0, 0, 0, 0.5)',
        backdropFilter: 'blur(4px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '24px',
      }}
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) {
          backdropMouseDownRef.current = true;
        }
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget && backdropMouseDownRef.current) {
          setIsArenaMaximized(false);
        }
        backdropMouseDownRef.current = false;
      }}>
        <div style={{
          background: '#f8fafc', width: '100%', maxWidth: '1400px', height: '95vh',
          borderRadius: '0px', display: 'flex', flexDirection: 'column',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
          overflow: 'hidden', animation: 'scaleUp 0.3s ease-out',
        }} onClick={e => e.stopPropagation()}>
          <div style={{ padding: '12px 20px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
            <div>
              <h2 style={{ margin: 0, fontSize: '16px', fontWeight: '700', color: '#1e293b' }}>AI Arena Explorer</h2>
              <p style={{ margin: '2px 0 0', fontSize: '12px', color: '#64748b' }}>Comparing {localVariants.length} elite models in high-fidelity</p>
            </div>
            <button
              onClick={() => setIsArenaMaximized(false)}
              style={{
                background: '#f1f5f9', border: 'none', borderRadius: '0px', width: '32px', height: '32px',
                cursor: 'pointer', color: '#64748b', fontSize: '18px', fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}
            >×</button>
          </div>

          <div style={{ flex: 1, overflowY: 'auto', padding: '20px', display: 'flex', flexDirection: 'column' }}>
            <div style={{
              display: 'grid',
              gridTemplateColumns: `repeat(${localVariants.length}, 1fr)`,
              gap: '24px',
              minWidth: 'fit-content',
              flex: 1,
              height: '100%'
            }}>
              {localVariants.map(v => {
                const meta = LLM_META[v.llm_name] || { label: v.llm_name, color: '#6b7280', gradient: '#6b7280' };
                return (
                  <div key={`max-${v.llm_name}`} style={{ border: '1px solid #e2e8f0', borderRadius: '0px', background: 'white', overflow: 'hidden', boxShadow: '0 4px 6px rgba(0,0,0,0.05)', display: 'flex', flexDirection: 'column', height: '100%' }}>
                    <div style={{ background: meta.gradient || '#ccc', padding: '12px 20px', color: 'white', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span style={{ flex: 1 }}>{meta.label}</span>
                      {v.iteration > 0 && (
                        <Tooltip text={`Revision ${v.iteration} — refined ${v.iteration} time${v.iteration > 1 ? 's' : ''} using feedback`}>
                          <span style={{ fontSize: '11px', background: 'rgba(255,255,255,0.2)', padding: '2px 6px', borderRadius: '0px' }}>Rev {v.iteration}</span>
                        </Tooltip>
                      )}
                      <button 
                        onClick={() => setMaximizedVariantName(v.llm_name)}
                        style={{
                          background: 'rgba(255,255,255,0.15)',
                          border: 'none',
                          borderRadius: '0px',
                          width: '28px',
                          height: '28px',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: 'white',
                          transition: 'background 0.2s',
                        }}
                        onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.25)'}
                        onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.15)'}
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="15 3 21 3 21 9"></polyline>
                          <polyline points="9 21 3 21 3 15"></polyline>
                          <line x1="21" y1="3" x2="14" y2="10"></line>
                          <line x1="3" y1="21" x2="10" y2="14"></line>
                        </svg>
                      </button>
                    </div>
                    <div className="arena-markdown-content" style={{ flex: 1, overflowY: 'auto', userSelect: 'text', WebkitUserSelect: 'text' }} dangerouslySetInnerHTML={{ __html: marked(v.content || '') }} />
                    <div style={{ padding: '14px 20px', borderTop: '1px solid #f1f5f9', background: '#f8fafc', display: 'flex', gap: '12px', flexShrink: 0 }}>
                        <Tooltip text="" position="top" style={{ flex: 1 }}>
                          <button 
                            onClick={() => { handleSelect(v.llm_name, v.content); setIsArenaMaximized(false); }}
                            disabled={isSelecting === v.llm_name}
                            style={{ 
                              width: '100%',
                              padding: '10px 14px', 
                              borderRadius: '0px', 
                              background: meta.gradient, 
                              color: 'white', 
                              border: 'none', 
                              fontWeight: '600', 
                              fontSize: '14px', 
                              cursor: 'pointer' 
                            }}
                          >
                            {isSelecting === v.llm_name ? 'Selecting...' : '✓ Use This Response'}
                          </button>
                        </Tooltip>
                       <button 
                         onClick={() => { copyText(v.content); }}
                         style={{ flex: 1, padding: '10px 14px', borderRadius: '0px', background: 'white', border: '1px solid #e2e8f0', color: '#64748b', fontWeight: '600', fontSize: '14px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
                       >
                         <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                           <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                           <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                         </svg>
                         Copy
                       </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>,
      document.getElementById('modal-root') || document.body
    )}


    {/* ── Single Model Focus Modal ─────────────────────────────────────────── */}
    {maximizedVariantName && createPortal(
      <div style={{
        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
        zIndex: 100000, background: 'rgba(0, 0, 0, 0.5)',
        backdropFilter: 'blur(4px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '20px',
      }}
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) {
          backdropMouseDownRef.current = true;
        }
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget && backdropMouseDownRef.current) {
          setMaximizedVariantName(null);
        }
        backdropMouseDownRef.current = false;
      }}>
        {localVariants.filter(v => v.llm_name === maximizedVariantName).map(v => {
          const meta = LLM_META[v.llm_name] || { label: v.llm_name, color: '#6b7280', gradient: '#6b7280' };
          return (
            <div key="focus-modal" style={{
              background: 'white', width: '100%', maxWidth: '900px', maxHeight: '95vh',
              borderRadius: '0px', overflow: 'hidden', display: 'flex', flexDirection: 'column',
              boxShadow: `0 0 60px ${meta.color}44`,
              animation: 'scaleUp 0.2s ease-out',
            }} onClick={e => e.stopPropagation()}>
              <div style={{ background: meta.gradient, padding: '14px 20px', color: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <h2 style={{ margin: 0, fontSize: '18px', fontWeight: '700' }}>{meta.label}</h2>
                  {v.iteration > 0 && (
                    <Tooltip text={`Revision ${v.iteration} — refined ${v.iteration} time${v.iteration > 1 ? 's' : ''} using feedback`}>
                      <span style={{ background: 'rgba(255,255,255,0.2)', padding: '2px 8px', borderRadius: '0px', fontSize: '11px', display: 'inline-block' }}>
                        Revision {v.iteration}
                      </span>
                    </Tooltip>
                  )}
                </div>
                <button
                  onClick={() => setMaximizedVariantName(null)}
                  style={{
                    background: 'rgba(255,255,255,0.2)', border: 'none', borderRadius: '0px', width: '28px', height: '28px',
                    cursor: 'pointer', color: 'white', fontSize: '16px', fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center'
                  }}
                >×</button>
              </div>
              <div className="arena-markdown-content" style={{ flex: 1, overflowY: 'auto', userSelect: 'text', WebkitUserSelect: 'text' }} dangerouslySetInnerHTML={{ __html: marked(v.content || '') }} />
              <div style={{ padding: '14px 20px', borderTop: '1px solid #f1f5f9', background: '#f8fafc', display: 'flex', gap: '12px', flexShrink: 0 }}>
                  <Tooltip text="" position="top" style={{ flex: 1 }}>
                    <button 
                      onClick={() => { handleSelect(v.llm_name, v.content); setMaximizedVariantName(null); }}
                      disabled={isSelecting === v.llm_name}
                      style={{ 
                        width: '100%',
                        padding: '10px 14px', 
                        borderRadius: '0px', 
                        background: meta.gradient, 
                        color: 'white', 
                        border: 'none', 
                        fontWeight: '600', 
                        fontSize: '14px', 
                        cursor: 'pointer' 
                      }}
                    >
                      {isSelecting === v.llm_name ? 'Selecting...' : '✓ Use This Response'}
                    </button>
                  </Tooltip>
                 <button 
                   onClick={() => { copyText(v.content); }}
                   style={{ flex: 1, padding: '10px 14px', borderRadius: '0px', background: 'white', border: '1px solid #e2e8f0', color: '#64748b', fontWeight: '600', fontSize: '14px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
                 >
                   <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                     <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                     <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                   </svg>
                   Copy
                 </button>
              </div>
            </div>
          );
        })}
      </div>,
      document.getElementById('modal-root') || document.body
    )}
    <style>{`
      .arena-markdown-content {
        padding: 32px 48px !important;
        font-size: 15px !important;
        line-height: 1.85 !important;
        color: #334155 !important;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif !important;
      }
      .arena-markdown-content p {
        margin-bottom: 1.25em !important;
      }
      .arena-markdown-content ol, .arena-markdown-content ul {
        padding-left: 1.5em !important;
        margin-bottom: 1.25em !important;
      }
      .arena-markdown-content li {
        margin-bottom: 0.75em !important;
        line-height: 1.75 !important;
      }
      .arena-markdown-content li strong {
        color: #0f172a !important;
      }
      .arena-markdown-content h1, 
      .arena-markdown-content h2, 
      .arena-markdown-content h3, 
      .arena-markdown-content h4 {
        margin-top: 1.5em !important;
        margin-bottom: 0.75em !important;
        font-weight: 700 !important;
        color: #0f172a !important;
      }
    `}</style>
    </>
  );
}
