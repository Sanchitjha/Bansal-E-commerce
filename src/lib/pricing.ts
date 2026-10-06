// Shared by the server (authoritative totals at checkout) and the browser (cart display),
// so it must stay free of server-only imports.

export interface BulkSlab {
  minQty: number;
  pricePerUnit: number;
}

export function getUnitPriceForProduct(
  product: { isBulkAvailable: boolean; bulkSlabs: unknown; sellingPrice: number },
  quantity: number
): number {
  const slabs = (product.bulkSlabs as BulkSlab[] | null) ?? [];
  if (!product.isBulkAvailable || slabs.length === 0) return product.sellingPrice;
  const applicable = [...slabs].sort((a, b) => b.minQty - a.minQty).find((slab) => quantity >= slab.minQty);
  return applicable ? applicable.pricePerUnit : product.sellingPrice;
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
