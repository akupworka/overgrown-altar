// Loads the design's sample articles into your Sanity project. Run it once:
//
//   SANITY_WRITE_TOKEN=<an Editor token> npm run seed
//
// Running it again replaces those sample articles with fresh copies (your other articles are untouched).
// For offline testing it can instead write the content to a file:  node scripts/seed.mjs --fixture out.json
import { createClient } from '@sanity/client';
import { readFile, writeFile } from 'node:fs/promises';
import { projectId, dataset, apiVersion } from '../sanity/env.js';
import { author, articles } from './seed-data.mjs';

const fixtureIdx = process.argv.indexOf('--fixture');
const fixture = fixtureIdx > -1 ? process.argv[fixtureIdx + 1] : null;
const token = process.env.SANITY_WRITE_TOKEN;
if (!fixture && !token) {
  console.error('Missing SANITY_WRITE_TOKEN. Create an Editor token at https://www.sanity.io/manage → your project → API → Tokens.');
  process.exit(1);
}
const client = fixture ? null : createClient({ projectId, dataset, apiVersion, token, useCdn: false });

// Upload each photo once, remember its asset id.
const assets = new Map();
const fixtureAssets = [];
async function image(file) {
  if (!assets.has(file)) {
    if (fixture) {
      const id = `image-${file.replace(/\W/g, '')}-2000x1333-jpg`;
      fixtureAssets.push({ _id: id, _type: 'sanity.imageAsset', url: `/images/${file}`, originalFilename: file });
      assets.set(file, id);
    } else {
      process.stdout.write(`  uploading ${file}… `);
      const asset = await client.assets.upload('image', await readFile(new URL(`../public/images/${file}`, import.meta.url)), { filename: file });
      assets.set(file, asset._id);
      console.log('done');
    }
  }
  return { _type: 'reference', _ref: assets.get(file) };
}

const docs = [author];
for (const { image: img, body, slug, ...rest } of articles) {
  const doc = {
    ...rest,
    slug: { _type: 'slug', current: slug },
    author: { _type: 'reference', _ref: author._id },
    featuredImage: img ? { _type: 'image', alt: img[1], asset: await image(img[0]) } : undefined,
    // A placeholder body for articles the design only lists: replace it in the Studio.
    body: body ?? [{ _type: 'block', _key: 'p0', style: 'normal', markDefs: [], children: [{ _type: 'span', _key: 's0', text: rest.standfirst, marks: [] }] }],
  };
  for (const block of doc.body) {
    if (block._type === 'plate') {
      block.asset = await image(block.file);
      delete block.file;
    }
  }
  docs.push(doc);
}

if (fixture) {
  await writeFile(fixture, JSON.stringify([...fixtureAssets, ...docs], null, 1));
  console.log(`Wrote ${docs.length} documents to ${fixture}`);
} else {
  const tx = client.transaction();
  docs.forEach((d) => tx.createOrReplace(d));
  await tx.commit();
  console.log(`Seeded ${docs.length - 1} articles and 1 author. Open /studio to see them.`);
}
