import React, { useState } from 'react';
import { Send, Bot, User, Sparkles, FileText, Clock, HelpCircle, Zap, Shield, CreditCard } from 'lucide-react';

export const ChatView = ({ onOpenCitation, config }) => {
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: `### 👋 Welcome to Codebase RAG Assistant!
Ask me anything about your repository architecture, specific functions, security authentication flow, or payment integration logic.

*Click any inline citation chip below to inspect exact file lines in full context!*`,
      citations: [
        { file_path: 'backend/sample_codebase/auth.py', symbol_name: 'AuthManager', line_start: 15, line_end: 45, score: 0.95 },
        { file_path: 'backend/sample_codebase/payment_gateway.py', symbol_name: 'create_payment_intent', line_start: 18, line_end: 35, score: 0.91 }
      ],
      metrics: null
    }
  ]);

  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  const presets = [
    { label: 'How does authentication work?', icon: <Shield size={14} color="#6366f1" />, query: 'How does the authentication and JWT token verification system work?' },
    { label: 'Where are payment intents created?', icon: <CreditCard size={14} color="#06b6d4" />, query: 'Where are Stripe payment intents created and confirmed in the code?' },
    { label: 'Explain database models & orders', icon: <FileText size={14} color="#a855f7" />, query: 'How are orders created in the database and inventory stock validated?' },
    { label: 'Show React AuthForm component', icon: <Zap size={14} color="#f59e0b" />, query: 'How does the React AuthForm component handle user login and JWT token storage?' }
  ];

  const handleSend = (textToSend) => {
    const queryText = textToSend || input;
    if (!queryText.trim() || loading) return;

    const userMsg = { role: 'user', content: queryText };
    setMessages((prev) => [...prev, userMsg]);
    if (!textToSend) setInput('');
    setLoading(true);

    fetch('/api/query', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query: queryText, top_k: 5 }),
    })
      .then((res) => {
        if (!res.ok) throw new Error(`Server response status ${res.status}`);
        return res.json();
      })
      .then((data) => {
        const botMsg = {
          role: 'assistant',
          content: data.answer,
          citations: data.citations || [],
          metrics: data.metrics
        };
        setMessages((prev) => [...prev, botMsg]);
      })
      .catch((err) => {
        setMessages((prev) => [
          ...prev,
          {
            role: 'assistant',
            content: `❌ **Error querying codebase:** ${err.message}\nMake sure the backend FastAPI server is running and codebase is indexed!`,
            citations: []
          }
        ]);
      })
      .finally(() => setLoading(false));
  };

  const renderContentWithCitations = (text, citations) => {
    // Simple markdown-style rendering wrapper
    const lines = text.split('\n');
    return (
      <div>
        {lines.map((line, i) => (
          <div key={i} style={{ marginBottom: line.startsWith('#') ? '0.5rem' : '0.2rem' }}>
            {line.startsWith('### ') ? (
              <h3 style={{ fontSize: '1.05rem', color: 'var(--text-main)', marginTop: '0.5rem' }}>{line.replace('### ', '')}</h3>
            ) : line.startsWith('#### ') ? (
              <h4 style={{ fontSize: '0.95rem', color: 'var(--accent-cyan)', marginTop: '0.5rem' }}>{line.replace('#### ', '')}</h4>
            ) : line.startsWith('```') ? (
              <pre className="code-pre" style={{ background: '#06090e', padding: '0.75rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.08)' }}>
                {line.replace(/```[a-z]*/, '')}
              </pre>
            ) : (
              <span>{line}</span>
            )}
          </div>
        ))}

        {citations && citations.length > 0 && (
          <div style={{ marginTop: '0.75rem', paddingTop: '0.75rem', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.35rem', fontWeight: 600 }}>
              RELEVANT CODE CITATIONS (CLICK TO INSPECT SOURCE):
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
              {citations.map((c, idx) => (
                <button
                  key={idx}
                  className="citation-chip"
                  onClick={() => onOpenCitation(c.file_path, c.line_start, c.line_end)}
                >
                  <FileText size={12} />
                  <span>{c.file_name || c.file_path}</span>
                  <span style={{ opacity: 0.7 }}>:{c.line_start}-{c.line_end}</span>
                  {c.score && (
                    <span style={{ fontSize: '0.7rem', opacity: 0.9, color: 'var(--accent-cyan)' }}>
                      ({Math.round(c.score * 100)}%)
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="chat-wrapper">
      <div className="glass-card chat-main">
        <div className="chat-history">
          {messages.map((m, idx) => (
            <div key={idx} className={`chat-bubble ${m.role}`}>
              <div className={`avatar-icon ${m.role}`}>
                {m.role === 'user' ? <User size={18} /> : <Bot size={18} />}
              </div>
              <div className="chat-content">
                {renderContentWithCitations(m.content, m.citations)}
                {m.metrics && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginTop: '0.5rem', fontSize: '0.72rem', color: 'var(--text-dim)' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                      <Clock size={12} /> Retrieval: {m.metrics.retrieval_time_sec}s
                    </span>
                    <span>Chunks evaluated: {m.metrics.retrieved_chunks_count}</span>
                  </div>
                )}
              </div>
            </div>
          ))}

          {loading && (
            <div className="chat-bubble assistant">
              <div className="avatar-icon assistant">
                <Sparkles size={18} className="animate-spin" />
              </div>
              <div className="chat-content" style={{ color: 'var(--accent-cyan)' }}>
                Searching codebase vectors & synthesizing answer...
              </div>
            </div>
          )}
        </div>

        <div className="chat-input-box">
          <textarea
            className="chat-textarea"
            placeholder="Ask a question about the codebase architecture, functions, logic..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            rows={2}
          />
          <button className="send-btn" onClick={() => handleSend()} disabled={loading || !input.trim()}>
            <Send size={16} /> Ask RAG
          </button>
        </div>
      </div>

      <div className="sidebar-panel">
        <div className="glass-card">
          <h3 style={{ fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
            <Sparkles size={16} color="#6366f1" /> Preset Codebase Queries
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {presets.map((p, i) => (
              <button key={i} className="preset-btn" onClick={() => handleSend(p.query)}>
                {p.icon}
                <span>{p.label}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="glass-card">
          <h3 style={{ fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
            <HelpCircle size={16} color="#06b6d4" /> Active RAG Engine Info
          </h3>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
            <div>Provider: <strong style={{ color: 'var(--text-main)', textTransform: 'capitalize' }}>{config.provider || 'offline'}</strong></div>
            <div>Hybrid Balance: <strong style={{ color: 'var(--accent-cyan)' }}>{Math.round((config.hybrid_ratio || 0.6) * 100)}% Vector</strong></div>
            <div>AST Parser: <strong style={{ color: '#10b981' }}>Python / JS Active</strong></div>
          </div>
        </div>
      </div>
    </div>
  );
};
