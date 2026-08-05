// @ts-check
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

const picomatchShim = fileURLToPath(new URL('./src/picomatch-shim.mjs', import.meta.url));
const eventEmitterShim = fileURLToPath(new URL('./src/eventemitter3-shim.mjs', import.meta.url));
const esbuildShim = fileURLToPath(new URL('./src/esbuild-shim.mjs', import.meta.url));

export default defineConfig({
  site: 'https://ranking-zodiacal.pages.dev',
  compressHTML: true,
  devToolbar: {
    enabled: false,
  },
  integrations: [sitemap()],
  vite: {
    resolve: {
      alias: {
        picomatch: picomatchShim,
        eventemitter3: eventEmitterShim,
        esbuild: esbuildShim,
      },
    },
  },
});
