import { defineConfig } from 'astro/config';
import cloudflare from '@astrojs/cloudflare';

export default defineConfig({
  site: 'https://t7tfos.com',
  output: 'static',
  // Cloudflare Pages adapter for static builds.
  adapter: cloudflare(),
});
