import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
// Base path for GitHub Pages:
// - If repo is 'username/datanexus-dashboard' and Pages serves from root: use '/'
// - If repo is in a subdirectory or Pages serves from subdirectory: use '/datanexus-dashboard/'
// Set GITHUB_PAGES_BASE env var to override (e.g., GITHUB_PAGES_BASE=/custom-path/)
const getBase = () => {
  if (process.env.GITHUB_PAGES_BASE) {
    return process.env.GITHUB_PAGES_BASE;
  }
  // Default: assume serving from repo root (most common case)
  return process.env.GITHUB_PAGES === 'true' ? '/' : '/';
};

export default defineConfig({
  plugins: [react()],
  base: getBase(),
  server: {
    // Only use proxy in local development (when VITE_API_BASE_URL is not set or is localhost)
    // In Codespaces, the frontend will use VITE_API_BASE_URL directly from .env
    proxy: process.env.VITE_API_BASE_URL && !process.env.VITE_API_BASE_URL.includes('localhost')
      ? {} // Disable proxy in Codespaces - use direct API calls
      : {
          '/api': {
            target: 'http://localhost:5002',
            changeOrigin: true,
          },
        },
  },
})
