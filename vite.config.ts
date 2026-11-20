import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// base relativo: funciona em GitHub Pages (/cestacorp/) e em qualquer subpasta.
export default defineConfig({
  base: './',
  plugins: [react()],
  server: { port: 5173 },
  preview: { port: 4173 },
})
