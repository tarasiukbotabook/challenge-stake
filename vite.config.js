import { defineConfig } from 'vite';

export default defineConfig({
  root: 'public',
  server: {
    port: 3000,
    historyApiFallback: true,
  },
  build: {
    outDir: '../dist',
    emptyOutDir: true,
    rollupOptions: {
      input: {
        main: 'public/index.html',
        admin: 'public/admin.html',
        landing: 'public/landing.html',
      },
      external: [],
    },
  },
});
