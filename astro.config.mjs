// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  site: 'https://horoscopo-semanal.pages.dev',
  compressHTML: true,
  devToolbar: {
    enabled: false,
  },
  integrations: [sitemap()],
});
