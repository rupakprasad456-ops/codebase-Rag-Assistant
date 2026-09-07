import React, { useEffect, useState } from 'react';
import { Database, Search, Code, Eye, Hash, Tag, FileText } from 'lucide-react';

export const ChunkExplorer = ({ onOpenCitation }) => {
  const [chunks, setChunks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [language, setLanguage] = useState('');
  const [total, setTotal] = useState(0);

  const fetchChunks = () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (search) params.append('search', search);
    if (language) params.append('language', language);

    fetch(`/api/chunks?${params.toString()}`)
      .then((res) => res.json())
      .then((data) => {
        setChunks(data.chunks || []);
        setTotal(data.total || 0);
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchChunks();
  }, [language]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchChunks();
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div className="glass-card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ fontSize: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Database size={22} color="#06b6d4" /> Code Chunk & AST Vector Store Inspector
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '0.25rem' }}>
            Inspect parsed AST symbols, structural line ranges, and vector corpus tokens ({total} chunks indexed)
          </p>
        </div>

        <form onSubmit={handleSearchSubmit} style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'var(--bg-input)', padding: '0.5rem 0.75rem', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
            <Search size={16} color="var(--text-muted)" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search symbol, content or file..."
              style={{ background: 'transparent', border: 'none', color: 'var(--text-main)', outline: 'none', fontSize: '0.85rem', width: '220px' }}
            />
          </div>

          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            style={{ background: 'var(--bg-input)', border: '1px solid var(--border-color)', color: 'var(--text-main)', padding: '0.5rem 0.75rem', borderRadius: '8px', fontSize: '0.85rem', cursor: 'pointer' }}
          >
            <option value="">All Languages</option>
            <option value="python">Python</option>
            <option value="javascript">JavaScript</option>
            <option value="typescript">TypeScript</option>
            <option value="html">HTML</option>
            <option value="css">CSS</option>
          </select>

          <button type="submit" className="send-btn" style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }}>
            Search Chunks
          </button>
        </form>
      </div>

      {loading ? (
        <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>Loading vector store chunks...</div>
      ) : chunks.length === 0 ? (
        <div className="glass-card" style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
          No chunks found matching search criteria.
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(420px, 1fr))', gap: '1.25rem' }}>
          {chunks.map((c) => (
            <div key={c.chunk_id} className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', padding: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.85rem', color: 'var(--accent-cyan)', fontWeight: 600 }}>
                  {c.file_path}
                </span>
                <span style={{ fontSize: '0.75rem', background: 'rgba(99, 102, 241, 0.15)', color: 'var(--accent-primary)', padding: '0.2rem 0.5rem', borderRadius: '6px', fontFamily: 'var(--font-mono)' }}>
                  L{c.line_start}-{c.line_end}
                </span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  <Tag size={14} color="#a855f7" /> {c.symbol_name || 'Block'}
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  <Code size={14} color="#10b981" /> {c.symbol_type}
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  <FileText size={14} color="#f59e0b" /> {c.language}
                </span>
              </div>

              {c.docstring && (
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontStyle: 'italic', background: 'rgba(255, 255, 255, 0.02)', padding: '0.4rem 0.6rem', borderRadius: '6px' }}>
                  "{c.docstring.substring(0, 120)}..."
                </p>
              )}

              <div className="code-block-wrapper" style={{ margin: 0 }}>
                <pre className="code-pre" style={{ fontSize: '0.78rem', maxHeight: '160px' }}>
                  {c.content}
                </pre>
              </div>

              <button
                className="nav-btn"
                onClick={() => onOpenCitation(c.file_path, c.line_start, c.line_end)}
                style={{ width: '100%', justifyContent: 'center', fontSize: '0.8rem', padding: '0.4rem' }}
              >
                <Eye size={14} /> Open Full File Context
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
