import { NextRequest, NextResponse } from 'next/server';
import { revalidateCatalog } from '@/lib/data';
import { db } from '@/lib/models';
import { isDuplicateKey } from '@/lib/db';
import { badRequest, requireAdmin, serverError, unauthorized } from '@/lib/api-helpers';
import { parseProductInput } from '@/lib/product-input';
import { CATEGORY_TYPES, isOneOf } from '@/lib/validators';

const escapeRegex = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const admin = requireAdmin(request);
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const search = searchParams.get('search')?.trim().slice(0, 100);
    const includeInactive = searchParams.get('includeInactive') === 'true' && !!admin;

    const filter: Record<string, unknown> = {};
    if (!includeInactive) filter.status = 'active';
    if (category && isOneOf(CATEGORY_TYPES, category)) filter.category = category;
    if (searchParams.get('featured') === 'true') filter.isFeatured = true;
    if (searchParams.get('bestSeller') === 'true') filter.isBestSeller = true;
    if (searchParams.get('newArrival') === 'true') filter.isNewArrival = true;
    if (searchParams.get('homepagePriority') === 'true') filter.isHomepagePriority = true;
    if (search) {
      const rx = new RegExp(escapeRegex(search), 'i');
      filter.$or = [{ name: rx }, { brand: rx }, { shortDescription: rx }, { keywords: search.toLowerCase() }];
    }

    const { Product } = await db();
    return NextResponse.json(await Product.find(filter).sort({ priorityOrder: 1, createdAt: -1 }));
  } catch (err) {
    return serverError(err);
  }
}

export async function POST(request: NextRequest) {
  const admin = requireAdmin(request);
  if (!admin) return unauthorized();

  try {
    const parsed = parseProductInput(await request.json(), false);
    if ('error' in parsed) return badRequest(parsed.error);

    const { Product, ActivityLog } = await db();
    const product = await Product.create(parsed.data);

    await ActivityLog.create({ adminName: admin.name, action: 'Created New Product', details: `Added ${product.name} (SKU: ${product.sku})` });

    revalidateCatalog();
    return NextResponse.json(product, { status: 201 });
  } catch (err) {
    if (isDuplicateKey(err)) return badRequest('A product with that SKU or URL slug already exists.');
    return serverError(err);
  }
}
