import { S3Client, ListObjectsV2Command } from '@aws-sdk/client-s3';
import { writeFile } from 'node:fs/promises';
import path from 'node:path';

const REQUIRED_ENV_VARS = [
  'R2_ACCOUNT_ID',
  'R2_ACCESS_KEY_ID',
  'R2_SECRET_ACCESS_KEY',
  'R2_BUCKET_NAME',
];

const missingVars = REQUIRED_ENV_VARS.filter((key) => !process.env[key]);
if (missingVars.length > 0) {
  throw new Error(`Missing required environment variables: ${missingVars.join(', ')}`);
}

const {
  R2_ACCOUNT_ID,
  R2_ACCESS_KEY_ID,
  R2_SECRET_ACCESS_KEY,
  R2_BUCKET_NAME,
} = process.env;

const client = new S3Client({
  region: 'auto',
  endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: R2_ACCESS_KEY_ID,
    secretAccessKey: R2_SECRET_ACCESS_KEY,
  },
});

const IMAGE_EXTENSIONS = new Set(['.jpg', '.jpeg', '.png', '.webp', '.avif']);
const ALBUM_PREFIX = 'albums/';

const isImageKey = (key) => {
  if (!key || key.endsWith('/')) {
    return false;
  }
  const ext = path.extname(key).toLowerCase();
  return IMAGE_EXTENSIONS.has(ext);
};

const toTitleCase = (slug) =>
  slug
    .replace(/[-_]/g, ' ')
    .split(' ')
    .filter(Boolean)
    .map((word) => {
      if (/^\d+$/.test(word)) {
        return word;
      }
      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    })
    .join(' ');

const extractDate = (slug) => {
  const match = slug.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!match) {
    return null;
  }
  return `${match[1]}-${match[2]}-${match[3]}`;
};

const listAllObjects = async () => {
  const keys = [];
  let continuationToken;

  do {
    const response = await client.send(
      new ListObjectsV2Command({
        Bucket: R2_BUCKET_NAME,
        Prefix: ALBUM_PREFIX,
        ContinuationToken: continuationToken,
      }),
    );

    const contents = response.Contents ?? [];
    for (const item of contents) {
      if (item.Key) {
        keys.push(item.Key);
      }
    }

    continuationToken = response.IsTruncated ? response.NextContinuationToken : undefined;
  } while (continuationToken);

  return keys;
};

const main = async () => {
  const keys = await listAllObjects();
  const albumMap = new Map();

  for (const key of keys) {
    if (!isImageKey(key) || !key.startsWith(ALBUM_PREFIX)) {
      continue;
    }

    const relative = key.slice(ALBUM_PREFIX.length);
    const [albumFolder] = relative.split('/');
    if (!albumFolder) {
      continue;
    }

    if (!albumMap.has(albumFolder)) {
      albumMap.set(albumFolder, []);
    }
    albumMap.get(albumFolder).push(key);
  }

  const albums = Array.from(albumMap.entries()).map(([slug, imageKeys]) => {
    const sorted = [...imageKeys].sort((a, b) => {
      const nameA = path.basename(a);
      const nameB = path.basename(b);
      return nameA.localeCompare(nameB, undefined, { numeric: true, sensitivity: 'base' });
    });

    const coverMatch = sorted.find((key) => /^cover\./i.test(path.basename(key)));

    return {
      slug,
      title: toTitleCase(slug),
      date: extractDate(slug),
      coverKey: coverMatch ?? sorted[0],
      imageKeys: sorted,
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
    return a.title.localeCompare(b.title);
  });

  const outputPath = new URL('../src/data/albums.generated.json', import.meta.url);
  await writeFile(outputPath, `${JSON.stringify(albums, null, 2)}\n`, 'utf-8');

  console.log(`Generated ${albums.length} album(s).`);
  for (const album of albums) {
    console.log(`- ${album.slug}: ${album.imageKeys.length} image(s)`);
  }
};

await main();
