import React, { useEffect, useState } from 'react';
import { X, FileCode, Check, Copy } from 'lucide-react';

export const CodeViewerModal = ({ filePath, lineStart, lineEnd, onClose }) => {
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!filePath) return;
    setLoading(true);
    setError(null);

    fetch(`/api/file-content?path=${encodeURIComponent(filePath)}`)
      .then((res) => {
        if (!res.ok) throw new Error(`Failed to load file (${res.status})`);
        return res.json();
      })
      .then((data) => {
        setContent(data.content);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [filePath]);

  const handleCopy = () => {
    navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const lines = content.split('\n');

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <FileCode size={20} color="#06b6d4" />
            <div>
              <h3 style={{ fontSize: '1.05rem', fontFamily: 'var(--font-mono)' }}>{filePath}</h3>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                Citation Lines Highlighted: {lineStart} - {lineEnd}
              </span>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <button className="nav-btn" onClick={handleCopy} style={{ padding: '0.4rem 0.75rem', fontSize: '0.8rem' }}>
              {copied ? <Check size={14} color="#10b981" /> : <Copy size={14} />}
              {copied ? 'Copied' : 'Copy'}
            </button>
            <button className="close-btn" onClick={onClose}>
              <X size={20} />
            </button>
          </div>
        </div>

        <div className="modal-body" style={{ background: '#06090e', padding: 0 }}>
          {loading ? (
            <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
              Loading source file content...
            </div>
          ) : error ? (
            <div style={{ padding: '2rem', color: '#ef4444', textAlign: 'center' }}>
              {error}
            </div>
          ) : (
            <div className="code-pre" style={{ margin: 0, padding: '1rem 0' }}>
              {lines.map((lineText, idx) => {
                const lineNum = idx + 1;
                const isHighlighted = lineNum >= lineStart && lineNum <= lineEnd;
                return (
                  <div
                    key={idx}
                    className={isHighlighted ? 'line-highlight' : ''}
                    style={{
                      display: 'flex',
                      padding: '0.15rem 1rem',
                      fontSize: '0.85rem',
                      lineHeight: '1.5',
                    }}
                  >
                    <span
                      style={{
                        width: '45px',
                        display: 'inline-block',
                        color: isHighlighted ? '#6366f1' : '#4b5563',
                        fontWeight: isHighlighted ? 'bold' : 'normal',
                        userSelect: 'none',
                        textAlign: 'right',
                        paddingRight: '1rem',
                      }}
                    >
                      {lineNum}
                    </span>
                    <span style={{ color: isHighlighted ? '#ffffff' : '#d1d5db', whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
                      {lineText || ' '}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
