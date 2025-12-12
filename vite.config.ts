import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'build',
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom', '@supabase/supabase-js', 'lucide-react'],
          ai: ['@google/genai']
        }
      }
    }
  },
  define: {
    // Polyfill for simple process.env usage if needed, though import.meta.env is preferred in Vite
    'process.env': {}
  }
});