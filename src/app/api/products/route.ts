import { NextRequest, NextResponse } from 'next/server';
import { revalidateCatalog } from '@/lib/data';
import { prisma } from '@/lib/prisma';
import { badRequest, requireAdmin, serverError, unauthorized } from '@/lib/api-helpers';
import { CATEGORY_TYPES, isOneOf } from '@/lib/validators';

export async function GET(request: NextRequest) {
  try {
    const admin = requireAdmin(request);
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const search = searchParams.get('search');
    const featured = searchParams.get('featured');
    const bestSeller = searchParams.get('bestSeller');
    const newArrival = searchParams.get('newArrival');
    const homepagePriority = searchParams.get('homepagePriority');
    const includeInactive = searchParams.get('includeInactive') === 'true' && !!admin;

    const where: Record<string, unknown> = {};
    if (!includeInactive) where.status = 'active';
    if (category && isOneOf(CATEGORY_TYPES, category)) where.category = category;
    if (featured === 'true') where.isFeatured = true;
    if (bestSeller === 'true') where.isBestSeller = true;
    if (newArrival === 'true') where.isNewArrival = true;
    if (homepagePriority === 'true') where.isHomepagePriority = true;
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { brand: { contains: search, mode: 'insensitive' } },
        { shortDescription: { contains: search, mode: 'insensitive' } },
        { keywords: { has: search.toLowerCase() } },
      ];
    }

    const products = await prisma.product.findMany({
      where,
      orderBy: [{ priorityOrder: 'asc' }, { createdAt: 'desc' }],
    });

    return NextResponse.json(products);
  } catch (err) {
    return serverError(err);
  }
}

export async function POST(request: NextRequest) {
  const admin = requireAdmin(request);
  if (!admin) return unauthorized();

  try {
    const body = await request.json();
    const required = ['name', 'sku', 'category', 'urlSlug', 'mrp', 'sellingPrice'];
    for (const field of required) {
      if (body[field] === undefined || body[field] === null || body[field] === '') {
        return badRequest(`Missing required field: ${field}`);
      }
    }
    if (!isOneOf(CATEGORY_TYPES, body.category)) {
      return badRequest(`Invalid category: ${body.category}`);
    }

    const product = await prisma.product.create({
      data: {
        name: body.name,
        sku: body.sku,
        category: body.category,
        subcategory: body.subcategory ?? '',
        brand: body.brand ?? '',
        shortDescription: body.shortDescription ?? '',
        longDescription: body.longDescription ?? '',
        images: body.images ?? [],
        mrp: body.mrp,
        sellingPrice: body.sellingPrice,
        costPrice: body.costPrice ?? 0,
        discountPercent: body.discountPercent ?? 0,
        gstRate: body.gstRate ?? 18,
        hsnCode: body.hsnCode ?? '',
        stock: body.stock ?? 0,
        lowStockThreshold: body.lowStockThreshold ?? 10,
        weightKg: body.weightKg ?? 0,
        dimensionsCm: body.dimensionsCm,
        status: body.status ?? 'active',
        isFeatured: !!body.isFeatured,
        isBestSeller: !!body.isBestSeller,
        isNewArrival: !!body.isNewArrival,
        isHomepagePriority: !!body.isHomepagePriority,
        priorityOrder: body.priorityOrder ?? 0,
        isBulkAvailable: !!body.isBulkAvailable,
        bulkSlabs: body.bulkSlabs ?? [],
        variants: body.variants ?? [],
        rating: body.rating ?? 0,
        reviewsCount: body.reviewsCount ?? 0,
        seoTitle: body.seoTitle,
        metaDescription: body.metaDescription,
        urlSlug: body.urlSlug,
        keywords: body.keywords ?? [],
      },
    });

    await prisma.activityLog.create({
      data: { adminName: admin.name, action: 'Created New Product', details: `Added ${product.name} (SKU: ${product.sku})` },
    });

    revalidateCatalog();
    return NextResponse.json(product, { status: 201 });
  } catch (err: unknown) {
    if (typeof err === 'object' && err && 'code' in err && (err as { code?: string }).code === 'P2002') {
      return badRequest('A product with that SKU or URL slug already exists.');
    }
    return serverError(err);
  }
}
