import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// En despliegue en GitHub Pages el sitio vive en un subpath
// (https://catrehack.github.io/vectorize-web/), por eso 'base'.
// Sobreescribible con VITE_BASE si se monta en otro sitio.
export default defineConfig({
  plugins: [react()],
  base: process.env.VITE_BASE || '/vectorize-web/',
  server: {
    port: 5173,
    proxy: {
      '/api': 'http://localhost:8000',
    },
  },
})
