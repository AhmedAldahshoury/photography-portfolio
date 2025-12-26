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

## Image performance tips

R2 serves original files by default. To deliver smaller variants, enable Cloudflare Image Resizing or place a
Worker in front of the R2 bucket to generate resized versions (e.g., width/quality/format). Once enabled,
you can append transformation query parameters to your R2 URLs for faster loading.
