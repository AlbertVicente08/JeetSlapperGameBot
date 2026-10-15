import react from '@vitejs/plugin-react'
import { resolve } from 'node:path'
import { defineConfig } from 'vite'

// https://vite.dev/config/
// Dos páginas: la landing en / y el juego (Telegram Mini App) en /play/
export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      input: {
        landing: resolve(import.meta.dirname, 'index.html'),
        play: resolve(import.meta.dirname, 'play/index.html'),
      },
    },
  },
})
