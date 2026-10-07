/**
 * Moves every product and banner image/video to Cloudinary and points the store at the new links.
 *
 *   npm run media:migrate -- --dry-run     only shows what would be uploaded
 *   npm run media:migrate                  uploads, updates the database and src/data/mockData.ts
 *
 * Safe to run again: links that already point at Cloudinary are skipped, and re-uploads overwrite the same file.
 * Site paths (/products/...) are read from public/, and stock-photo links are fetched by Cloudinary itself.
 */
import { config } from 'dotenv';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import mongoose from 'mongoose';
config({ path: '.env.local', override: true });
config();

import { db } from '../src/lib/models';
import { cloudinaryConfig, signUpload } from '../src/lib/cloudinary';

const DRY = process.argv.includes('--dry-run');
const MOCK_FILE = 'src/data/mockData.ts';

const sha1 = (text: string) => crypto.createHash('sha1').update(text).digest('hex');
const isCloudinary = (u: string) => /^https:\/\/res\.cloudinary\.com\//.test(u);
const isVideo = (u: string) => /\.(mp4|webm|mov)(\?|$)/i.test(u);

interface Source {
  old: string;
  kind: 'image' | 'video';
  publicId: string;
  local?: string;
  remote?: string;
}

function plan(u: string): Source | null {
  if (!u || isCloudinary(u)) return null;
  const kind = isVideo(u) ? 'video' : 'image';
  if (u.startsWith('/')) {
    return { old: u, kind, publicId: path.basename(u).replace(/\.[^.]+$/, ''), local: path.join('public', u) };
  }
  const unsplash = /^https:\/\/images\.unsplash\.com\/(photo-[A-Za-z0-9_-]+)/.exec(u);
  if (unsplash) {
    return {
      old: u,
      kind,
      publicId: `unsplash-${unsplash[1]}`,
      remote: `https://images.unsplash.com/${unsplash[1]}?auto=format&fit=max&w=1600&q=85`,
    };
  }
  if (/^https?:\/\//.test(u)) return { old: u, kind, publicId: `link-${sha1(u).slice(0, 12)}`, remote: u };
  return null;
}

async function upload(cfg: NonNullable<ReturnType<typeof cloudinaryConfig>>, s: Source): Promise<string> {
  const params: Record<string, string> = {
    folder: s.kind === 'video' ? 'luminary/videos' : 'luminary/products',
    overwrite: 'true',
    public_id: s.publicId,
    timestamp: String(Math.floor(Date.now() / 1000)),
  };
  const toSign = Object.keys(params)
    .sort()
    .map((k) => `${k}=${params[k]}`)
    .join('&');

  const form = new FormData();
  for (const [k, v] of Object.entries(params)) form.append(k, v);
  form.append('api_key', cfg.apiKey);
  form.append('signature', sha1(toSign + cfg.apiSecret));
  if (s.local) form.append('file', new Blob([fs.readFileSync(s.local)]), path.basename(s.local));
  else form.append('file', s.remote!);

  const res = await fetch(`https://api.cloudinary.com/v1_1/${cfg.cloudName}/${s.kind}/upload`, { method: 'POST', body: form });
  const data: any = await res.json().catch(() => ({}));
  if (!res.ok || !data.secure_url) throw new Error(data?.error?.message ?? `HTTP ${res.status}`);
  return data.secure_url as string;
}

/** Uploads a 1-pixel image the same way the admin panel does, then deletes it, to prove admin uploads will work. */
async function checkAdminUpload(cfg: NonNullable<ReturnType<typeof cloudinaryConfig>>) {
  const signed = signUpload('image');
  const png = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==', 'base64');
  const form = new FormData();
  form.append('file', new Blob([png], { type: 'image/png' }), 'upload-check.png');
  form.append('api_key', signed.apiKey);
  form.append('timestamp', String(signed.timestamp));
  form.append('folder', signed.folder);
  form.append('signature', signed.signature);
  const res = await fetch(signed.uploadUrl, { method: 'POST', body: form });
  const data: any = await res.json().catch(() => ({}));
  if (!res.ok || !data.public_id) throw new Error(data?.error?.message ?? `HTTP ${res.status}`);

  const timestamp = String(Math.floor(Date.now() / 1000));
  const del = new FormData();
  del.append('public_id', data.public_id);
  del.append('timestamp', timestamp);
  del.append('api_key', cfg.apiKey);
  del.append('signature', sha1(`public_id=${data.public_id}&timestamp=${timestamp}${cfg.apiSecret}`));
  await fetch(`https://api.cloudinary.com/v1_1/${cfg.cloudName}/image/destroy`, { method: 'POST', body: del });
}

async function main() {
  const cfg = cloudinaryConfig();
  if (!cfg && !DRY) {
    console.error('Cloudinary keys are missing. Run: node scripts/set-cloudinary-keys.mjs');
    process.exit(1);
  }

  const m = await db();
  const products = await m.Product.find({}, { images: 1, videos: 1, name: 1 }).lean();
  const banners = await m.HeroBanner.find({}, { imageUrl: 1, title: 1 }).lean();

  const wanted = new Set<string>();
  for (const p of products) [...(p.images ?? []), ...(p.videos ?? [])].forEach((u) => wanted.add(u));
  for (const b of banners) wanted.add(b.imageUrl);

  const sources = [...wanted].map(plan).filter((s): s is Source => !!s);
  const skipped = wanted.size - sources.length;
  const missing = sources.filter((s) => s.local && !fs.existsSync(s.local));
  console.log(`${wanted.size} links in the store: ${sources.length} to move, ${skipped} already on Cloudinary.`);
  if (missing.length) {
    console.error('These files are missing from public/:\n  ' + missing.map((s) => s.local).join('\n  '));
    process.exit(1);
  }

  if (DRY) {
    for (const s of sources) console.log(`  would upload ${s.kind.padEnd(5)} ${s.publicId}  <-  ${s.local ?? s.remote}`);
    console.log('Dry run only, nothing was uploaded or changed.');
    return;
  }

  const byId = new Map<string, string>(); // kind:publicId -> hosted link
  const mapping = new Map<string, string>(); // old link -> hosted link
  const failed: string[] = [];
  let n = 0;
  for (const s of sources) {
    n++;
    const key = `${s.kind}:${s.publicId}`;
    try {
      if (!byId.has(key)) {
        let lastErr: unknown;
        for (let attempt = 1; attempt <= 3 && !byId.has(key); attempt++) {
          try {
            byId.set(key, await upload(cfg!, s));
          } catch (err) {
            lastErr = err;
            await new Promise((r) => setTimeout(r, 1500 * attempt));
          }
        }
        if (!byId.has(key)) throw lastErr;
      }
      mapping.set(s.old, byId.get(key)!);
      console.log(`  [${n}/${sources.length}] ${s.kind} ${s.publicId}`);
    } catch (err) {
      failed.push(s.old);
      console.error(`  [${n}/${sources.length}] FAILED ${s.publicId}: ${(err as Error).message}`);
    }
  }

  const swap = (u: string) => mapping.get(u) ?? u;
  let changed = 0;
  for (const p of products) {
    const images = (p.images ?? []).map(swap);
    const videos = (p.videos ?? []).map(swap);
    if (images.join() !== (p.images ?? []).join() || videos.join() !== (p.videos ?? []).join()) {
      await m.Product.updateOne({ _id: p._id }, { $set: { images, videos } });
      changed++;
    }
  }
  for (const b of banners) {
    if (swap(b.imageUrl) !== b.imageUrl) await m.HeroBanner.updateOne({ _id: b._id }, { $set: { imageUrl: swap(b.imageUrl) } });
  }
  console.log(`Database updated: ${changed} products and ${banners.length} banners checked.`);

  // Keep the starter data in step, so a fresh `npm run db:seed` also uses Cloudinary.
  let mock = fs.readFileSync(MOCK_FILE, 'utf8');
  for (const [from, to] of mapping) mock = mock.split(`'${from}'`).join(`'${to}'`);
  fs.writeFileSync(MOCK_FILE, mock);
  console.log(`${MOCK_FILE} updated.`);

  try {
    await checkAdminUpload(cfg!);
    console.log('Admin upload check: OK (a test pixel was uploaded and deleted).');
  } catch (err) {
    console.error('Admin upload check FAILED:', (err as Error).message);
  }

  if (failed.length) {
    console.error(`\n${failed.length} file(s) did not upload, they keep their old links. Run the command again to retry.`);
    process.exitCode = 1;
  } else {
    console.log('\nAll images and videos are on Cloudinary.');
  }
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(() => mongoose.disconnect());
