import { prisma } from './prisma';
import { computeCartTotals, getUnitPriceForProduct } from './pricing';

/** Shared shape builder used by /api/cart and /api/coupons/apply so both stay in sync. */
export async function buildCartPayload(sessionId: string) {
  const [session, settings] = await Promise.all([
    prisma.cartSession.findUnique({
      where: { id: sessionId },
      include: { items: { include: { product: true }, orderBy: { createdAt: 'asc' } } },
    }),
    prisma.siteSettings.findUnique({ where: { id: 'singleton' } }),
  ]);

  if (!session) {
    return {
      items: [],
      appliedCoupon: null,
      totals: computeCartTotals({
        lines: [],
        coupon: null,
        freeShippingThreshold: settings?.freeShippingThreshold ?? 999,
        defaultShippingCharge: settings?.defaultShippingCharge ?? 99,
      }),
    };
  }

  const items = session.items.map((item) => {
    const unitPrice = getUnitPriceForProduct(item.product, item.quantity);
    return {
      product: item.product,
      quantity: item.quantity,
      unitPrice,
      totalPrice: unitPrice * item.quantity,
      selectedVariantId: item.selectedVariantId || undefined,
    };
  });

  let appliedCoupon = null;
  if (session.activeCouponCode) {
    appliedCoupon = await prisma.coupon.findFirst({
      where: { code: session.activeCouponCode, isActive: true },
    });
  }

  const totals = computeCartTotals({
    lines: items.map((i) => ({
      productId: i.product.id,
      quantity: i.quantity,
      unitPrice: i.unitPrice,
      totalPrice: i.totalPrice,
      mrp: i.product.mrp,
      gstRate: i.product.gstRate,
    })),
    coupon: appliedCoupon,
    freeShippingThreshold: settings?.freeShippingThreshold ?? 999,
    defaultShippingCharge: settings?.defaultShippingCharge ?? 99,
  });

  return { items, appliedCoupon, totals };
}
