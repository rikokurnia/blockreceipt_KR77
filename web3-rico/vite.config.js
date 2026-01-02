import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  define: {
    // This forcefully replaces the variable __API_URL__ with the correct string during build.
    '__API_URL__': JSON.stringify(process.env.NODE_ENV === 'production' ? '/api/web3' : 'http://localhost:4000/api')
  },
  server: {
    proxy: {
      '/api/web3': {
        target: 'http://localhost:4000',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/web3/, '/api'),
      },
    },
  },
})
