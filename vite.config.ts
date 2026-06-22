import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vite';

export default defineConfig(() => {
  // CAPACITOR_BUILD=true  → relative paths for Android/iOS WebView
  // GITHUB_ACTIONS=true   → /Laboratory-/ for GitHub Pages
  // default               → / for local dev & web server
  const isCapacitor = process.env.CAPACITOR_BUILD === 'true';
  const isGHPages   = !isCapacitor && process.env.GITHUB_ACTIONS === 'true';
  const base = isCapacitor ? './' : isGHPages ? '/Laboratory-/' : '/';

  return {
    base,
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      hmr: process.env.DISABLE_HMR !== 'true',
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
