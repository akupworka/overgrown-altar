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
                .defaultOrdering([{ field: 'publishedAt', direction: 'desc' }]),
            ),
          ),
          S.divider(),
          S.documentTypeListItem('article').title('All articles'),
          S.documentTypeListItem('author').title('Authors'),
        ]),
    }),
  ],
});
