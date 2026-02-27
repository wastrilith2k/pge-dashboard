import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api/watttime': {
        target: 'https://api.watttime.org',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/watttime/, ''),
      },
      '/api/eia': {
        target: 'https://api.eia.gov',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/eia/, ''),
      },
    },
  },
})
