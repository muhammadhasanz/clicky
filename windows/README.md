# Clicky for Windows

Versi desktop Windows untuk Clicky AI Companion.

## Arsitektur
- **Runtime**: Electron + TypeScript + React
- **System Tray**: Menu bar / System Tray icon companion
- **Transparent Overlay**: Window transparan multi-monitor untuk rendering animasi blue pointer element target
- **Push-to-Talk**: Global shortcut (`Ctrl + Alt + Space`) untuk voice streaming
- **Worker Proxy**: Integrasi Cloudflare Worker (`/chat` SSE, `/tts` ElevenLabs, `/transcribe-token` AssemblyAI)

## Menjalankan (Development)
```bash
npm install
npm run dev
```
