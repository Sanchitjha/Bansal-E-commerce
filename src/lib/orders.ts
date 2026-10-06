import crypto from 'crypto';
import type { HydratedDocument } from 'mongoose';
import { db, type IOrder } from './models';
import { withTransaction } from './db';
import { revalidateCatalog } from './data';
import { addCartItem, setCartCoupon, setCartItemQuantity } from './cart-ops';

export class OrderError extends Error {
  constructor(message: string, public status = 400) {
    super(message);
  }
}

interface StoredItem {
  productId: string;
  quantity: number;
}

const storedItems = (items: unknown): StoredItem[] => (Array.isArray(items) ? (items as StoredItem[]) : []);

export function newAccessToken(): string {
  return crypto.randomBytes(18).toString('base64url');
}

export function newOrderId(): string {
  const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  return `LF-${date}-${crypto.randomInt(100000, 1000000)}`;
}

/**
 * Cancels an unpaid online order and puts its stock (and coupon use) back.
 * Guarded so a second call, or a call after payment, does nothing.
 */
export async function cancelPendingOrder(orderId: string, reason: string): Promise<boolean> {
  const m = await db();

  const cancelled = await withTransaction(async (session) => {
    const order = await m.Order.findOneAndUpdate(
      { _id: orderId, orderStatus: 'Pending Payment', paymentStatus: 'Pending' },
      { $set: { orderStatus: 'Cancelled', paymentStatus: 'Failed' } },
      { session, new: false }
    );
    if (!order) return false;

    for (const item of storedItems(order.items)) {
      await m.Product.updateOne({ _id: item.productId }, { $inc: { stock: item.quantity } }, { session });
    }
    if (order.couponCode) {
      await m.Coupon.updateOne({ code: order.couponCode, usageCount: { $gt: 0 } }, { $inc: { usageCount: -1 } }, { session });
    }
    await m.ActivityLog.create([{ adminName: 'System', action: `Cancelled unpaid order ${orderId}`, details: reason }], { session });
    return true;
  });

  if (cancelled) {
    try {
      revalidateCatalog();
    } catch {
      // Not inside a request (e.g. a script): the cache simply refreshes on its own schedule.
    }
  }
  return cancelled;
}

/** Online orders that were never paid (customer closed the tab) shouldn't hold stock forever. */
export async function releaseExpiredPendingOrders(maxAgeMinutes = 30): Promise<void> {
  const { Order } = await db();
  const cutoff = new Date(Date.now() - maxAgeMinutes * 60 * 1000);
  const stale = await Order.find({
    paymentMethod: { $ne: 'COD' },
    orderStatus: 'Pending Payment',
    paymentStatus: 'Pending',
    date: { $lt: cutoff },
  })
    .select('_id')
    .limit(50)
    .lean();

  for (const { _id } of stale) {
    await cancelPendingOrder(_id, `Payment not completed within ${maxAgeMinutes} minutes`).catch((err) => console.error(err));
  }
}

export interface PaidResult {
  order: HydratedDocument<IOrder>;
  /** true when this call was a repeat (verify + webhook both fire) and nothing changed. */
  alreadyPaid: boolean;
  /** true when the money arrived for an order we had already cancelled and could not re-stock. */
  needsRefund: boolean;
}

/** Idempotent: safe to call from both the browser verify step and the Razorpay webhook. */
export async function markOrderPaid(orderId: string, paymentRef: string): Promise<PaidResult | null> {
  const m = await db();
  const order = await m.Order.findById(orderId);
  if (!order) return null;
  if (order.paymentStatus === 'Paid') return { order, alreadyPaid: true, needsRefund: false };

  if (order.orderStatus === 'Pending Payment') {
    const res = await m.Order.updateOne(
      { _id: orderId, paymentStatus: 'Pending', orderStatus: 'Pending Payment' },
      { $set: { paymentStatus: 'Paid', orderStatus: 'Payment Confirmed', paymentRef } }
    );
    const fresh = (await m.Order.findById(orderId))!;
    return { order: fresh, alreadyPaid: res.modifiedCount === 0, needsRefund: false };
  }

  if (order.orderStatus === 'Cancelled') {
    // Payment landed after we released the stock. Try to take the stock back; otherwise flag a refund.
    try {
      await withTransaction(async (session) => {
        for (const item of storedItems(order.items)) {
          const r = await m.Product.updateOne({ _id: item.productId, stock: { $gte: item.quantity } }, { $inc: { stock: -item.quantity } }, { session });
          if (r.modifiedCount === 0) throw new OrderError('Stock no longer available', 409);
        }
        await m.Order.updateOne({ _id: orderId }, { $set: { paymentStatus: 'Paid', orderStatus: 'Payment Confirmed', paymentRef } }, { session });
        await m.ActivityLog.create(
          [{ adminName: 'System', action: `Reinstated order ${orderId}`, details: 'Payment arrived after the order was auto-cancelled.' }],
          { session }
        );
      });
      return { order: (await m.Order.findById(orderId))!, alreadyPaid: false, needsRefund: false };
    } catch (err) {
      if (!(err instanceof OrderError)) throw err;
      await m.Order.updateOne({ _id: orderId }, { $set: { paymentStatus: 'Paid', paymentRef } });
      await m.ActivityLog.create({
        adminName: 'System',
        action: `REFUND NEEDED for order ${orderId}`,
        details: `Payment ${paymentRef} received but the order was cancelled and stock is gone.`,
      });
      return { order: (await m.Order.findById(orderId))!, alreadyPaid: false, needsRefund: true };
    }
  }

  return { order, alreadyPaid: true, needsRefund: false };
}

/** After a failed or abandoned payment, put the customer's items back in their cart. */
export async function restoreCartFromOrder(sessionId: string, order: { items: unknown; couponCode?: string | null }) {
  const { Product } = await db();
  for (const item of storedItems(order.items)) {
    if (!(await Product.exists({ _id: item.productId }))) continue;
    const updated = await setCartItemQuantity(sessionId, item.productId, '', item.quantity);
    if (!updated) await addCartItem(sessionId, item.productId, '', item.quantity);
  }
  if (order.couponCode) await setCartCoupon(sessionId, order.couponCode);
}
