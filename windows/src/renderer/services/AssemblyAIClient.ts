export interface AssemblyAISessionCallbacks {
  onTranscriptUpdate: (text: string) => void;
  onFinalTranscript: (text: string) => void;
  onError: (err: any) => void;
}

export class AssemblyAIClient {
  private socket: WebSocket | null = null;
  private workerUrl: string;

  constructor(workerUrl: string) {
    this.workerUrl = workerUrl.replace(/\/+$/, '');
  }

  async getTemporaryToken(): Promise<string> {
    const res = await fetch(`${this.workerUrl}/transcribe-token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });

    if (!res.ok) {
      throw new Error(`Failed to fetch transcribe token: ${res.status} ${await res.text()}`);
    }

    const data = await res.json();
    return data.token;
  }

  async startSession(callbacks: AssemblyAISessionCallbacks): Promise<void> {
    const token = await this.getTemporaryToken();
    const wsUrl = `wss://streaming.assemblyai.com/v3/ws?token=${token}&sample_rate=16000`;

    this.socket = new WebSocket(wsUrl);

    this.socket.onopen = () => {
      console.log('Connected to AssemblyAI Streaming WebSocket');
    };

    this.socket.onmessage = (event: MessageEvent) => {
      try {
        const message = JSON.parse(event.data.toString());
        if (message.type === 'Turn') {
          if (message.transcript) {
            callbacks.onTranscriptUpdate(message.transcript);
          }
          if (message.end_of_turn) {
            callbacks.onFinalTranscript(message.transcript || '');
          }
        } else if (message.type === 'Error') {
          callbacks.onError(new Error(message.error || message.message || 'AssemblyAI error'));
        }
      } catch (err) {
        callbacks.onError(err);
      }
    };

    this.socket.onerror = (err: any) => {
      callbacks.onError(err);
    };

    this.socket.onclose = () => {
      console.log('AssemblyAI WebSocket closed');
    };
  }

  sendAudioChunk(pcmData: Int16Array | ArrayBuffer): void {
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      this.socket.send(pcmData);
    }
  }

  stopSession(): void {
    if (this.socket) {
      try {
        this.socket.send(JSON.stringify({ terminate_session: true }));
      } catch (e) {
        // ignore
      }
      this.socket.close();
      this.socket = null;
    }
  }
}
