import React, { useState } from 'react';
import { X, Sliders, Cpu, Key, Layers, Save } from 'lucide-react';

export const SettingsModal = ({ config, onSave, onClose }) => {
  const [provider, setProvider] = useState(config.provider || 'offline');
  const [apiKey, setApiKey] = useState(config.api_key || '');
  const [modelName, setModelName] = useState(config.model_name || 'gemini-2.5-flash');
  const [hybridRatio, setHybridRatio] = useState(config.hybrid_ratio !== undefined ? config.hybrid_ratio : 0.6);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState(null);

  const handleSubmit = (e) => {
    e.preventDefault();
    setSaving(true);

    fetch('/api/settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        provider,
        api_key: apiKey,
        model_name: modelName,
        hybrid_ratio: parseFloat(hybridRatio),
      }),
    })
      .then((res) => res.json())
      .then((data) => {
        setMsg('Settings saved successfully!');
        if (onSave) onSave(data.config);
        setTimeout(() => onClose(), 1200);
      })
      .catch((err) => setMsg(`Error saving settings: ${err.message}`))
      .finally(() => setSaving(false));
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" style={{ maxWidth: '600px' }} onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <Sliders size={20} color="#a855f7" />
            <h3 style={{ fontSize: '1.1rem' }}>RAG Engine & LLM Settings</h3>
          </div>
          <button className="close-btn" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {msg && (
            <div style={{ padding: '0.75rem', borderRadius: '8px', background: 'rgba(16, 185, 129, 0.15)', border: '1px solid #10b981', color: '#10b981', fontSize: '0.85rem' }}>
              {msg}
            </div>
          )}

          <div>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem', fontWeight: 600, fontSize: '0.9rem' }}>
              <Cpu size={16} color="#6366f1" /> LLM Synthesis Engine Provider
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
              {[
                { id: 'offline', name: 'Smart Offline Engine', desc: 'No API Key required' },
                { id: 'gemini', name: 'Google Gemini', desc: 'gemini-2.5-flash' },
                { id: 'openai', name: 'OpenAI GPT-4o', desc: 'gpt-4o-mini' },
                { id: 'ollama', name: 'Ollama Local LLM', desc: 'http://localhost:11434' },
              ].map((p) => (
                <button
                  type="button"
                  key={p.id}
                  onClick={() => setProvider(p.id)}
                  style={{
                    padding: '0.75rem',
                    borderRadius: '10px',
                    border: `1px solid ${provider === p.id ? '#6366f1' : 'rgba(255, 255, 255, 0.1)'}`,
                    background: provider === p.id ? 'rgba(99, 102, 241, 0.15)' : 'rgba(18, 24, 38, 0.5)',
                    color: provider === p.id ? '#ffffff' : 'var(--text-muted)',
                    textAlign: 'left',
                    cursor: 'pointer',
                  }}
                >
                  <div style={{ fontWeight: 600, fontSize: '0.85rem', color: provider === p.id ? '#ffffff' : 'var(--text-main)' }}>{p.name}</div>
                  <div style={{ fontSize: '0.75rem', opacity: 0.7 }}>{p.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {(provider === 'gemini' || provider === 'openai') && (
            <div>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem', fontWeight: 600, fontSize: '0.9rem' }}>
                <Key size={16} color="#f59e0b" /> API Key ({provider.toUpperCase()})
              </label>
              <input
                type="password"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder={`Enter your ${provider} API key`}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  borderRadius: '8px',
                  background: 'var(--bg-input)',
                  border: '1px solid var(--border-color)',
                  color: 'var(--text-main)',
                  outline: 'none',
                }}
              />
            </div>
          )}

          <div>
            <label style={{ display: 'flex', alignItems: 'center', justifyBetween: 'space-between', gap: '0.5rem', marginBottom: '0.5rem', fontWeight: 600, fontSize: '0.9rem' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Layers size={16} color="#06b6d4" /> Hybrid Search Balance (Vector vs BM25 Keyword)
              </span>
              <span style={{ color: 'var(--accent-cyan)', fontFamily: 'var(--font-mono)' }}>
                {Math.round(hybridRatio * 100)}% Vector / {Math.round((1 - hybridRatio) * 100)}% BM25
              </span>
            </label>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={hybridRatio}
              onChange={(e) => setHybridRatio(e.target.value)}
              style={{ width: '100%', accentColor: '#06b6d4', cursor: 'pointer' }}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1rem' }}>
            <button type="button" className="nav-btn" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="send-btn" disabled={saving}>
              <Save size={16} /> {saving ? 'Saving...' : 'Save Settings'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
