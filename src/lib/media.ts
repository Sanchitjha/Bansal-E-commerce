// Safe for both server and client. Only Cloudinary links are rewritten; any other link is returned as is.

const CLOUDINARY_UPLOAD = /^(https:\/\/res\.cloudinary\.com\/[^/]+\/(?:image|video)\/upload\/)(.+)$/;

/** Serves a right-sized image in a modern format (WebP/AVIF) and sensible quality. */
export function optimizeImage(url: string, width = 800): string {
  const m = CLOUDINARY_UPLOAD.exec(url);
  if (!m || m[1].includes('/video/')) return url;
  // Skip if the link already carries its own transformation.
  if (/^(?:[a-z]{1,3}_[^/]+,?)+\//.test(m[2])) return url;
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
