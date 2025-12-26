type ImageTransformOptions = {
  width?: number;
  quality?: number;
  format?: string;
  fit?: string;
};

const R2_BASE_URL = 'https://img.t7tfos.com';

export const buildImageUrl = (
  pathOrUrl: string,
  { width, quality = 80, format = 'auto', fit = 'scale-down' }: ImageTransformOptions = {},
): string => {
  if (!pathOrUrl) {
    return '';
  }

  const isAbsolute = /^https?:\/\//i.test(pathOrUrl);
  const url = isAbsolute
    ? new URL(pathOrUrl)
    : new URL(pathOrUrl.startsWith('/') ? pathOrUrl : `/${pathOrUrl}`, R2_BASE_URL);

  if (width) {
    url.searchParams.set('width', width.toString());
  }
  if (quality) {
    url.searchParams.set('quality', quality.toString());
  }
  if (format) {
    url.searchParams.set('format', format);
  }
  if (fit) {
    url.searchParams.set('fit', fit);
  }

  return url.toString();
};
