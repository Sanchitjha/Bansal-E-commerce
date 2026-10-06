import { useEffect, useState } from 'react';

const IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const VIDEO_TYPES = ['video/mp4', 'video/webm', 'video/quicktime'];
const MAX_IMAGE_MB = 10;
const MAX_VIDEO_MB = 100;

/** Uploads straight to Cloudinary using a signature from our server, and returns the hosted link. */
export async function uploadMedia(file: File, kind: 'image' | 'video'): Promise<string> {
  const allowed = kind === 'image' ? IMAGE_TYPES : VIDEO_TYPES;
  const maxMb = kind === 'image' ? MAX_IMAGE_MB : MAX_VIDEO_MB;
  if (!allowed.includes(file.type)) {
    throw new Error(kind === 'image' ? 'Please choose a JPG, PNG, WebP or GIF image.' : 'Please choose an MP4, WebM or MOV video.');
  }
  if (file.size > maxMb * 1024 * 1024) throw new Error(`That file is larger than ${maxMb} MB.`);

  const signRes = await fetch('/api/admin/upload', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ resourceType: kind }),
  });
  const signed = await signRes.json();
  if (!signRes.ok) throw new Error(signed.error || 'Could not start the upload.');

  const body = new FormData();
  body.append('file', file);
  body.append('api_key', signed.apiKey);
  body.append('timestamp', String(signed.timestamp));
  body.append('folder', signed.folder);
  body.append('signature', signed.signature);

  const res = await fetch(signed.uploadUrl, { method: 'POST', body });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || !data.secure_url) throw new Error(data?.error?.message || 'Upload failed. Please try again.');
  return data.secure_url as string;
}

export const uploadImage = (file: File) => uploadMedia(file, 'image');
export const uploadVideo = (file: File) => uploadMedia(file, 'video');

/** Whether media upload is connected (Cloudinary keys present on the server). */
export function useUploadEnabled(): boolean {
  const [enabled, setEnabled] = useState(false);
  useEffect(() => {
    fetch('/api/admin/upload')
      .then((r) => (r.ok ? r.json() : { enabled: false }))
      .then((d) => setEnabled(!!d.enabled))
      .catch(() => {});
  }, []);
  return enabled;
}
