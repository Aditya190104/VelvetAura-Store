import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
const proxy = { '/api': { target: 'http://127.0.0.1:4000', changeOrigin: true } };
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    strictPort: true,
    allowedHosts: ['terminal.local'],
    proxy,
  },
  // Keep preview on the same origin allowed by the existing Express API.
  preview: { port: 5173, strictPort: true, proxy },
});
