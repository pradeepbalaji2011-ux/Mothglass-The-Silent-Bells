import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  base: '/Mothglass-The-Silent-Bells/',
  plugins: [react(), tailwindcss()],
  server: {
    host: '0.0.0.0',
    watch: { ignored: ['**/output/**', '**/.playwright-cli/**', '**/scripts/**', '**/*.test.js'] },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'world-graphics': ['three'],
          'react-runtime': ['react', 'react-dom'],
        },
      },
    },
  },
});
