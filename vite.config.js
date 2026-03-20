import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    proxy: {
      // Only proxy /api to backend - auth endpoints are handled separately
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true,
      },
      // Proxy Google OAuth endpoints specifically (not /auth/callback which is a frontend route)
      '/auth/google': {
        target: 'http://localhost:8080',
        changeOrigin: true,
      },
    },
  },
})
