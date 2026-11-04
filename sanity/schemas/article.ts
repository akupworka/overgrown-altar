// An article: a dispatch (The Watchtower), a work from The Hearth, or a protocol (The Perimeter).
// The tabs match your design: Write · Placement · Editorial Matrix · Search & sharing.
import { defineArrayMember, defineField, defineType } from 'sanity';

export const PILLARS = [
  { title: 'The Watchtower', value: 'watchtower' },
  { title: 'The Hearth', value: 'hearth' },
  { title: 'The Perimeter', value: 'perimeter' },
];
export const MEDIUMS = [
  { title: 'Essay', value: 'essay' },
  { title: 'Photograph', value: 'photograph' },
  { title: 'Prose', value: 'prose' },
  { title: 'Fiction', value: 'fiction' },
  { title: 'Architectural study', value: 'study' },
  { title: 'Design teardown', value: 'teardown' },
  { title: 'Protocol', value: 'protocol' },
];
export const THINKERS = [
  { title: 'Nietzsche', value: 'nietzsche' },
  { title: 'Jung', value: 'jung' },
  { title: 'Freud', value: 'freud' },
  { title: 'Bukowski', value: 'bukowski' },
  { title: 'Newton', value: 'newton' },
  { title: 'Quantum', value: 'quantum' },
];

// The pieces you can insert into the body from the + menu.
const scripture = defineArrayMember({
  name: 'scripture', title: 'Scripture', type: 'object',
  fields: [
    defineField({ name: 'text', type: 'text', rows: 3, validation: (r) => r.required() }),
    defineField({ name: 'reference', type: 'string', description: 'e.g. Galatians ii · xx' }),
  ],
  preview: { select: { title: 'text', subtitle: 'reference' }, prepare: (s) => ({ ...s, title: `✝ ${s.title ?? ''}` }) },
});
const pullQuote = defineArrayMember({
  name: 'pullQuote', title: 'Pull quote', type: 'object',
  fields: [defineField({ name: 'text', type: 'text', rows: 2, validation: (r) => r.required() })],
  preview: { select: { title: 'text' }, prepare: ({ title }) => ({ title: `“${title ?? ''}”`, subtitle: 'Pull quote' }) },
});
const plate = defineArrayMember({
  name: 'plate', title: 'Plate (photograph)', type: 'image', options: { hotspot: true },
  fields: [
    defineField({ name: 'alt', title: 'Describe the photograph', type: 'string', validation: (r) => r.required() }),
    defineField({ name: 'shape', type: 'string', initialValue: 'arch',
      options: { list: [{ title: 'Arch', value: 'arch' }, { title: 'Full width', value: 'full' }], layout: 'radio', direction: 'horizontal' } }),
  ],
});
const crossDivider = defineArrayMember({
  name: 'crossDivider', title: 'Cross divider', type: 'object',
  fields: [defineField({ name: 'note', type: 'string', hidden: true })],
  preview: { prepare: () => ({ title: '—— ✝ ——', subtitle: 'Cross divider' }) },
});
const protocolStep = defineArrayMember({
  name: 'protocolStep', title: 'Protocol step', type: 'object',
  fields: [
    defineField({ name: 'title', type: 'string', validation: (r) => r.required() }),
    defineField({ name: 'intro', type: 'text', rows: 3 }),
    defineField({ name: 'checklist', type: 'array', of: [{ type: 'string' }] }),
    defineField({ name: 'scripture', type: 'string', description: 'The verse, then · and the reference' }),
  ],
  preview: { select: { title: 'title' }, prepare: ({ title }) => ({ title: `Step · ${title ?? ''}` }) },
});

export const article = defineType({
  name: 'article',
  title: 'Article',
  type: 'document',
  groups: [
    { name: 'write', title: 'Write', default: true },
    { name: 'placement', title: 'Placement' },
    { name: 'matrix', title: 'Editorial Matrix' },
    { name: 'seo', title: 'Search & sharing' },
  ],
  fields: [
    // ---- Write ----
    defineField({ name: 'title', type: 'string', group: 'write', validation: (r) => r.required() }),
    defineField({ name: 'standfirst', type: 'text', rows: 3, group: 'write',
      description: 'One or two sentences under the title, also shown on lists.' }),
    defineField({ name: 'featuredImage', title: 'Featured photograph', type: 'image', group: 'write', options: { hotspot: true },
      fields: [defineField({ name: 'alt', title: 'Describe the photograph', type: 'string' })] }),
    defineField({
      name: 'body', type: 'array', group: 'write',
      of: [
        defineArrayMember({
          type: 'block',
          styles: [
            { title: 'Paragraph', value: 'normal' },
            { title: 'Section heading', value: 'h2' },
            { title: 'Lede (large opening paragraph)', value: 'lede' },
          ],
          lists: [{ title: 'Bullets', value: 'bullet' }, { title: 'Numbers', value: 'number' }],
          marks: {
            decorators: [{ title: 'Italic', value: 'em' }, { title: 'Bold', value: 'strong' }],
            annotations: [{ name: 'link', type: 'object', title: 'Link',
              fields: [defineField({ name: 'href', type: 'url', validation: (r) => r.uri({ allowRelative: true, scheme: ['http', 'https', 'mailto'] }) })] }],
          },
        }),
        scripture, pullQuote, plate, crossDivider, protocolStep,
      ],
    }),
    defineField({ name: 'author', type: 'reference', to: [{ type: 'author' }], group: 'write' }),
    defineField({ name: 'signed', title: 'Sign with the author’s first name in script', type: 'boolean', initialValue: true, group: 'write' }),

    // ---- Placement ----
    defineField({ name: 'pillar', type: 'string', group: 'placement', options: { list: PILLARS, layout: 'radio' }, validation: (r) => r.required() }),
    defineField({ name: 'medium', type: 'string', group: 'placement', options: { list: MEDIUMS }, validation: (r) => r.required() }),
    defineField({ name: 'slug', title: 'Permanent address', type: 'slug', group: 'placement',
      description: 'Made from the title. Once published, leave it alone so links never break.',
      options: { source: 'title', maxLength: 60 }, validation: (r) => r.required() }),
    defineField({ name: 'number', type: 'number', group: 'placement',
      description: 'Dispatch 1, 2, 3… or Protocol I, II, III… Sets the order in lists.' }),
    defineField({ name: 'publishedAt', title: 'Date', type: 'datetime', group: 'placement', initialValue: () => new Date().toISOString() }),
    defineField({ name: 'thinkers', type: 'array', group: 'placement', of: [{ type: 'string' }],
      options: { list: THINKERS, layout: 'grid' }, description: 'Used by the Archive filters.' }),

    // ---- Editorial Matrix ----
    defineField({ name: 'inMatrix', title: 'Show in the Editorial Matrix', type: 'boolean', initialValue: false, group: 'matrix' }),
    defineField({ name: 'matrixThinker', title: 'Secular thinker / system', type: 'string', group: 'matrix', hidden: ({ document }) => !document?.inMatrix }),
    defineField({ name: 'matrixFracture', title: 'The fracture point', type: 'string', group: 'matrix', hidden: ({ document }) => !document?.inMatrix }),
    defineField({ name: 'matrixAnchor', title: 'The biblical anchor', type: 'string', group: 'matrix', hidden: ({ document }) => !document?.inMatrix }),

    // ---- Search & sharing ----
    defineField({ name: 'seoDescription', title: 'Description for search and sharing', type: 'text', rows: 2, group: 'seo',
      description: 'About 150 characters. Leave empty to use the standfirst.', validation: (r) => r.max(200) }),
  ],
  orderings: [{ title: 'Number', name: 'number', by: [{ field: 'number', direction: 'asc' }] }],
  preview: {
    select: { title: 'title', pillar: 'pillar', number: 'number', media: 'featuredImage' },
    prepare: ({ title, pillar, number, media }) => ({
      title, media,
      subtitle: [PILLARS.find((p) => p.value === pillar)?.title, number && `No. ${number}`].filter(Boolean).join(' · '),
    }),
  },
});
