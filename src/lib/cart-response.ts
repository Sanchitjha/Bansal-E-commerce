import { db } from './models';
import { computeCartTotals, getUnitPriceForProduct, type PricingLine } from './pricing';

/** Shared shape builder used by the cart, coupon and order routes so they always agree on prices. */
export async function buildCartPayload(sessionId: string, customerState?: string) {
  const { CartSession, Product, Coupon, SiteSettings } = await db();

  const [session, settings] = await Promise.all([CartSession.findById(sessionId).lean(), SiteSettings.findById('singleton').lean()]);

  const lineItems = [...(session?.items ?? [])].sort((a, b) => +new Date(a.addedAt) - +new Date(b.addedAt));
  const productIds = lineItems.map((i) => i.productId);
  const products = productIds.length ? await Product.find({ _id: { $in: productIds } }) : [];
  const productById = new Map(products.map((p) => [p._id, p]));

  // A product deleted after being added to a cart simply drops out of it.
  const items = lineItems
    .filter((i) => productById.has(i.productId))
    .map((i) => {
      const product = productById.get(i.productId)!;
      let variantName: string | undefined;
      let variantSku: string | undefined;
      let lineMrp = product.mrp;

      if (i.selectedVariantId && Array.isArray(product.variants)) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const v = (product.variants as any[]).find((x) => String(x.id || x._id) === String(i.selectedVariantId));
        if (v) {
          variantName = v.name;
          variantSku = v.sku;
          if (typeof v.mrp === 'number' && v.mrp > 0) lineMrp = v.mrp;
        }
      }

      const unitPrice = getUnitPriceForProduct(product, i.quantity, i.selectedVariantId);
      return {
        product,
        quantity: i.quantity,
        unitPrice,
        totalPrice: unitPrice * i.quantity,
        selectedVariantId: i.selectedVariantId || undefined,
        variantName,
        variantSku,
        variantMrp: lineMrp,
      };
    });

  const appliedCoupon = session?.activeCouponCode ? await Coupon.findOne({ code: session.activeCouponCode, isActive: true }) : null;

  const lines: PricingLine[] = items.map((i) => ({
    productId: i.product._id,
    category: i.product.category,
    quantity: i.quantity,
    unitPrice: i.unitPrice,
    totalPrice: i.totalPrice,
    mrp: i.variantMrp ?? i.product.mrp,
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
