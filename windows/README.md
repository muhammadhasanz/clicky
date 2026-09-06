# Clicky for Windows

Versi desktop Windows untuk Clicky AI Companion.

## Arsitektur
- **Runtime**: Electron + TypeScript + Vite + React
- **System Tray**: Menu bar / System Tray icon companion di notification area Windows
- **Transparent Overlay**: Window transparan borderless multi-monitor (`setIgnoreMouseEvents`) untuk rendering animasi blue pointer element target `[POINT:x,y:label]`
- **Push-to-Talk**: Global shortcut (`Ctrl + Alt + Space` / hotkey toggle) untuk voice recording & streaming
- **Audio Capture**: Web Audio API (mono PCM16 16kHz)
- **STT**: AssemblyAI streaming WebSocket via proxy token
- **Screen Capture**: Multi-monitor desktop capturer saat shortcut ditekan
- **Worker Proxy**: Integrasi Cloudflare Worker (`/chat` SSE Claude vision, `/tts` ElevenLabs audio playback, `/transcribe-token`)

## Cara Menjalankan

### 1. Prasyarat
- Node.js v18+ (Node v22.18.0 terverifikasi berjalan di mesin ini)
- Cloudflare Worker proxy berjalan (lokal via `npx wrangler dev` di folder `worker/` atau deployed URL)

### 2. Instalasi Dependensi
Masuk ke direktori `windows`:
```bash
cd windows
npm install
```

### 3. Menjalankan Mode Development
```bash
npm run dev
```

### 4. Penggunaan
1. Saat aplikasi berjalan, icon Clicky akan muncul di System Tray Windows (sudut kanan bawah taskbar).
2. Klik icon tray untuk membuka Companion Panel dan memilih model AI (Claude 3.7 Sonnet / 3.5 Sonnet / Opus) serta mengatur Worker URL.
3. Tekan shortcut global `Ctrl + Alt + Space` atau klik tombol "Press to Talk":
   - Mic merekam dan men-stream suara ke AssemblyAI.
   - Saat tombol ditekan/dilepas (Release), screen capture diambil otomatis dan dikirim bersama transkrip ke Claude vision API.
   - Clicky akan merespons melalui streaming teks, memutar suara ElevenLabs, serta menggerakkan pointer kursor biru ke elemen UI yang ditunjuk di layar.

