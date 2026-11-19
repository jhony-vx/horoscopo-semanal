// @ts-check
import { defineConfig, fontProviders } from 'astro/config';
import sitemap, { ChangeFreqEnum } from '@astrojs/sitemap';

const LATIN = 'U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+0304, U+0308, U+0329, U+2000-206F, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215, U+FEFF, U+FFFD';

export default defineConfig({
  site: 'https://horoscopo-semanal.pages.dev',
  compressHTML: true,
  devToolbar: {
    enabled: false,
  },
  // Links are prefetched on hover, so moving between signs feels instant.
  prefetch: {
    prefetchAll: true,
    defaultStrategy: 'hover',
  },
  // One variable file per family, latin subset only: Spanish needs nothing else.
  fonts: [
    {
      provider: fontProviders.local(),
      name: 'DM Sans',
      cssVariable: '--font-dm-sans',
      fallbacks: ['system-ui', 'sans-serif'],
      options: {
        variants: [{ src: ['@fontsource-variable/dm-sans/files/dm-sans-latin-wght-normal.woff2'], weight: '100 1000', style: 'normal', unicodeRange: [LATIN] }],
      },
    },
    {
      provider: fontProviders.local(),
      name: 'Playfair Display',
      cssVariable: '--font-playfair',
      fallbacks: ['Georgia', 'serif'],
      options: {
        variants: [{ src: ['@fontsource-variable/playfair-display/files/playfair-display-latin-wght-normal.woff2'], weight: '400 900', style: 'normal', unicodeRange: [LATIN] }],
      },
    },
  ],
  integrations: [
    sitemap({
      filter: (page) => !page.includes('/404'),
      serialize: (item) => ({ ...item, lastmod: new Date().toISOString(), changefreq: ChangeFreqEnum.DAILY }),
    }),
  ],
});
