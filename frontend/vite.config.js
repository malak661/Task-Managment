import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    // The api's CORS allow list expects the client on this port.
    port: 5173,
  },
});
