import type { Product } from '@/generated/prisma/client';

export interface BulkSlab {
  minQty: number;
  pricePerUnit: number;
}

/** Mirrors LuminaryContext's getUnitPriceForProduct so pricing logic isn't duplicated ad hoc. */
export function getUnitPriceForProduct(product: Pick<Product, 'isBulkAvailable' | 'bulkSlabs' | 'sellingPrice'>, quantity: number): number {
  const slabs = (product.bulkSlabs as unknown as BulkSlab[]) ?? [];
  if (!product.isBulkAvailable || slabs.length === 0) {
    return product.sellingPrice;
  }
  const sorted = [...slabs].sort((a, b) => b.minQty - a.minQty);
  const applicable = sorted.find((slab) => quantity >= slab.minQty);
  return applicable ? applicable.pricePerUnit : product.sellingPrice;
}

export interface PricedCartLine {
  productId: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  mrp: number;
  gstRate: number;
}

export interface CartTotalsInput {
  lines: PricedCartLine[];
  coupon: {
    type: string;
    value: number;
    minOrderValue: number;
    maxDiscount?: number | null;
  } | null;
  freeShippingThreshold: number;
  defaultShippingCharge: number;
}

export interface CartTotals {
  subtotal: number;
  savings: number;
  couponDiscount: number;
  taxableAmount: number;
  gstAmount: number;
  cgst: number;
  sgst: number;
  shippingFee: number;
  grandTotal: number;
  itemCount: number;
}

const round2 = (n: number) => Math.round(n * 100) / 100;

/** Mirrors LuminaryContext's getCartTotals — recomputed server-side so a client can never dictate totals. */
export function computeCartTotals({ lines, coupon, freeShippingThreshold, defaultShippingCharge }: CartTotalsInput): CartTotals {
  let subtotal = 0;
  let itemCount = 0;
  let mrpTotal = 0;

  for (const line of lines) {
    subtotal += line.totalPrice;
    itemCount += line.quantity;
    mrpTotal += line.mrp * line.quantity;
  }

  let couponDiscount = 0;
  if (coupon && subtotal >= coupon.minOrderValue) {
    if (coupon.type === 'percentage') {
      couponDiscount = (subtotal * coupon.value) / 100;
      if (coupon.maxDiscount && couponDiscount > coupon.maxDiscount) {
        couponDiscount = coupon.maxDiscount;
      }
    } else {
      couponDiscount = coupon.value;
    }
  }

  const discountedSubtotal = Math.max(0, subtotal - couponDiscount);
  const savings = Math.max(0, mrpTotal - discountedSubtotal);

  const shippingFee = discountedSubtotal >= freeShippingThreshold || lines.length === 0 ? 0 : defaultShippingCharge;

  const taxableAmount = round2(discountedSubtotal / 1.18);
  const gstAmount = round2(discountedSubtotal - taxableAmount);
  const cgst = round2(gstAmount / 2);
  const sgst = cgst;

  const grandTotal = round2(discountedSubtotal + shippingFee);

  return {
    subtotal,
    savings,
    couponDiscount,
    taxableAmount,
    gstAmount,
    cgst,
    sgst,
    shippingFee,
    grandTotal,
    itemCount,
  };
}
