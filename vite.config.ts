import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    sourcemap: false,
    chunkSizeWarningLimit: 1000,
    minify: 'esbuild',
    rollupOptions: {
      output: {
        manualChunks: {
          'lucide': ['lucide-react'],
          'vendor': ['react', 'react-dom', 'react-router-dom', 'axios', 'zustand'],
        },
      },
    },
  },
  server: {
    port: 5175,
    host: true
  }
})
