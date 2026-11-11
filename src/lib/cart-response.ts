import { db } from './models';
import { OFFER_PRICE_LIMIT, OFFER_UNITS_PER_CUSTOMER, computeCartTotals, getMaxOrderLimit, getUnitPriceForProduct, type PricingLine } from './pricing';

/** Shared shape builder used by the cart, coupon and order routes so they always agree on prices. */
export async function buildCartPayload(sessionId: string, customerState?: string) {
  const { CartSession, Product, Coupon, SiteSettings } = await db();

  const [session, settings] = await Promise.all([CartSession.findById(sessionId).lean(), SiteSettings.findById('singleton').lean()]);

  const lineItems = [...(session?.items ?? [])].sort((a, b) => +new Date(a.addedAt) - +new Date(b.addedAt));
  const productIds = lineItems.map((i) => i.productId);
  const products = productIds.length ? await Product.find({ _id: { $in: productIds } }) : [];
  const productById = new Map(products.map((p) => [p._id, p]));

  let needsDbSync = false;
  // Only the first ₹1-style offer item added to the cart keeps its offer price; later ones cost their original price.
  let offerUnitsLeft = OFFER_UNITS_PER_CUSTOMER;

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

      const limit = getMaxOrderLimit(product);
      const effectiveQty = Math.max(1, Math.min(i.quantity, limit));
      if (effectiveQty !== i.quantity) {
        needsDbSync = true;
      }

      let unitPrice = getUnitPriceForProduct(product, effectiveQty, i.selectedVariantId);
      let offerPriceRemoved = false;
      if (unitPrice <= OFFER_PRICE_LIMIT) {
        if (offerUnitsLeft >= effectiveQty) {
          offerUnitsLeft -= effectiveQty;
        } else {
          // The ₹1 offer is already used by an item added earlier: charge the original (MRP) price.
          const original = [lineMrp, product.mrp, product.sellingPrice].find((p) => typeof p === 'number' && p > OFFER_PRICE_LIMIT);
          if (original) {
            unitPrice = original;
            offerPriceRemoved = true;
          }
        }
      }
      return {
        product,
        quantity: effectiveQty,
        unitPrice,
        offerPriceRemoved,
        totalPrice: unitPrice * effectiveQty,
        selectedVariantId: i.selectedVariantId || undefined,
        variantName,
        variantSku,
        variantMrp: lineMrp,
      };
    });

  if (needsDbSync && session) {
    const clampedItems = items.map((it) => ({
      productId: it.product._id,
      selectedVariantId: it.selectedVariantId || '',
      quantity: it.quantity,
    }));
    await CartSession.updateOne(
      { _id: sessionId },
      { $set: { items: clampedItems } }
    ).catch(() => {});
  }

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
