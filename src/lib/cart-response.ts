import { prisma } from './prisma';
import { computeCartTotals, getUnitPriceForProduct, type PricingLine } from './pricing';

/** Shared shape builder used by the cart, coupon and order routes so they always agree on prices. */
export async function buildCartPayload(sessionId: string, customerState?: string) {
  const [session, settings] = await Promise.all([
    prisma.cartSession.findUnique({
      where: { id: sessionId },
      include: { items: { include: { product: true }, orderBy: { createdAt: 'asc' } } },
    }),
    prisma.siteSettings.findUnique({ where: { id: 'singleton' } }),
  ]);

  const items = (session?.items ?? []).map((item) => {
    const unitPrice = getUnitPriceForProduct(item.product, item.quantity);
    return {
      product: item.product,
      quantity: item.quantity,
      unitPrice,
      totalPrice: unitPrice * item.quantity,
      selectedVariantId: item.selectedVariantId || undefined,
    };
  });

  const appliedCoupon = session?.activeCouponCode
    ? await prisma.coupon.findFirst({ where: { code: session.activeCouponCode, isActive: true } })
    : null;

  const lines: PricingLine[] = items.map((i) => ({
    productId: i.product.id,
    category: i.product.category,
    quantity: i.quantity,
    unitPrice: i.unitPrice,
    totalPrice: i.totalPrice,
    mrp: i.product.mrp,
    gstRate: i.product.gstRate,
  }));

  const totals = computeCartTotals({
    lines,
    coupon: appliedCoupon,
    freeShippingThreshold: settings?.freeShippingThreshold ?? 999,
    defaultShippingCharge: settings?.defaultShippingCharge ?? 99,
    sellerState: settings?.sellerState,
    customerState,
  });

  return { items, appliedCoupon, totals, lines };
}
