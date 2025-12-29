# T7TFOS Photography Portfolio

Astro-based photography portfolio built for Cloudflare Pages with R2-generated albums.

## Quick start

```bash
npm install
npm run dev
```

## Structure

- `scripts/generate-albums-from-r2.mjs` - build-time generator that pulls album data from R2
- `src/data/albums.generated.json` - generated album metadata and image keys
- `src/utils/cfImages.ts` - helper for building R2 URLs and Cloudflare Image Transformations URLs
- `src/pages/albums/[slug].astro` - dynamic album detail route

## How albums are generated from R2

The build step runs `scripts/generate-albums-from-r2.mjs`, which lists objects in R2 under `albums/` and writes
`src/data/albums.generated.json`.

If the required environment variables are missing, the script will reuse the existing
`src/data/albums.generated.json` file (when present) for **local** builds. Cloudflare Pages
builds must have the env vars set, otherwise the build fails to avoid shipping stale data.

Required environment variables (set in Cloudflare Pages):

- `R2_ACCOUNT_ID`
- `R2_ACCESS_KEY_ID`
- `R2_SECRET_ACCESS_KEY`
- `R2_BUCKET_NAME`
- `R2_PUBLIC_BASE_URL`

### Required R2 folder structure

```
albums/<album-folder>/<image files>
```

Example:

```
albums/2020-10-04-Banisuef/DSC_3687.jpg
albums/2020-10-04-Banisuef/DSC_3688.jpg
albums/2020-10-04-Banisuef/cover.jpg
```

**Case sensitivity matters.** Folder and file names are used exactly as stored in R2. Do not rename or slugify
when uploading content.

### Adding a new album

1. Upload a new folder to R2 at `albums/<album-folder>/` with image files.
2. (Optional) Add a `cover.*` image inside the folder to control the album cover.
3. Redeploy the site. The build will regenerate `src/data/albums.generated.json` automatically.

## Image hosting (Cloudflare R2)

Images are stored in Cloudflare R2 and served through a custom domain:

- **Bucket custom domain:** `https://img.t7tfos.com`
- **Object keys:** `albums/<album-folder>/<filename>.jpg`

## Image resizing (Cloudflare Image Transformations)

Cloudflare Image Transformations must be enabled for the custom domain. The site never stores multiple sizes
locally; it generates optimized URLs with the `/cdn-cgi/image/...` format via `cfImageUrl` in
`src/utils/cfImages.ts`.

Example:

```ts
cfImageUrl('albums/landscape/01.jpg', { width: 900, quality: 78 });
```

The helper:

- Defaults to `format=auto`, `quality=80`, `fit=scale-down` (prevents upscaling).
- Builds URLs in the `/cdn-cgi/image/<opts>/<path>` format.
- Uses `R2_PUBLIC_BASE_URL` as the base URL.

## Deployment

Cloudflare Pages will run `npm run build`, which executes the prebuild generator and keeps the output static.
