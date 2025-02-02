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
  build: {
    rollupOptions: {
      // ... other options
    },
    outDir: 'dist',
    emptyOutDir: true
  },
  server: {
    port: 3000, // Choose a different port
  },
});