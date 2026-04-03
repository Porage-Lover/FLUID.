import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    modulePreload: false,
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('three') || id.includes('shaders')) return 'engine';
            if (id.includes('framer-motion') || id.includes('lucide-react') || id.includes('recharts')) return 'ui';
            return 'vendor';
          }
        }
      }
    }
  }
})
