import { defineConfig } from 'vite';

export default defineConfig({
  root: 'public',
  server: {
    port: 3000,
    // Перенаправляем все запросы на index.html для SPA роутинга
    historyApiFallback: true,
  },
  build: {
    outDir: '../dist',
    emptyOutDir: true,
    rollupOptions: {
      external: [],
    },
  },
});
