// A writer. Each article points to one.
import { defineField, defineType } from 'sanity';

export const author = defineType({
  name: 'author',
  title: 'Author',
  type: 'document',
  fields: [
    defineField({ name: 'name', type: 'string', validation: (r) => r.required() }),
    defineField({ name: 'slug', type: 'slug', options: { source: 'name' } }),
    defineField({ name: 'craft', type: 'string', description: 'e.g. Essayist · Photographer' }),
    defineField({ name: 'portrait', type: 'image', options: { hotspot: true } }),
    defineField({ name: 'bio', title: 'About the author', type: 'text', rows: 4 }),
  ],
  preview: { select: { title: 'name', subtitle: 'craft', media: 'portrait' } },
});
