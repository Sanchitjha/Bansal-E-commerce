/**
 * Loads starter data into MongoDB.
 *
 *   npm run db:seed              catalog only: products, coupons, banners, settings, admin account
 *   npm run db:seed -- --demo    also adds sample orders, enquiries, reviews and logs (for trying things out)
 *
 * It only INSERTS what is missing, so running it again never overwrites products, prices, stock or the
 * admin password you have since changed.
 */
import { config } from 'dotenv';
import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';
// `--local` seeds whatever MONGODB_URI is already set in the shell (a test database) and never the one in .env.local.
const LOCAL = process.argv.includes('--local');
config({ path: '.env.local', override: !LOCAL });
config();
if (LOCAL && /mongodb\.net|mongodb\+srv/.test(process.env.MONGODB_URI ?? '')) {
  console.error('--local refuses to run against a hosted database. Set MONGODB_URI to a local test database first.');
  process.exit(1);
}

import { db } from '../src/lib/models';
import {
  INITIAL_PRODUCTS,
  INITIAL_COUPONS,
  INITIAL_ORDERS,
  INITIAL_BULK_ENQUIRIES,
  INITIAL_HERO_BANNERS,
  INITIAL_CREATOR_VIDEOS,
  INITIAL_ACTIVITY_LOGS,
  INITIAL_SHEET_LOGS,
  INITIAL_SETTINGS,
} from '../src/data/mockData';

const DEMO = process.argv.includes('--demo');

const DEMO_REVIEWS = [
  {
    _id: 'rev-1',
    productId: 'prod-1',
    author: 'Ananya Singh',
    location: 'Udaipur, RJ',
    rating: 5,
    title: 'Beautiful scent and it lasts',
    content: 'The Fragrance Land EDP is lovely. The scent stays on for a full day and the gold-capped glass bottle looks gorgeous.',
    date: new Date('2026-09-20'),
  },
  {
    _id: 'rev-2',
    productId: 'prod-4',
    author: 'Siddharth Vardhan',
    location: 'Bengaluru, KA',
    rating: 5,
    title: 'Fits well into my night routine',
    content: 'The Kumkumadi night elixir absorbs quickly without feeling greasy. My skin looks brighter after a few weeks.',
    date: new Date('2026-09-22'),
  },
  {
    _id: 'rev-3',
    productId: 'prod-3',
    author: 'Kavita Subramaniam',
    location: 'Chennai, TN',
    rating: 5,
    title: 'Perfect for corporate gifting',
    content: 'We ordered a large batch of the Luminary gift sets for a corporate event. Delivery was on time and the packaging looked premium.',
    date: new Date('2026-09-24'),
  },
];

async function insertMissing<T extends { _id: string }>(model: mongoose.Model<any>, docs: T[]) {
  let added = 0;
  for (const doc of docs) {
    const res = await model.updateOne({ _id: doc._id }, { $setOnInsert: doc }, { upsert: true, timestamps: false });
    if (res.upsertedCount > 0) added++;
  }
  return added;
}

async function main() {
  const m = await db();
  console.log(`Seeding MongoDB (${DEMO ? 'catalog + demo data' : 'catalog only'})...`);

  await Promise.all(Object.values(m).map((model) => model.syncIndexes()));

  const products = INITIAL_PRODUCTS.map(({ id, createdAt, updatedAt, ...rest }) => ({
    _id: id,
    ...rest,
    videos: rest.videos ?? [],
    createdAt: new Date(createdAt),
    updatedAt: new Date(updatedAt),
  }));
  console.log(`  products:     +${await insertMissing(m.Product, products)}`);

  const coupons = INITIAL_COUPONS.map(({ id, ...rest }) => ({ _id: id, ...rest, usageCount: 0 }));
  console.log(`  coupons:      +${await insertMissing(m.Coupon, coupons)}`);

  const banners = INITIAL_HERO_BANNERS.map(({ id, ...rest }) => ({ _id: id, ...rest, productId: rest.productId ?? null }));
  console.log(`  banners:      +${await insertMissing(m.HeroBanner, banners)}`);

  const creatorVideos = INITIAL_CREATOR_VIDEOS.map(({ id, ...rest }) => ({ _id: id, ...rest }));
  console.log(`  creator videos: +${await insertMissing(m.CreatorVideo, creatorVideos)}`);

  const settings = await m.SiteSettings.updateOne({ _id: 'singleton' }, { $setOnInsert: { _id: 'singleton', ...INITIAL_SETTINGS } }, { upsert: true });
  console.log(`  settings:     ${settings.upsertedCount ? 'created' : 'kept as is'}`);

  const adminEmail = process.env.ADMIN_EMAIL?.toLowerCase().trim();
  const adminPassword = process.env.ADMIN_PASSWORD;
  if (adminEmail && adminPassword) {
    const res = await m.Admin.updateOne(
      { email: adminEmail },
      { $setOnInsert: { email: adminEmail, passwordHash: await bcrypt.hash(adminPassword, 10), name: 'Admin' } },
      { upsert: true }
    );
    console.log(`  admin:        ${res.upsertedCount ? `created (${adminEmail})` : 'already exists, password untouched'}`);
  } else {
    console.warn('  admin:        skipped, set ADMIN_EMAIL and ADMIN_PASSWORD to create the first admin');
  }

  if (DEMO) {
    const orders = INITIAL_ORDERS.map(({ id, items, date, ...rest }) => ({ _id: id, ...rest, items, date: new Date(date) }));
    console.log(`  demo orders:  +${await insertMissing(m.Order, orders)}`);
    const enquiries = INITIAL_BULK_ENQUIRIES.map(({ id, createdAt, ...rest }) => ({ _id: id, ...rest, createdAt: new Date(createdAt) }));
    console.log(`  demo enquiries: +${await insertMissing(m.BulkEnquiry, enquiries)}`);
    console.log(`  demo reviews: +${await insertMissing(m.Review, DEMO_REVIEWS.map((r) => ({ ...r, location: r.location, verified: true })))}`);
    const activity = INITIAL_ACTIVITY_LOGS.map(({ id, timestamp, ...rest }) => ({ _id: id, ...rest, timestamp: new Date(timestamp) }));
    console.log(`  demo activity: +${await insertMissing(m.ActivityLog, activity)}`);
    const sheets = INITIAL_SHEET_LOGS.map(({ id, timestamp, ...rest }) => ({ _id: id, ...rest, timestamp: new Date(timestamp) }));
    console.log(`  demo order log: +${await insertMissing(m.SheetSyncLog, sheets)}`);
  }

  console.log('Done.');
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(() => mongoose.disconnect());
