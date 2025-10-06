import glsl from 'vite-plugin-glsl';
import { defineConfig } from 'vite';
import { resolve } from 'path';

export default {
  plugins: [glsl()],
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        simulation: resolve(__dirname, 'simulation/simple/index.html')
      }
    }
  }
};