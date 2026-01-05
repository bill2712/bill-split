import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  // IMPORTANT: This sets the base path for your app.
  // Because you are deploying to https://bill2712.github.io/bill-split/
  // we must tell Vite that the app lives at '/bill-split/'.
  base: '/bill-split/',
});