import crypto from 'crypto';

interface CloudinaryConfig {
  cloudName: string;
  apiKey: string;
  apiSecret: string;
}

/** Reads CLOUDINARY_URL (cloudinary://KEY:SECRET@CLOUD) or the three separate variables. */
export function cloudinaryConfig(): CloudinaryConfig | null {
  const url = process.env.CLOUDINARY_URL;
  if (url) {
    const m = /^cloudinary:\/\/([^:]+):([^@]+)@(.+)$/.exec(url.trim());
    if (m) return { apiKey: m[1], apiSecret: m[2], cloudName: m[3] };
  }
  const { CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET } = process.env;
  if (CLOUDINARY_CLOUD_NAME && CLOUDINARY_API_KEY && CLOUDINARY_API_SECRET) {
    return { cloudName: CLOUDINARY_CLOUD_NAME, apiKey: CLOUDINARY_API_KEY, apiSecret: CLOUDINARY_API_SECRET };
  }
  return null;
}

export const cloudinaryConfigured = () => cloudinaryConfig() !== null;

/**
 * Signs an upload so the admin's browser can send the file straight to Cloudinary. The API secret never
 * leaves the server, and large videos skip our server entirely (serverless request bodies are small).
 */
export function signUpload(resourceType: 'image' | 'video') {
  const config = cloudinaryConfig();
  if (!config) throw new Error('Cloudinary is not configured');

  const folder = resourceType === 'video' ? 'luminary/videos' : 'luminary/products';
  const timestamp = Math.floor(Date.now() / 1000);
  // Cloudinary signs the sorted "key=value" pairs (excluding file, api_key, resource_type) plus the secret.
  const signature = crypto.createHash('sha1').update(`folder=${folder}&timestamp=${timestamp}${config.apiSecret}`).digest('hex');

  return {
    uploadUrl: `https://api.cloudinary.com/v1_1/${config.cloudName}/${resourceType}/upload`,
    apiKey: config.apiKey,
    timestamp,
    folder,
    signature,
  };
}
