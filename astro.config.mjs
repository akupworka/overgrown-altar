// Astro's settings file.
import { defineConfig } from 'astro/config';
import sanity from '@sanity/astro';
import react from '@astrojs/react';

export default defineConfig({
  site: 'https://overgrownaltar.com',
  integrations: [
    // Connects the site to your Sanity project, and puts the Studio at /studio.
    sanity({
      projectId: '4agnfn5q',
      dataset: 'production',
      apiVersion: '2025-01-01',
      useCdn: false, // the site is built ahead of time, so always read the freshest content
      studioBasePath: '/studio',
    }),
    react(), // the Studio is built with React
  ],
});
