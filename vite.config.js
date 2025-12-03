import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  build: {
    // Suppress chunk size warning - app is a single-page SPA and 500KB is reasonable
    chunkSizeWarningLimit: 600,
  },
})