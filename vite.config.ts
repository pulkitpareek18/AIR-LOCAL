import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => ({
  base: mode === 'github-pages' ? '/AirLocal/' : '/',
  plugins: [react()],
  build: {
    target: 'es2020',
  },
}));
