import { mkdir, writeFile } from 'fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { ListObjectsV2Command, S3Client } from '@aws-sdk/client-s3';

const requiredEnv = [
  'R2_ACCOUNT_ID',
  'R2_ACCESS_KEY_ID',
  'R2_SECRET_ACCESS_KEY',
  'R2_BUCKET_NAME',
  'R2_PUBLIC_BASE_URL',
];

const missing = requiredEnv.filter((key) => !process.env[key]);
if (missing.length) {
  throw new Error(`Missing required env vars: ${missing.join(', ')}`);
}

const accountId = process.env.R2_ACCOUNT_ID;
const accessKeyId = process.env.R2_ACCESS_KEY_ID;
const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
const bucket = process.env.R2_BUCKET_NAME;
const baseUrl = process.env.R2_PUBLIC_BASE_URL.replace(/\/$/, '');

const client = new S3Client({
  region: 'auto',
  endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId,
    secretAccessKey,
  },
});

const imageExtensions = new Set(['.jpg', '.jpeg', '.png', '.webp', '.avif']);

const isImageKey = (key) => {
  if (!key || key.endsWith('/')) {
    return false;
  }

  const ext = path.posix.extname(key).toLowerCase();
  return imageExtensions.has(ext);
};

const listAllKeys = async () => {
  const keys = [];
  let continuationToken;

  do {
    const response = await client.send(
      new ListObjectsV2Command({
        Bucket: bucket,
        Prefix: 'albums/',
        ContinuationToken: continuationToken,
      }),
    );

    for (const item of response.Contents ?? []) {
      if (item.Key) {
        keys.push(item.Key);
      }
    }

    continuationToken = response.IsTruncated ? response.NextContinuationToken : undefined;
  } while (continuationToken);

  return keys;
};

const titleCase = (value) =>
  value
    .split(/\s+/)
    .map((word) => (word ? word[0].toUpperCase() + word.slice(1).toLowerCase() : ''))
    .join(' ')
    .trim();

const parseAlbumDate = (folder) => {
  const match = /^([0-9]{4})-([0-9]{2})-([0-9]{2})/.exec(folder);
  if (!match) {
    return null;
  }

  return `${match[1]}-${match[2]}-${match[3]}`;
};

const ensureBaseUrlIsValid = () => {
  if (!/^https?:\/\//i.test(baseUrl)) {
    throw new Error('R2_PUBLIC_BASE_URL must include protocol, e.g. https://img.t7tfos.com');
  }
};

const buildAlbums = (keys) => {
  const albumsMap = new Map();

  keys.filter(isImageKey).forEach((key) => {
    const relative = key.slice('albums/'.length);
    const [albumFolder, ...rest] = relative.split('/');

    if (!albumFolder || rest.length === 0) {
      return;
    }

    const album = albumsMap.get(albumFolder) ?? [];
    album.push(key);
    albumsMap.set(albumFolder, album);
  });

  const albums = Array.from(albumsMap.entries()).map(([folder, images]) => {
    const sorted = images.sort((a, b) => {
      const nameA = path.posix.basename(a);
      const nameB = path.posix.basename(b);
      return nameA.localeCompare(nameB, undefined, { numeric: true });
    });

    const coverCandidate = sorted.find((key) => {
      const name = path.posix.basename(key).toLowerCase();
      return /^cover\.(jpg|jpeg|png|webp|avif)$/.test(name);
    });

    const coverKey = coverCandidate ?? sorted[0];
    const imageKeys = sorted.filter((key) => {
      if (!coverCandidate) {
        return true;
      }
      return key !== coverCandidate;
    });

    const title = titleCase(folder.replace(/[-_]+/g, ' '));
    const date = parseAlbumDate(folder);

    return {
      slug: folder,
      title,
      date,
      coverKey,
      imageKeys,
    };
  });

  albums.sort((a, b) => {
    if (a.date && b.date) {
      return b.date.localeCompare(a.date);
    }

    if (a.date && !b.date) {
      return -1;
    }

    if (!a.date && b.date) {
      return 1;
    }

    return a.title.localeCompare(b.title, undefined, { numeric: true });
  });

  return albums;
};

const main = async () => {
  ensureBaseUrlIsValid();

  const keys = await listAllKeys();
  const albums = buildAlbums(keys);

  const outputDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', 'src', 'data');
  await mkdir(outputDir, { recursive: true });

  const outputPath = path.join(outputDir, 'albums.generated.json');
  await writeFile(outputPath, `${JSON.stringify(albums, null, 2)}\n`);

  console.log(`Generated ${albums.length} albums to ${outputPath}`);
};

main().catch((error) => {
  console.error('[generate-albums-from-r2]', error);
  process.exit(1);
});
