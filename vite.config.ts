import { defineConfig } from 'vite';
import solidPlugin from 'vite-plugin-solid';
import Pages from 'vite-plugin-pages';
import devtools from 'solid-devtools/vite';
import path from 'path';

export default defineConfig({
  plugins: [
    devtools(),
    Pages({
      dirs: ['src/pages'],
    }),
    solidPlugin(),
  ],
  server: {
    port: 3001,
  },
  build: {
    target: 'esnext',
  },
  resolve: {
    alias: {
      '~': path.resolve(__dirname, './src'),
    }
  }
});
