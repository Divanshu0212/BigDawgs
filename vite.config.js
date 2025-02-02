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
  optimizeDeps: {
    include: [
      '@mui/material',
      '@emotion/react',
      '@emotion/styled',
      '@mui/icons-material', // Include if you're using MUI icons
      // Add any other MUI-related packages you are using here.
    ],
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          // Split node_modules into a separate chunk
          if (id.includes('node_modules')) {
            return 'vendor';
          }
        }
      }
    },
    // Or increase the warning limit if needed
    chunkSizeWarningLimit: 1000
  }
});