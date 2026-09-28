import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173
  },
  build: {
    target: 'es2020',
    chunkSizeWarningLimit: 600,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes('node_modules')) return;

          if (/node_modules\/(react|react-dom|react-router|react-router-dom|scheduler)\//.test(id)) {
            return 'vendor';
          }
          if (id.includes('socket.io-client') || id.includes('engine.io-client')) {
            return 'socket';
          }
          if (id.includes('lucide-react')) {
            return 'icons';
          }
        }
      }
    }
  }
});