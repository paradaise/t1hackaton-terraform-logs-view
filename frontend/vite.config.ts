// vite.config.ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/upload': {
        target: 'http://127.0.1.1:8080',
        changeOrigin: true,
        secure: false,
      },
      '/logs': {
        target: 'http://127.0.1.1:8080',
        changeOrigin: true,
        secure: false,
      },
      '/metrics': {
        target: 'http://127.0.1.1:8080',
        changeOrigin: true,
        secure: false,
      },
      '/timeline': {
        target: 'http://127.0.1.1:8080',
        changeOrigin: true,
        secure: false,
      },
      '/groups': {
        target: 'http://127.0.1.1:8080',
        changeOrigin: true,
        secure: false,
      },
      '/export': {
        target: 'http://127.0.1.1:8080',
        changeOrigin: true,
        secure: false,
      },
    },
  },
})