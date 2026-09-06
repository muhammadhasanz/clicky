export interface ChatMessage {
  role: 'user' | 'assistant';
  content: any;
}

export class WorkerApiClient {
  private workerUrl: string;

  constructor(workerUrl: string) {
    this.workerUrl = workerUrl.replace(/\/+$/, '');
  }

  async sendChatStream(
    model: string,
    systemPrompt: string,
    messages: ChatMessage[],
    onChunk: (text: string) => void
  ): Promise<string> {
    const payload = {
      model,
      max_tokens: 1024,
      system: systemPrompt,
      messages,
      stream: true
    };

    const res = await fetch(`${this.workerUrl}/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!res.ok) {
      throw new Error(`Chat request failed: ${res.status} ${await res.text()}`);
    }

    if (!res.body) {
      throw new Error('No response body from /chat stream');
    }

    const reader = res.body.getReader();
    const decoder = new TextDecoder('utf-8');
    let fullText = '';
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const dataStr = line.slice(6).trim();
          if (dataStr === '[DONE]') continue;
          try {
            const parsed = JSON.parse(dataStr);
            if (parsed.type === 'content_block_delta' && parsed.delta?.text) {
              fullText += parsed.delta.text;
              onChunk(parsed.delta.text);
            }
          } catch (e) {
            // Ignore parse errors on partial frames
          }
        }
      }
    }

    return fullText;
  }

  async speakTTS(text: string): Promise<HTMLAudioElement> {
    const res = await fetch(`${this.workerUrl}/tts`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'audio/mpeg'
      },
      body: JSON.stringify({
        text,
        model_id: 'eleven_flash_v2_5',
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.75
        }
      })
    });

    if (!res.ok) {
      throw new Error(`TTS failed: ${res.status} ${await res.text()}`);
    }

    const blob = await res.blob();
    const audioUrl = URL.createObjectURL(blob);
    const audio = new Audio(audioUrl);
    await audio.play();
    return audio;
  }
}
