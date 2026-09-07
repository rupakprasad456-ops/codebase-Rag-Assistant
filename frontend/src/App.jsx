import React, { useState, useEffect } from 'react';
import { MessageSquare, FolderGit2, Database, Sliders, Cpu, Sparkles, Layers } from 'lucide-react';
import { ChatView } from './components/ChatView';
import { IndexerDashboard } from './components/IndexerDashboard';
import { ChunkExplorer } from './components/ChunkExplorer';
import { SettingsModal } from './components/SettingsModal';
import { CodeViewerModal } from './components/CodeViewerModal';

const API_BASE = import.meta.env.VITE_API_BASE_URL || '';

export default function App() {
  const [activeTab, setActiveTab] = useState('chat');
  const [status, setStatus] = useState(null);
  const [showSettings, setShowSettings] = useState(false);
  const [selectedCitation, setSelectedCitation] = useState(null);

  const fetchStatus = () => {
    fetch(`${API_BASE}/api/status`)
      .then((res) => res.json())
      .then((data) => setStatus(data))
      .catch((e) => console.error('Failed to fetch backend status:', e));
  };

  useEffect(() => {
    fetchStatus();
    const timer = setInterval(fetchStatus, 10000);
    return () => clearInterval(timer);
  }, []);

  const handleOpenCitation = (filePath, lineStart, lineEnd) => {
    setSelectedCitation({ filePath, lineStart, lineEnd });
  };

  const currentConfig = status?.config || { provider: 'offline', hybrid_ratio: 0.6 };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Header Bar */}
      <header className="app-header">
        <div className="brand-container">
          <div className="brand-icon">
            <Layers size={24} color="#ffffff" />
          </div>
          <div>
            <h1 className="brand-title">Codebase RAG Assistant</h1>
            <div className="brand-subtitle">AST Syntax Parser & Vector Intelligence</div>
          </div>
        </div>

        <nav className="nav-tabs">
          <button
            className={`nav-btn ${activeTab === 'chat' ? 'active' : ''}`}
            onClick={() => setActiveTab('chat')}
          >
            <MessageSquare size={16} /> RAG Assistant
          </button>
          <button
            className={`nav-btn ${activeTab === 'indexer' ? 'active' : ''}`}
            onClick={() => setActiveTab('indexer')}
          >
            <FolderGit2 size={16} /> Repository Indexer
          </button>
          <button
            className={`nav-btn ${activeTab === 'explorer' ? 'active' : ''}`}
            onClick={() => setActiveTab('explorer')}
          >
            <Database size={16} /> Vector & Chunk Explorer
          </button>
        </nav>

        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div className="status-badge">
            <div className="status-dot"></div>
            <span>
              {status ? `${status.stats?.total_chunks || 0} Chunks Indexed` : 'Connecting...'}
            </span>
          </div>

          <button
            className="nav-btn"
            onClick={() => setShowSettings(true)}
            style={{ padding: '0.5rem 0.8rem', background: 'rgba(255, 255, 255, 0.05)' }}
          >
            <Sliders size={16} color="#a855f7" /> Settings
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="main-container">
        {activeTab === 'chat' && (
          <ChatView onOpenCitation={handleOpenCitation} config={currentConfig} />
        )}
        {activeTab === 'indexer' && (
          <IndexerDashboard status={status} onIndexSuccess={fetchStatus} />
        )}
        {activeTab === 'explorer' && (
          <ChunkExplorer onOpenCitation={handleOpenCitation} />
        )}
      </main>

      {/* Modals */}
      {showSettings && (
        <SettingsModal
          config={currentConfig}
          onSave={fetchStatus}
          onClose={() => setShowSettings(false)}
        />
      )}

      {selectedCitation && (
        <CodeViewerModal
          filePath={selectedCitation.filePath}
          lineStart={selectedCitation.lineStart}
          lineEnd={selectedCitation.lineEnd}
          onClose={() => setSelectedCitation(null)}
        />
      )}
    </div>
  );
}
