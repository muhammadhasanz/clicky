import { defineConfig } from 'vite';
import path from 'path';
import electron from 'vite-plugin-electron/simple';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [
    react(),
    electron({
      main: {
        entry: 'src/main/main.ts',
      },
      preload: {
        input: path.join(__dirname, 'src/preload/index.ts'),
      },
      renderer: {},
    }),
  ],
  build: {
    rollupOptions: {
      input: {
        main: path.resolve(__dirname, 'index.html'),
        overlay: path.resolve(__dirname, 'overlay.html'),
      },
    },
  },
});
