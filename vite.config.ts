import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  base: './',
  build: { assetsInlineLimit: 200000, chunkSizeWarningLimit: 2500, rolldownOptions: { output: { codeSplitting: false } } },
  plugins: [react(), tailwindcss()],
  test: { environment: 'jsdom', globals: true, setupFiles: ['./src/test-setup.ts'] },
})
