import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    proxy: {
      '/auth': 'http://localhost:8000',
      '/me': 'http://localhost:8000',
      '/syllabus': 'http://localhost:8000',
      '/notes': 'http://localhost:8000',
      '/tutor': 'http://localhost:8000',
      '/quiz': 'http://localhost:8000',
    },
  },
});
