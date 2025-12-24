# T7TFOS Photography Portfolio

Astro-based photography portfolio built for Cloudflare Pages with JSON-driven albums.

## Quick start

```bash
npm install
npm run dev
```

## Structure

- `public/albums/{album-slug}/images` - album assets
- `src/data/albums.json` - album metadata and image lists
- `src/pages/albums/[slug].astro` - dynamic album detail route

## Deployment

Cloudflare Pages will use the Astro Cloudflare adapter with `output: 'static'`.
