import React, { useState, useEffect } from 'react';

export const CompanionApp: React.FC = () => {
  const [model, setModel] = useState<'claude-3-7-sonnet' | 'claude-3-5-sonnet' | 'claude-opus'>('claude-3-7-sonnet');
  const [isListening, setIsListening] = useState(false);
  const [workerUrl, setWorkerUrl] = useState('http://localhost:8787');
  const [status, setStatus] = useState<'idle' | 'listening' | 'thinking' | 'speaking'>('idle');

  useEffect(() => {
    // @ts-ignore
    const cleanup = window.electronAPI?.onPttStatus((data: { isListening: boolean }) => {
      setIsListening(data.isListening);
      setStatus(data.isListening ? 'listening' : 'idle');
    });

    return () => {
      if (cleanup) cleanup();
    };
  }, []);

  const handleTestPointer = () => {
    // @ts-ignore
    window.electronAPI?.sendPointElement({
      x: window.screen.width / 2,
      y: window.screen.height / 2,
      label: 'Testing Clicky Pointer'
    });
  };

  return (
    <div style={{
      width: '100%',
      height: '100%',
      backgroundColor: '#1E1E24',
      color: '#ECECF1',
      fontFamily: 'Segoe UI, system-ui, sans-serif',
      padding: '20px',
      boxSizing: 'border-box',
      borderRadius: '16px',
      border: '1px solid rgba(255, 255, 255, 0.1)',
      display: 'flex',
      flexDirection: 'column',
      gap: '16px',
      boxShadow: '0 8px 32px rgba(0,0,0,0.4)'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ width: 12, height: 12, borderRadius: '50%', backgroundColor: '#007AFF' }} />
          <h2 style={{ fontSize: 16, margin: 0, fontWeight: 600 }}>Clicky Windows</h2>
        </div>
        <span style={{
          fontSize: 11,
          padding: '2px 8px',
          borderRadius: 12,
          backgroundColor: isListening ? '#34C759' : '#3A3A3C'
        }}>
          {status.toUpperCase()}
        </span>
      </div>

      <div style={{
        backgroundColor: '#2A2A32',
        borderRadius: 8,
        padding: 12,
        fontSize: 13,
        display: 'flex',
        flexDirection: 'column',
        gap: 8
      }}>
        <label style={{ fontWeight: 500 }}>AI Model</label>
        <select
          value={model}
          onChange={(e) => setModel(e.target.value as any)}
          style={{
            backgroundColor: '#1E1E24',
            color: '#FFF',
            border: '1px solid rgba(255,255,255,0.2)',
            padding: '6px 8px',
            borderRadius: 6
          }}
        >
          <option value="claude-3-7-sonnet">Claude 3.7 Sonnet (Recommended)</option>
          <option value="claude-3-5-sonnet">Claude 3.5 Sonnet</option>
          <option value="claude-opus">Claude Opus</option>
        </select>
      </div>

      <div style={{
        backgroundColor: '#2A2A32',
        borderRadius: 8,
        padding: 12,
        fontSize: 13,
        display: 'flex',
        flexDirection: 'column',
        gap: 8
      }}>
        <label style={{ fontWeight: 500 }}>Worker Proxy URL</label>
        <input
          type="text"
          value={workerUrl}
          onChange={(e) => setWorkerUrl(e.target.value)}
          style={{
            backgroundColor: '#1E1E24',
            color: '#FFF',
            border: '1px solid rgba(255,255,255,0.2)',
            padding: '6px 8px',
            borderRadius: 6,
            fontSize: 12
          }}
        />
      </div>

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', gap: 8 }}>
        <p style={{ fontSize: 12, color: '#A1A1AA', textAlign: 'center', margin: 0 }}>
          Shortcut: <kbd style={{ background: '#3A3A3C', padding: '2px 6px', borderRadius: 4 }}>Ctrl + Alt + Space</kbd>
        </p>
        <button
          onClick={handleTestPointer}
          style={{
            backgroundColor: '#007AFF',
            color: '#FFF',
            border: 'none',
            padding: '8px 16px',
            borderRadius: 8,
            cursor: 'pointer',
            fontSize: 13,
            fontWeight: 500
          }}
        >
          Test Pointer Animation
        </button>
      </div>
    </div>
  );
};
