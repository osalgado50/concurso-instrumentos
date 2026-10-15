import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

// base './' para que funcione en GitHub Pages (/concurso-instrumentos/)
export default defineConfig({
  plugins: [react(), tailwindcss()],
  base: './',
});
