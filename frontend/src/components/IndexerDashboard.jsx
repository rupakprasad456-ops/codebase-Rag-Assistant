import React, { useState } from 'react';
import { FolderPlus, Play, UploadCloud, FileCode, CheckCircle, RefreshCw, Layers, ShieldCheck } from 'lucide-react';

export const IndexerDashboard = ({ status, onIndexSuccess }) => {
  const [dirPath, setDirPath] = useState('');
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState(null);
  const [err, setErr] = useState(null);

  const stats = status?.stats || { total_files: 0, total_chunks: 0, language_breakdown: {}, indexed_files: [] };

  const handleIndexSample = () => {
    setLoading(true);
    setMsg(null);
    setErr(null);

    fetch('/api/index-sample', { method: 'POST' })
      .then((res) => res.json())
      .then((data) => {
        setMsg(data.message);
        if (onIndexSuccess) onIndexSuccess();
      })
      .catch((e) => setErr(`Failed to index sample codebase: ${e.message}`))
      .finally(() => setLoading(false));
  };

  const handleIndexPath = (e) => {
    e.preventDefault();
    if (!dirPath.trim()) return;
    setLoading(true);
    setMsg(null);
    setErr(null);

    fetch('/api/index-path', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ directory_path: dirPath }),
    })
      .then((res) => {
        if (!res.ok) return res.json().then((d) => Promise.reject(new Error(d.detail)));
        return res.json();
      })
      .then((data) => {
        setMsg(data.message);
        if (onIndexSuccess) onIndexSuccess();
      })
      .catch((e) => setErr(e.message))
      .finally(() => setLoading(false));
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setLoading(true);
    setMsg(null);
    setErr(null);

    const formData = new FormData();
    formData.append('file', file);

    fetch('/api/upload-zip', {
      method: 'POST',
      body: formData,
    })
      .then((res) => res.json())
      .then((data) => {
        setMsg(data.message);
        if (onIndexSuccess) onIndexSuccess();
      })
      .catch((e) => setErr(`Zip index failed: ${e.message}`))
      .finally(() => setLoading(false));
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Action Header Card */}
      <div className="glass-card" style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '1.5rem' }}>
        <div>
          <h2 style={{ fontSize: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
            <FolderPlus size={24} color="#6366f1" /> Repository Indexing Hub
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', lineHeight: '1.5' }}>
            Index any local codebase directory or test immediately with our pre-built sample project. AST parser automatically extracts classes, functions, and docstrings.
          </p>

          <form onSubmit={handleIndexPath} style={{ marginTop: '1.25rem', display: 'flex', gap: '0.75rem' }}>
            <input
              type="text"
              value={dirPath}
              onChange={(e) => setDirPath(e.target.value)}
              placeholder="e.g. C:\Users\Projects\my-app"
              style={{
                flex: 1,
                padding: '0.75rem',
                borderRadius: '10px',
                background: 'var(--bg-input)',
                border: '1px solid var(--border-color)',
                color: 'var(--text-main)',
                fontFamily: 'var(--font-mono)',
                fontSize: '0.85rem',
                outline: 'none',
              }}
            />
            <button type="submit" className="send-btn" disabled={loading}>
              <Play size={16} /> Index Directory
            </button>
          </form>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', borderLeft: '1px solid var(--border-color)', paddingLeft: '1.5rem' }}>
          <h3 style={{ fontSize: '0.95rem', color: 'var(--text-muted)' }}>Quick Index Actions</h3>
          <button
            onClick={handleIndexSample}
            disabled={loading}
            className="preset-btn"
            style={{ background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.2), rgba(6, 182, 212, 0.2))', borderColor: 'var(--border-glow)' }}
          >
            <ShieldCheck size={18} color="#06b6d4" />
            <div>
              <div style={{ fontWeight: 700 }}>Index Sample Codebase (1-Click)</div>
              <div style={{ fontSize: '0.75rem', opacity: 0.8 }}>Pre-loaded Python Auth, Database & React UI</div>
            </div>
          </button>

          <label className="preset-btn" style={{ cursor: 'pointer' }}>
            <UploadCloud size={18} color="#a855f7" />
            <div>
              <div style={{ fontWeight: 700 }}>Upload Codebase (.zip Archive)</div>
              <div style={{ fontSize: '0.75rem', opacity: 0.8 }}>Upload zipped source folder</div>
            </div>
            <input type="file" accept=".zip" onChange={handleFileUpload} style={{ display: 'none' }} />
          </label>
        </div>
      </div>

      {msg && (
        <div style={{ padding: '1rem', borderRadius: '12px', background: 'rgba(16, 185, 129, 0.15)', border: '1px solid #10b981', color: '#10b981', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <CheckCircle size={18} /> {msg}
        </div>
      )}

      {err && (
        <div style={{ padding: '1rem', borderRadius: '12px', background: 'rgba(239, 68, 68, 0.15)', border: '1px solid #ef4444', color: '#ef4444' }}>
          {err}
        </div>
      )}

      {/* Indexing Metrics Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
        <div className="glass-card">
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Total Indexed Files</div>
          <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--accent-primary)', marginTop: '0.25rem' }}>
            {stats.total_files}
          </div>
        </div>
        <div className="glass-card">
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>AST Code Chunks</div>
          <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--accent-cyan)', marginTop: '0.25rem' }}>
            {stats.total_chunks}
          </div>
        </div>
        <div className="glass-card">
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Languages Detected</div>
          <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', marginTop: '0.5rem' }}>
            {Object.entries(stats.language_breakdown || {}).map(([lang, count]) => (
              <span key={lang} style={{ padding: '0.2rem 0.5rem', borderRadius: '6px', background: 'rgba(255, 255, 255, 0.06)', fontSize: '0.75rem', fontFamily: 'var(--font-mono)' }}>
                {lang}: {count}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Indexed Files Table / Tree */}
      <div className="glass-card">
        <h3 style={{ fontSize: '1.05rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <FileCode size={18} color="#f59e0b" /> Indexed Repository Files ({stats.indexed_files.length})
        </h3>
        {stats.indexed_files.length === 0 ? (
          <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', padding: '1.5rem', textAlign: 'center' }}>
            No repository files indexed yet. Click "Index Sample Codebase" above to start!
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {stats.indexed_files.map((file) => (
              <div
                key={file.file_path}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyBound: 'space-between',
                  padding: '0.75rem 1rem',
                  borderRadius: '10px',
                  background: 'rgba(255, 255, 255, 0.02)',
                  border: '1px solid rgba(255, 255, 255, 0.04)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <FileCode size={16} color="var(--accent-cyan)" />
                  <div>
                    <div style={{ fontSize: '0.88rem', fontFamily: 'var(--font-mono)', fontWeight: 600 }}>
                      {file.file_path}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.1rem' }}>
                      Symbols extracted: {file.symbols.length > 0 ? file.symbols.join(', ') : 'Module blocks'}
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <span style={{ fontSize: '0.75rem', padding: '0.2rem 0.5rem', borderRadius: '6px', background: 'rgba(168, 85, 247, 0.15)', color: 'var(--accent-secondary)', fontFamily: 'var(--font-mono)' }}>
                    {file.chunks_count} chunks
                  </span>
                  <span style={{ fontSize: '0.75rem', padding: '0.2rem 0.5rem', borderRadius: '6px', background: 'rgba(99, 102, 241, 0.15)', color: 'var(--accent-primary)', textTransform: 'uppercase', fontFamily: 'var(--font-mono)' }}>
                    {file.language}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
