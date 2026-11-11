// Astro's settings file.
import { defineConfig } from 'astro/config';
import react from '@astrojs/react';

export default defineConfig({
  site: 'https://overgrownaltar.com',
  integrations: [
    react(), // the Guild's Desk, forum and inbox are built with React
  ],
});
