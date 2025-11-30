import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  // We removed the 'define' block because the API key is now only used 
  // on the backend (api/try-on.ts) and should NOT be exposed to the frontend.
});
