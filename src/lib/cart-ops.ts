import { db } from './models';

// Each cart change is a single atomic MongoDB update, so two quick clicks can never overwrite each other.

export async function getCartItemQuantity(sessionId: string, productId: string, variantKey: string): Promise<number> {
  const { CartSession } = await db();
  const session = await CartSession.findById(sessionId).lean();
  return session?.items.find((i) => i.productId === productId && i.selectedVariantId === variantKey)?.quantity ?? 0;
}

export async function addCartItem(sessionId: string, productId: string, variantKey: string, quantity: number): Promise<void> {
  const { CartSession } = await db();
  const match = { productId, selectedVariantId: variantKey };

  // Another request can add the same line between our two steps, so try a few times.
  for (let attempt = 0; attempt < 3; attempt++) {
    const bumped = await CartSession.updateOne({ _id: sessionId, items: { $elemMatch: match } }, { $inc: { 'items.$.quantity': quantity } });
    if (bumped.matchedCount > 0) return;

    const pushed = await CartSession.updateOne(
      { _id: sessionId, items: { $not: { $elemMatch: match } } },
      { $push: { items: { ...match, quantity, addedAt: new Date() } } }
    );
    if (pushed.matchedCount > 0) return;
  }
  throw new Error('Could not update the cart, please try again.');
}

export async function setCartItemQuantity(sessionId: string, productId: string, variantKey: string, quantity: number): Promise<boolean> {
  const { CartSession } = await db();
  const res = await CartSession.updateOne(
    { _id: sessionId, items: { $elemMatch: { productId, selectedVariantId: variantKey } } },
    { $set: { 'items.$.quantity': quantity } }
  );
  return res.matchedCount > 0;
}

export async function removeCartItem(sessionId: string, productId: string, variantKey: string): Promise<void> {
  const { CartSession } = await db();
  await CartSession.updateOne({ _id: sessionId }, { $pull: { items: { productId, selectedVariantId: variantKey } } });
}

export async function clearCartItems(sessionId: string): Promise<void> {
  const { CartSession } = await db();
  await CartSession.updateOne({ _id: sessionId }, { $set: { items: [], activeCouponCode: null } });
}

export async function setCartCoupon(sessionId: string, code: string | null): Promise<void> {
  const { CartSession } = await db();
  await CartSession.updateOne({ _id: sessionId }, { $set: { activeCouponCode: code } });
}
