# T7TFOS Photography Portfolio

Astro-based photography portfolio built for Cloudflare Pages with JSON-driven albums.

## Quick start

```bash
npm install
npm run dev
```

## Structure

- `src/data/albums.json` - album metadata and image lists (R2 object paths or full URLs without query params)
- `src/utils/imageUrl.ts` - helper for building Cloudflare Image Transformation URLs
- `src/pages/albums/[slug].astro` - dynamic album detail route

## Deployment

Cloudflare Pages will use the Astro Cloudflare adapter with `output: 'static'`.

## Image hosting (Cloudflare R2)

Images are stored in Cloudflare R2 and served through a custom domain:

- **Bucket custom domain:** `https://img.t7tfos.com`
- **Object keys:** `/albums/<album-slug>/<filename>.jpg`

To add a new album:

1. Upload a folder to R2 at `albums/<album-slug>/`.
2. Update `src/data/albums.json` with the album metadata and image paths. Use either:
   - A full URL without query params (e.g. `https://img.t7tfos.com/albums/.../image.jpg`), or
   - An object path (e.g. `/albums/<album-slug>/image.jpg`).

## Image resizing (Cloudflare Image Transformations)

Cloudflare Image Transformations must be enabled for the custom domain. The site never stores multiple sizes
locally; it generates optimized URLs at runtime using `buildImageUrl` in `src/utils/imageUrl.ts`.

Example:

```ts
buildImageUrl('/albums/landscape/01.jpg', { width: 900, quality: 78 });
```

The helper:

- Defaults to `format=auto`, `quality=80`, `fit=scale-down` (prevents upscaling).
- Accepts both relative object paths and full URLs.
- Appends/overwrites query params without duplicating `?` or `&`.
