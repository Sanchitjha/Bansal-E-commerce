import { CATEGORY_TYPES, isOneOf } from './validators';

const STRING_FIELDS = ['name', 'sku', 'subcategory', 'brand', 'shortDescription', 'longDescription', 'hsnCode', 'dimensionsCm', 'seoTitle', 'metaDescription', 'urlSlug'] as const;
const NUMBER_FIELDS = ['mrp', 'sellingPrice', 'costPrice', 'discountPercent', 'gstRate', 'stock', 'lowStockThreshold', 'weightKg', 'priorityOrder', 'rating', 'reviewsCount'] as const;
const BOOLEAN_FIELDS = ['isFeatured', 'isBestSeller', 'isNewArrival', 'isHomepagePriority', 'isBulkAvailable'] as const;
const STRING_ARRAY_FIELDS = ['images', 'videos', 'keywords'] as const;
const INTEGER_FIELDS = new Set(['stock', 'lowStockThreshold', 'priorityOrder', 'reviewsCount']);

export type ProductData = Record<string, unknown>;

/**
 * Picks only the product fields an admin may set and checks their types, so a bad or hostile request
 * can't write arbitrary fields. With `partial`, missing fields are simply left alone.
 */
export function parseProductInput(body: Record<string, unknown>, partial: boolean): { data: ProductData } | { error: string } {
  const data: ProductData = {};

  for (const key of STRING_FIELDS) {
    if (body[key] === undefined) continue;
    if (typeof body[key] !== 'string') return { error: `${key} must be text.` };
    data[key] = (body[key] as string).trim();
  }

  for (const key of NUMBER_FIELDS) {
    if (body[key] === undefined) continue;
    const n = Number(body[key]);
    if (!Number.isFinite(n) || n < 0) return { error: `${key} must be a number of 0 or more.` };
    if (INTEGER_FIELDS.has(key) && !Number.isInteger(n)) return { error: `${key} must be a whole number.` };
    data[key] = n;
  }

  for (const key of BOOLEAN_FIELDS) {
    if (body[key] !== undefined) data[key] = !!body[key];
  }

  for (const key of STRING_ARRAY_FIELDS) {
    if (body[key] === undefined) continue;
    if (!Array.isArray(body[key]) || (body[key] as unknown[]).some((v) => typeof v !== 'string')) return { error: `${key} must be a list of text values.` };
    data[key] = (body[key] as string[]).map((v) => v.trim()).filter(Boolean);
  }

  if (body.category !== undefined) {
    if (!isOneOf(CATEGORY_TYPES, body.category)) return { error: `Invalid category: ${String(body.category)}` };
    data.category = body.category;
  }

  if (body.status !== undefined) {
    if (body.status !== 'active' && body.status !== 'inactive') return { error: 'status must be active or inactive.' };
    data.status = body.status;
  }

  if (body.bulkSlabs !== undefined) {
    const slabs = body.bulkSlabs;
    if (
      !Array.isArray(slabs) ||
      slabs.some((s) => !s || !Number.isInteger(s.minQty) || s.minQty < 1 || !(Number(s.pricePerUnit) > 0))
    ) {
      return { error: 'Each bulk tier needs a whole-number quantity and a price above 0.' };
    }
    data.bulkSlabs = slabs.map((s) => ({ minQty: s.minQty, pricePerUnit: Number(s.pricePerUnit) }));
  }

  if (body.variants !== undefined) {
    if (!Array.isArray(body.variants)) return { error: 'variants must be a list.' };
    data.variants = body.variants;
  }

  if (!partial) {
    for (const key of ['name', 'sku', 'urlSlug', 'category', 'mrp', 'sellingPrice']) {
      if (data[key] === undefined || data[key] === '') return { error: `Missing required field: ${key}` };
    }
  }

  if (data.urlSlug !== undefined && !/^[a-z0-9-]+$/.test(data.urlSlug as string)) {
    return { error: 'URL slug may only contain lowercase letters, numbers and hyphens.' };
  }
  if (typeof data.mrp === 'number' && typeof data.sellingPrice === 'number' && data.sellingPrice > data.mrp) {
    return { error: 'Selling price cannot be higher than MRP.' };
  }

  return { data };
}
