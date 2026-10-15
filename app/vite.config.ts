import react from '@vitejs/plugin-react'
import { resolve } from 'node:path'
import { defineConfig } from 'vite'

// https://vite.dev/config/
// Pages: landing (/), game = Telegram Mini App (/play/), wallet linking (/wallet/), rules and privacy
const page = (p: string) => resolve(import.meta.dirname, p)

export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      input: {
        landing: page('index.html'),
        play: page('play/index.html'),
        wallet: page('wallet/index.html'),
        rules: page('rules/index.html'),
        privacy: page('privacy/index.html'),
      },
    },
  },
})
