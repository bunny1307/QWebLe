import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig } from 'vite';

export default defineConfig(() => {
  return {
    plugins: [
      react(),
      tailwindcss(),
    ],

    resolve: {
      alias: {
        '@': path.resolve(
          __dirname,
          '.'
        ),
      },
    },

    server: {
      // HMR
      hmr:
        process.env.DISABLE_HMR !== 'true',

      // File watching
      watch:
        process.env.DISABLE_HMR === 'true'
          ? null
          : {},

      // Flask API
      proxy: {
        '/api': {
          target:
            'http://127.0.0.1:5000',

          changeOrigin: true,
        },
        '/media': {
          target:
            'http://127.0.0.1:5000',

          changeOrigin: true,
        },
      },
    },
  };
});