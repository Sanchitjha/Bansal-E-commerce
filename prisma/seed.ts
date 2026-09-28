import 'dotenv/config';
import { config as loadEnv } from 'dotenv';
loadEnv({ path: '.env.local', override: true });

import { PrismaClient, Prisma } from '../src/generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import bcrypt from 'bcryptjs';
import {
  INITIAL_PRODUCTS,
  INITIAL_COUPONS,
  INITIAL_ORDERS,
  INITIAL_BULK_ENQUIRIES,
  INITIAL_HERO_BANNERS,
  INITIAL_ACTIVITY_LOGS,
  INITIAL_SHEET_LOGS,
  INITIAL_SETTINGS,
} from '../src/data/mockData';

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('Seeding products...');
  for (const p of INITIAL_PRODUCTS) {
    const { id, createdAt, updatedAt, bulkSlabs, variants, ...rest } = p;
    const extra = {
      createdAt: new Date(createdAt),
      updatedAt: new Date(updatedAt),
      bulkSlabs: bulkSlabs as object as Prisma.InputJsonValue,
      variants: (variants ?? []) as object as Prisma.InputJsonValue,
    };
    await prisma.product.upsert({
      where: { sku: p.sku },
      create: { id, ...rest, ...extra },
      update: { ...rest, ...extra },
    });
  }

  console.log('Seeding coupons...');
  for (const c of INITIAL_COUPONS) {
    const { id, ...rest } = c;
    await prisma.coupon.upsert({
      where: { code: c.code },
      create: { id, ...rest },
      update: { ...rest },
    });
  }

  console.log('Seeding orders...');
  for (const o of INITIAL_ORDERS) {
    const { items, ...rest } = o;
    const extra = { date: new Date(o.date), items: items as object as Prisma.InputJsonValue };
    await prisma.order.upsert({
      where: { id: o.id },
      create: { ...rest, ...extra },
      update: { ...rest, ...extra },
    });
  }

  console.log('Seeding bulk enquiries...');
  for (const e of INITIAL_BULK_ENQUIRIES) {
    const { id, createdAt, ...rest } = e;
    await prisma.bulkEnquiry.upsert({
      where: { id },
      create: { id, ...rest, createdAt: new Date(createdAt) },
      update: { ...rest, createdAt: new Date(createdAt) },
    });
  }

  console.log('Seeding hero banners...');
  for (const h of INITIAL_HERO_BANNERS) {
    const { id, ...rest } = h;
    await prisma.heroBanner.upsert({
      where: { id },
      create: { id, ...rest },
      update: rest,
    });
  }

  console.log('Seeding activity logs...');
  for (const a of INITIAL_ACTIVITY_LOGS) {
    const { id, timestamp, ...rest } = a;
    await prisma.activityLog.upsert({
      where: { id },
      create: { id, ...rest, timestamp: new Date(timestamp) },
      update: { ...rest, timestamp: new Date(timestamp) },
    });
  }

  console.log('Seeding sheet sync logs...');
  for (const s of INITIAL_SHEET_LOGS) {
    const { id, timestamp, ...rest } = s;
    await prisma.sheetSyncLog.upsert({
      where: { id },
      create: { id, ...rest, timestamp: new Date(timestamp) },
      update: { ...rest, timestamp: new Date(timestamp) },
    });
  }

  console.log('Seeding reviews...');
  const INITIAL_REVIEWS = [
    {
      id: 'rev-1',
      productId: 'prod-1',
      author: 'Princess Ananya Singh',
      location: 'Udaipur, RJ',
      rating: 5,
      title: 'Hypnotic Oud & Unmatched Longevity',
      content:
        'The Royal Imperial Oud EDP is beyond divine. The richness of Assam Oud blended with velvet rose lasts for over 24 hours.',
      date: new Date('2026-09-20'),
      verified: true,
    },
    {
      id: 'rev-2',
      productId: 'prod-4',
      author: 'Dr. Siddharth Vardhan',
      location: 'Bengaluru, KA',
      rating: 5,
      title: 'Transformed My Night Skin Routine',
      content:
        'The 24K Gold Kumkumadi Night Elixir is the only authentic Ayurvedic serum that actually works without feeling greasy.',
      date: new Date('2026-09-22'),
      verified: true,
    },
  ];
  for (const r of INITIAL_REVIEWS) {
    const { id, ...rest } = r;
    await prisma.review.upsert({
      where: { id },
      create: { id, ...rest },
      update: rest,
    });
  }

  console.log('Seeding site settings...');
  await prisma.siteSettings.upsert({
    where: { id: 'singleton' },
    create: { id: 'singleton', ...INITIAL_SETTINGS },
    update: { ...INITIAL_SETTINGS },
  });

  const adminEmail = process.env.ADMIN_EMAIL;
  const adminPassword = process.env.ADMIN_PASSWORD;
  if (adminEmail && adminPassword) {
    console.log('Seeding admin account...');
    const passwordHash = await bcrypt.hash(adminPassword, 10);
    await prisma.admin.upsert({
      where: { email: adminEmail },
      create: { email: adminEmail, passwordHash, name: 'Admin' },
      update: { passwordHash },
    });
  } else {
    console.warn('ADMIN_EMAIL / ADMIN_PASSWORD not set — skipping admin account seed.');
  }

  console.log('Seed complete.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
