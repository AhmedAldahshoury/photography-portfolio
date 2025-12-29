type TransformFormat = 'auto' | 'webp' | 'avif' | 'jpeg';
type TransformFit = 'scale-down' | 'contain';

type ImageTransformOptions = {
  width: number;
  quality?: number;
  format?: TransformFormat;
  fit?: TransformFit;
};

const DEFAULT_BASE_URL = 'https://img.t7tfos.com';

const getBaseUrl = () => (process.env.R2_PUBLIC_BASE_URL || DEFAULT_BASE_URL).replace(/\/+$/, '');

const normalizeKey = (key: string) => key.replace(/^\/+/, '');

export const r2Url = (key: string): string => {
  if (!key) {
    return '';
  }

  return `${getBaseUrl()}/${normalizeKey(key)}`;
};

export const cfImageUrl = (
  key: string,
  { width, quality = 80, format = 'auto', fit = 'scale-down' }: ImageTransformOptions,
): string => {
  if (!key) {
    return '';
  }

  const normalizedKey = normalizeKey(key);
  const baseUrl = getBaseUrl();
  const options = [`width=${width}`, `quality=${quality}`, `format=${format}`, `fit=${fit}`].join(',');

  return `${baseUrl}/cdn-cgi/image/${options}/${normalizedKey}`;
};
