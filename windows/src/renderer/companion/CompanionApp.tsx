import React, { useState, useEffect, useRef } from 'react';
import { AssemblyAIClient } from '../services/AssemblyAIClient';
import { AudioRecorder } from '../services/AudioRecorder';
import { WorkerApiClient, ChatMessage } from '../services/WorkerApiClient';

export const CompanionApp: React.FC = () => {
  const [model, setModel] = useState<'claude-3-7-sonnet' | 'claude-3-5-sonnet' | 'claude-opus'>('claude-3-7-sonnet');
  const [workerUrl, setWorkerUrl] = useState('http://localhost:8787');
  const [status, setStatus] = useState<'idle' | 'listening' | 'thinking' | 'speaking'>('idle');
  const [transcript, setTranscript] = useState('');
  const [responseLog, setResponseLog] = useState<string>('');

  const recorderRef = useRef<AudioRecorder | null>(null);
  const assemblyClientRef = useRef<AssemblyAIClient | null>(null);
  const conversationHistory = useRef<ChatMessage[]>([]);

  const parseAndTriggerPoints = (text: string) => {
    const regex = /\[POINT:(\d+),(\d+):([^:\]]+)(?::screen(\d+))?\]/g;
    let match;
    while ((match = regex.exec(text)) !== null) {
      const x = parseInt(match[1], 10);
      const y = parseInt(match[2], 10);
      const label = match[3];
      const screenIndex = match[4] ? parseInt(match[4], 10) : 0;

      // @ts-ignore
      window.electronAPI?.sendPointElement({ x, y, label, screenIndex });
    }
  };

  const startInteraction = async () => {
    try {
      setStatus('listening');
      setTranscript('');

      const assemblyClient = new AssemblyAIClient(workerUrl);
      const recorder = new AudioRecorder();
      recorderRef.current = recorder;
      assemblyClientRef.current = assemblyClient;

      await assemblyClient.startSession({
        onTranscriptUpdate: (text) => {
          setTranscript(text);
        },
        onFinalTranscript: (text) => {
          setTranscript(text);
        },
        onError: (err) => {
          console.error('AssemblyAI Error:', err);
        }
      });

      await recorder.startRecording((pcm16) => {
        assemblyClient.sendAudioChunk(pcm16);
      });
    } catch (err) {
      console.error('Failed to start recording:', err);
      setStatus('idle');
    }
  };

  const stopInteractionAndAnalyze = async () => {
    if (status !== 'listening') return;

    try {
      recorderRef.current?.stopRecording();
      assemblyClientRef.current?.stopSession();
      setStatus('thinking');

      const userText = transcript.trim() || 'What is on my screen?';

      // @ts-ignore
      const screens = await window.electronAPI?.captureScreen();
      const primaryScreen = screens && screens.length > 0 ? screens[0] : null;

      const workerClient = new WorkerApiClient(workerUrl);
      const systemPrompt = "You are Clicky, a friendly and observant AI buddy living on the user's computer. When referencing visual elements on screen, emit an anchor pointer using the tag [POINT:x,y:label] with approximate pixel coordinates.";

      const userContent: any[] = [];
      if (primaryScreen && primaryScreen.dataUrl) {
        const base64Data = primaryScreen.dataUrl.replace(/^data:image\/\w+;base64,/, '');
        userContent.push({
          type: 'image',
          source: {
            type: 'base64',
            media_type: 'image/jpeg',
            data: base64Data
          }
        });
      }
      userContent.push({
        type: 'text',
        text: userText
      });

      const messages: ChatMessage[] = [
        ...conversationHistory.current,
        { role: 'user', content: userContent }
      ];

      let fullAssistantText = '';
      await workerClient.sendChatStream(
        model,
        systemPrompt,
        messages,
        (chunk) => {
          fullAssistantText += chunk;
          setResponseLog(fullAssistantText);
        }
      );

      conversationHistory.current.push({ role: 'user', content: userText });
      conversationHistory.current.push({ role: 'assistant', content: fullAssistantText });

      parseAndTriggerPoints(fullAssistantText);

      setStatus('speaking');
      const cleanSpokenText = fullAssistantText.replace(/\[POINT:[^\]]+\]/g, '').trim();
      if (cleanSpokenText) {
        const audio = await workerClient.speakTTS(cleanSpokenText);
        audio.onended = () => {
          setStatus('idle');
        };
      } else {
        setStatus('idle');
      }
    } catch (err) {
      console.error('Error during Clicky pipeline execution:', err);
      setStatus('idle');
    }
  };

  useEffect(() => {
    // @ts-ignore
    const cleanup = window.electronAPI?.onPttStatus((data: { isListening: boolean }) => {
      if (data.isListening) {
        startInteraction();
      } else {
        stopInteractionAndAnalyze();
      }
    });

    return () => {
      if (cleanup) cleanup();
    };
  }, [status, transcript, workerUrl, model]);

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
      gap: '12px',
      boxShadow: '0 8px 32px rgba(0,0,0,0.4)'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{
            width: 12,
            height: 12,
            borderRadius: '50%',
            backgroundColor: status === 'listening' ? '#34C759' : (status === 'thinking' ? '#FF9500' : '#007AFF')
          }} />
          <h2 style={{ fontSize: 16, margin: 0, fontWeight: 600 }}>Clicky Windows</h2>
        </div>
        <span style={{
          fontSize: 11,
          padding: '2px 8px',
          borderRadius: 12,
          backgroundColor: status === 'listening' ? '#34C759' : '#3A3A3C',
          fontWeight: 600
        }}>
          {status.toUpperCase()}
        </span>
      </div>

      <div style={{
        backgroundColor: '#2A2A32',
        borderRadius: 8,
        padding: 10,
        fontSize: 12,
        display: 'flex',
        flexDirection: 'column',
        gap: 6
      }}>
        <label style={{ fontWeight: 500 }}>AI Model</label>
        <select
          value={model}
          onChange={(e) => setModel(e.target.value as any)}
          style={{
            backgroundColor: '#1E1E24',
            color: '#FFF',
            border: '1px solid rgba(255,255,255,0.2)',
            padding: '4px 6px',
            borderRadius: 6
          }}
        >
          <option value="claude-3-7-sonnet">Claude 3.7 Sonnet</option>
          <option value="claude-3-5-sonnet">Claude 3.5 Sonnet</option>
          <option value="claude-opus">Claude Opus</option>
        </select>

        <label style={{ fontWeight: 500, marginTop: 4 }}>Worker Proxy URL</label>
        <input
          type="text"
          value={workerUrl}
          onChange={(e) => setWorkerUrl(e.target.value)}
          style={{
            backgroundColor: '#1E1E24',
            color: '#FFF',
            border: '1px solid rgba(255,255,255,0.2)',
            padding: '4px 6px',
            borderRadius: 6,
            fontSize: 11
          }}
        />
      </div>

      <div style={{
        flex: 1,
        backgroundColor: '#141418',
        borderRadius: 8,
        padding: 10,
        fontSize: 12,
        overflowY: 'auto',
        border: '1px solid rgba(255,255,255,0.05)'
      }}>
        {status === 'listening' && (
          <p style={{ color: '#34C759', margin: '0 0 6px 0' }}>
            <strong>Listening:</strong> {transcript || 'Speak now...'}
          </p>
        )}
        {responseLog ? (
          <div>
            <strong style={{ color: '#007AFF' }}>Clicky:</strong>
            <p style={{ margin: '4px 0 0 0', lineHeight: 1.4 }}>{responseLog}</p>
          </div>
        ) : (
          <p style={{ color: '#71717A', margin: 0 }}>Press shortcut to ask Clicky about your screen.</p>
        )}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, alignItems: 'center' }}>
        <span style={{ fontSize: 11, color: '#A1A1AA' }}>
          Shortcut: <kbd style={{ background: '#3A3A3C', padding: '2px 6px', borderRadius: 4 }}>Ctrl + Alt + Space</kbd>
        </span>
        <button
          onClick={() => {
            if (status === 'idle') startInteraction();
            else stopInteractionAndAnalyze();
          }}
          style={{
            width: '100%',
            backgroundColor: status === 'listening' ? '#FF3B30' : '#007AFF',
            color: '#FFF',
            border: 'none',
            padding: '8px 12px',
            borderRadius: 8,
            cursor: 'pointer',
            fontSize: 13,
            fontWeight: 500
          }}
        >
          {status === 'listening' ? 'Release / Analyze' : 'Press to Talk (Push-To-Talk)'}
        </button>
      </div>
    </div>
  );
};

