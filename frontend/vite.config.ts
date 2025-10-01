// vite.config.ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    host: true,
    port: 5173,
    proxy: {
      '/upload': {
        target: 'http://backend:8080',
        changeOrigin: true,
        secure: false,
      },
      '/logs': {
        target: 'http://backend:8080',
        changeOrigin: true,
        secure: false,
      },
      '/metrics': {
        target: 'http://backend:8080',
        changeOrigin: true,
        secure: false,
      },
      '/timeline': {
        target: 'http://backend:8080',
        changeOrigin: true,
        secure: false,
      },
      '/groups': {
        target: 'http://backend:8080',
        changeOrigin: true,
        secure: false,
      },
      '/export': {
        target: 'http://backend:8080',
        changeOrigin: true,
        secure: false,
      },
    },
  },
})
