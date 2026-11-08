// Shared by the server (authoritative totals at checkout) and the browser (cart display),
// so it must stay free of server-only imports.

export interface BulkSlab {
  minQty: number;
  pricePerUnit: number;
}

export function getUnitPriceForProduct(
  product: { isBulkAvailable?: boolean; bulkSlabs?: unknown; sellingPrice: number; variants?: unknown },
  quantity: number,
  selectedVariantId?: string
): number {
  let basePrice = product.sellingPrice;
  if (selectedVariantId && Array.isArray(product.variants) && product.variants.length > 0) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const v = (product.variants as any[]).find((x) => String(x.id || x._id) === String(selectedVariantId));
    if (v && typeof v.price === 'number' && v.price > 0) {
      basePrice = v.price;
    }
  }

  const slabs = (product.bulkSlabs as BulkSlab[] | null) ?? [];
  if (!product.isBulkAvailable || slabs.length === 0) return basePrice;
  const applicable = [...slabs].sort((a, b) => b.minQty - a.minQty).find((slab) => quantity >= slab.minQty);
  return applicable ? applicable.pricePerUnit : basePrice;
}

/** Diwali offer products: always one unit per customer, whatever the admin settings say. */
export const ONE_PER_CUSTOMER_PRODUCT_IDS = ['prod-attar-2ml'];
export const ONE_PER_CUSTOMER_PRODUCT_SLUGS = ['diwali-special-attar-2ml'];

/** Products at or below this price (₹1-style promotional offers) are limited to one unit per customer. */
const OFFER_PRICE_LIMIT = 10;

/** Returns the maximum units of a product one customer may buy (across all of their orders). */
export function getMaxOrderLimit(product: {
  _id?: unknown;
  id?: unknown;
  urlSlug?: string | null;
  maxOrderQuantity?: number | null;
  sellingPrice: number;
  variants?: unknown;
}): number {
  const id = String(product._id ?? product.id ?? '');
  if (ONE_PER_CUSTOMER_PRODUCT_IDS.includes(id) || (product.urlSlug && ONE_PER_CUSTOMER_PRODUCT_SLUGS.includes(product.urlSlug))) {
    return 1;
  }
  // A ₹1 variant is just as much an offer as a ₹1 product.
  const variantPrices = Array.isArray(product.variants)
    ? (product.variants as Array<{ price?: unknown }>).map((v) => Number(v?.price)).filter((p) => p > 0)
    : [];
  const lowestPrice = Math.min(product.sellingPrice, ...variantPrices);
  if (lowestPrice <= OFFER_PRICE_LIMIT) {
    return 1;
  }
  if (typeof product.maxOrderQuantity === 'number' && product.maxOrderQuantity > 0) {
    return product.maxOrderQuantity;
  }
  return Infinity;
}

export interface PricingLine {
  productId: string;
  category: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  mrp: number;
  gstRate: number;
}

export interface CouponRule {
  code?: string;
  type: string;
  value: number;
  minOrderValue: number;
  maxDiscount?: number | null;
  categorySpecific?: string | null;
}

export interface PricedLine {
  productId: string;
  discountedTotal: number;
  taxableValue: number;
  gstAmount: number;
}

export interface PricedTotals {
  subtotal: number;
  savings: number;
  couponDiscount: number;
  discountedSubtotal: number;
  shippingFee: number;
  grandTotal: number;
  itemCount: number;
  taxableAmount: number;
  gstAmount: number;
  cgst: number;
  sgst: number;
  igst: number;
  lines: PricedLine[];
}

const round2 = (n: number) => Math.round(n * 100) / 100;
const SHIPPING_GST_RATE = 18;

const normalizeState = (s: string) => s.toLowerCase().replace(/[^a-z]/g, '');

/** Items a coupon applies to: everything, or only its category. */
function eligibleLines(coupon: CouponRule, lines: PricingLine[]) {
  return coupon.categorySpecific ? lines.filter((l) => l.category === coupon.categorySpecific) : lines;
}

export function checkCouponEligibility(coupon: CouponRule, lines: PricingLine[]): { ok: boolean; message?: string } {
  const subtotal = lines.reduce((sum, l) => sum + l.totalPrice, 0);
  if (subtotal < coupon.minOrderValue) {
    return { ok: false, message: `Minimum order value of ₹${coupon.minOrderValue} required for ${coupon.code ?? 'this coupon'}.` };
  }
  if (eligibleLines(coupon, lines).length === 0) {
    return { ok: false, message: `${coupon.code ?? 'This coupon'} applies only to ${coupon.categorySpecific} products.` };
  }
  return { ok: true };
}

export function computeCartTotals(input: {
  lines: PricingLine[];
  coupon: CouponRule | null;
  freeShippingThreshold: number;
  defaultShippingCharge: number;
  sellerState?: string;
  /** When omitted (cart preview) tax is shown as CGST+SGST; at checkout the real state decides. */
  customerState?: string;
}): PricedTotals {
  const { lines, coupon, freeShippingThreshold, defaultShippingCharge, sellerState, customerState } = input;

  const subtotal = lines.reduce((sum, l) => sum + l.totalPrice, 0);
  const itemCount = lines.reduce((sum, l) => sum + l.quantity, 0);
  const mrpTotal = lines.reduce((sum, l) => sum + l.mrp * l.quantity, 0);

  let couponDiscount = 0;
  const eligible = coupon && checkCouponEligibility(coupon, lines).ok ? eligibleLines(coupon, lines) : [];
  const eligibleTotal = eligible.reduce((sum, l) => sum + l.totalPrice, 0);
  if (coupon && eligibleTotal > 0) {
    couponDiscount =
      coupon.type === 'percentage' ? (eligibleTotal * coupon.value) / 100 : Math.min(coupon.value, eligibleTotal);
    if (coupon.maxDiscount && couponDiscount > coupon.maxDiscount) couponDiscount = coupon.maxDiscount;
    couponDiscount = round2(Math.min(couponDiscount, eligibleTotal));
  }

  // Spread the discount over the eligible lines so each line's GST is computed on what was actually paid.
  const eligibleSet = new Set(eligible);
  const lastEligible = eligible[eligible.length - 1];
  let allocated = 0;
  const discountedTotals = lines.map((l) => {
    if (couponDiscount <= 0 || !eligibleSet.has(l)) return l.totalPrice;
    const share = l === lastEligible ? round2(couponDiscount - allocated) : round2((couponDiscount * l.totalPrice) / eligibleTotal);
    allocated = round2(allocated + share);
    return round2(l.totalPrice - share);
  });

  const discountedSubtotal = round2(Math.max(0, subtotal - couponDiscount));
  const shippingFee = lines.length === 0 || discountedSubtotal >= freeShippingThreshold ? 0 : defaultShippingCharge;

  let taxableAmount = 0;
  let gstAmount = 0;
  const pricedLines: PricedLine[] = lines.map((l, i) => {
    const taxableValue = round2(discountedTotals[i] / (1 + l.gstRate / 100));
    const gst = round2(discountedTotals[i] - taxableValue);
    taxableAmount += taxableValue;
    gstAmount += gst;
    return { productId: l.productId, discountedTotal: discountedTotals[i], taxableValue, gstAmount: gst };
  });

  if (shippingFee > 0) {
    const shipTaxable = round2(shippingFee / (1 + SHIPPING_GST_RATE / 100));
    taxableAmount += shipTaxable;
    gstAmount += round2(shippingFee - shipTaxable);
  }

  taxableAmount = round2(taxableAmount);
  gstAmount = round2(gstAmount);

  const interState = !!(sellerState && customerState && normalizeState(sellerState) !== normalizeState(customerState));
  const cgst = interState ? 0 : round2(gstAmount / 2);
  const sgst = interState ? 0 : round2(gstAmount - cgst);
  const igst = interState ? gstAmount : 0;

  return {
    subtotal,
    savings: Math.max(0, round2(mrpTotal - discountedSubtotal)),
    couponDiscount,
    discountedSubtotal,
    shippingFee,
    grandTotal: round2(discountedSubtotal + shippingFee),
    itemCount,
    taxableAmount,
    gstAmount,
    cgst,
    sgst,
    igst,
    lines: pricedLines,
  };
}
