import { promises as fs } from 'node:fs';
import { join, relative } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { parseFrontmatter } from '@astrojs/internal-helpers/frontmatter';
import { defineCollection } from 'astro:content';
import { z } from 'astro/zod';

const signSlugs = [
  'aries',
  'tauro',
  'geminis',
  'cancer',
  'leo',
  'virgo',
  'libra',
  'escorpio',
  'sagitario',
  'capricornio',
  'acuario',
  'piscis',
] as const;

const status = z.enum(['draft', 'published']);
const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Usa una fecha ISO: AAAA-MM-DD');

function markdownDirectoryLoader(directory: string) {
  return {
    name: `markdown-directory:${directory}`,
    async load({ config, logger, parseData, renderMarkdown, store, generateDigest, watcher }: any) {
      const directoryUrl = new URL(directory, config.root);
      const directoryPath = fileURLToPath(directoryUrl);
      const files = (await fs.readdir(directoryPath, { withFileTypes: true }))
        .filter((entry) => entry.isFile() && entry.name.endsWith('.md'))
        .map((entry) => entry.name)
        .sort();

      store.clear();
      watcher?.add(directoryPath);

      for (const fileName of files) {
        const filePath = join(directoryPath, fileName);
        const source = await fs.readFile(filePath, 'utf8');
        const { frontmatter, content: body } = parseFrontmatter(source);
        const id = fileName.replace(/\.md$/, '');
        const data = await parseData({ id, data: frontmatter, filePath });
        const rendered = await renderMarkdown(body, { fileURL: pathToFileURL(filePath) });
        const relativePath = relative(fileURLToPath(config.root), filePath).replaceAll('\\\\', '/');

        store.set({
          id,
          data,
          body,
          filePath: relativePath,
          digest: generateDigest(source),
          rendered,
          assetImports: rendered.metadata?.imagePaths,
        });
      }

      logger.debug(`Loaded ${files.length} Markdown files from ${directory}`);
    },
  };
}

const weeks = defineCollection({
  loader: markdownDirectoryLoader('./src/content/weeks'),
  schema: z.object({
    weekStart: isoDate,
    weekEnd: isoDate,
    status,
    title: z.string().min(1),
    intro: z.string().min(40),
    theme: z.string().min(1),
  }),
});

const horoscopes = defineCollection({
  loader: markdownDirectoryLoader('./src/content/horoscopes'),
  schema: z.object({
    weekStart: isoDate,
    weekEnd: isoDate,
    status,
    sign: z.enum(signSlugs),
    rank: z.number().int().min(1).max(12),
    summary: z.string().min(30),
  }),
});

export const collections = { weeks, horoscopes };
