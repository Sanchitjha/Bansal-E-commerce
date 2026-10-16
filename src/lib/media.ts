// Safe for both server and client. Only Cloudinary links are rewritten; any other link is returned with proper encoding.

const CLOUDINARY_UPLOAD = /^(https:\/\/res\.cloudinary\.com\/[^/]+\/(?:image|video)\/upload\/)(.+)$/;

export const PLACEHOLDER_PRODUCT_IMAGE =
  'https://res.cloudinary.com/wu9kqgfs/image/upload/v1791381611/luminary/products/fragrance-land-100ml-1.jpg';

/** Serves a right-sized image in a modern format (WebP/AVIF) and sensible quality. */
export function optimizeImage(url?: string | null, width = 800): string {
  if (!url || typeof url !== 'string' || !url.trim()) return PLACEHOLDER_PRODUCT_IMAGE;
  const cleanUrl = url.trim();
  const m = CLOUDINARY_UPLOAD.exec(cleanUrl);
  if (!m || m[1].includes('/video/')) {
    if (cleanUrl.startsWith('/')) {
      try {
        return encodeURI(decodeURI(cleanUrl));
      } catch {
        return cleanUrl;
      }
    }
    return cleanUrl;
  }
  // Skip if the link already carries its own transformation.
  if (/^(?:[a-z]{1,3}_[^/]+,?)+\//.test(m[2])) return cleanUrl;
  return `${m[1]}f_auto,q_auto,c_limit,w_${width}/${m[2]}`;
}

/** A still frame to show before a video is played. */
export function videoPoster(url: string, width = 800): string | undefined {
  const m = CLOUDINARY_UPLOAD.exec(url);
  if (!m || !m[1].includes('/video/')) return undefined;
  const path = m[2].replace(/\.[a-z0-9]+$/i, '');
  // One second in, because many clips start on a black frame.
  return `${m[1]}so_1,f_jpg,q_auto,c_limit,w_${width}/${path}.jpg`;
}

export const isCloudinaryUrl = (url: string) => CLOUDINARY_UPLOAD.test(url);
