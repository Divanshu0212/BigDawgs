import { defineConfig } from 'vite';
import tailwindcss from '@tailwindcss/vite';
import { resolve } from 'path';

export default defineConfig({
  plugins: [tailwindcss()],
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
    },
  },
  server: {
    proxy: {
      '/api/steam': require('./proxy.js'),
    },
  },
  build: {
    rollupOptions: {
      // ... other options
    },
    outDir: 'dist',
    emptyOutDir: true
  },
});