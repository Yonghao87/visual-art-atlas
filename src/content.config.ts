import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { entrySchema } from './lib/schema';
export const collections = {
  entries: defineCollection({
    loader: glob({
      pattern: '*.json',
      base: './src/data/entries',
      generateId: ({ data }) => String(data.id),
    }),
    schema: entrySchema,
  }),
};
