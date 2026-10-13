import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => ({
  base: mode === 'github-pages' ? '/AIR-LOCAL/' : '/',
  plugins: [react()],
  build: {
    target: 'es2020',
  },
}));
