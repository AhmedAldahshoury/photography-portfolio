type CfImageOptions = {
  width: number;
  quality?: number;
  format?: string;
};

const DEFAULT_QUALITY = 80;
const DEFAULT_FORMAT = 'auto';
const DEFAULT_FIT = 'scale-down';
const R2_PUBLIC_BASE_URL = 'https://img.t7tfos.com';

const normalizeKey = (key: string): string => key.replace(/^\//, '');

export const r2Url = (key: string): string => {
  if (!key) {
    return '';
  }

  return `${R2_PUBLIC_BASE_URL}/${normalizeKey(key)}`;
};

export const cfImageUrl = (key: string, options: CfImageOptions): string => {
  if (!key) {
    return '';
  }

  const { width, quality = DEFAULT_QUALITY, format = DEFAULT_FORMAT } = options ?? {};

  if (!width) {
    throw new Error('cfImageUrl requires a width option.');
  }

  const transform = `width=${width},quality=${quality},format=${format},fit=${DEFAULT_FIT}`;
  return `${R2_PUBLIC_BASE_URL}/cdn-cgi/image/${transform}/${normalizeKey(key)}`;
};
