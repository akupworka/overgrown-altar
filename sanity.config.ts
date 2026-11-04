// Your Studio: the editor at overgrownaltar.com/studio.
import { defineConfig } from 'sanity';
import { structureTool } from 'sanity/structure';
import { projectId, dataset } from './sanity/env.js';
import { article } from './sanity/schemas/article';
import { author } from './sanity/schemas/author';

export default defineConfig({
  name: 'overgrown-altar',
  title: 'Overgrown Altar',
  projectId,
  dataset,
  schema: { types: [article, author] },
  plugins: [
    structureTool({
      // The left-hand menu, organised like your design: one list per pillar.
      structure: (S) =>
        S.list().title('Overgrown Altar').items([
          ...[
            ['watchtower', 'The Watchtower'],
            ['hearth', 'The Hearth'],
            ['perimeter', 'The Perimeter'],
          ].map(([value, title]) =>
            S.listItem().title(title).id(value).child(
              S.documentList().title(title).schemaType('article').apiVersion('2025-01-01')
                .filter('_type == "article" && pillar == $pillar').params({ pillar: value })
                .defaultOrdering([{ field: 'number', direction: 'asc' }])
                .initialValueTemplates([S.initialValueTemplateItem('article-in-pillar', { pillar: value })]),
            ),
          ),
          S.divider(),
          S.documentTypeListItem('article').title('All articles'),
          S.documentTypeListItem('author').title('Authors'),
        ]),
    }),
  ],
  document: {
    // Lets "new article" inside a pillar list start with that pillar already chosen.
    newDocumentOptions: (prev) => prev.filter((t) => t.templateId !== 'article-in-pillar'),
  },
  templates: (prev) => [
    ...prev,
    { id: 'article-in-pillar', title: 'Article in pillar', schemaType: 'article',
      parameters: [{ name: 'pillar', type: 'string' }],
      value: (p: { pillar: string }) => ({ pillar: p.pillar, medium: p.pillar === 'perimeter' ? 'protocol' : p.pillar === 'watchtower' ? 'essay' : undefined }) },
  ],
});
