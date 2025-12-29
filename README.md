# T7TFOS Photography Portfolio

Astro-based photography portfolio built for Cloudflare Pages with R2-driven, build-time albums.

## Quick start

```bash
npm install
npm run dev
```

## R2 album structure

Albums live in Cloudflare R2 under the `albums/` prefix and are **case-sensitive**.
Do **not** slugify or change casing when naming folders or files.

```
albums/
  <album-folder>/
    cover.jpg (optional)
    DSC_0001.jpg
    DSC_0002.jpg
```

## Automatic album generation

Albums are generated at **build time** by `scripts/generate-albums-from-r2.mjs` using the AWS SDK v3.
The script:

- Lists every object under `albums/` in R2.
- Groups images by folder.
- Picks `cover.*` as the cover when present (case-insensitive).
- Sorts images by filename (numeric ordering).
- Writes `src/data/albums.generated.json` for the site to consume.

Cloudflare Pages runs this automatically via:

```
"prebuild": "node scripts/generate-albums-from-r2.mjs"
```

### Required environment variables

Provide these variables in Cloudflare Pages (names only):

- `R2_ACCOUNT_ID`
- `R2_ACCESS_KEY_ID`
- `R2_SECRET_ACCESS_KEY`
- `R2_BUCKET_NAME`
- `R2_PUBLIC_BASE_URL`

## Adding a new album

1. Upload a new folder to R2 at `albums/<album-folder>/`.
2. Include a `cover.*` image if you want a specific cover.
3. Trigger a Cloudflare Pages deploy. The build will regenerate albums automatically.

## Cloudflare Image Transformations

Images are served from `https://img.t7tfos.com` with Cloudflare Image Transformations enabled.
The site uses `src/utils/cfImages.ts` to generate transformation URLs with the
`/cdn-cgi/image/` path format (no query params).

Example:

```ts
cfImageUrl('albums/landscape/01.jpg', { width: 900, quality: 78 });
```

Notes:

- `fit=scale-down` is always applied to avoid upscaling.
- The output remains fully static (Astro default output) with no runtime API calls.
