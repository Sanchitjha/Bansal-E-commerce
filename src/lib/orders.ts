import crypto from 'crypto';
import { prisma } from './prisma';
import { revalidateCatalog } from './data';

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
  const cancelled = await prisma.$transaction(async (tx) => {
    const res = await tx.order.updateMany({
      where: { id: orderId, orderStatus: 'Pending Payment', paymentStatus: 'Pending' },
      data: { orderStatus: 'Cancelled', paymentStatus: 'Failed' },
    });
    if (res.count === 0) return false;

    const order = await tx.order.findUnique({ where: { id: orderId } });
    if (!order) return false;

    for (const item of storedItems(order.items)) {
      await tx.product.updateMany({ where: { id: item.productId }, data: { stock: { increment: item.quantity } } });
    }
    if (order.couponCode) {
      await tx.coupon.updateMany({ where: { code: order.couponCode, usageCount: { gt: 0 } }, data: { usageCount: { decrement: 1 } } });
    }
    await tx.activityLog.create({
      data: { adminName: 'System', action: `Cancelled unpaid order ${orderId}`, details: reason },
    });
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
  const cutoff = new Date(Date.now() - maxAgeMinutes * 60 * 1000);
  const stale = await prisma.order.findMany({
    where: { paymentMethod: { not: 'COD' }, orderStatus: 'Pending Payment', paymentStatus: 'Pending', date: { lt: cutoff } },
    select: { id: true },
    take: 50,
  });
  for (const { id } of stale) {
    await cancelPendingOrder(id, `Payment not completed within ${maxAgeMinutes} minutes`).catch((err) => console.error(err));
  }
}

export interface PaidResult {
  order: NonNullable<Awaited<ReturnType<typeof prisma.order.findUnique>>>;
  /** true when this call was a repeat (verify + webhook both fire) and nothing changed. */
  alreadyPaid: boolean;
  /** true when the money arrived for an order we had already cancelled and could not re-stock. */
  needsRefund: boolean;
}

/** Idempotent: safe to call from both the browser verify step and the Razorpay webhook. */
export async function markOrderPaid(orderId: string, paymentRef: string): Promise<PaidResult | null> {
  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (!order) return null;
  if (order.paymentStatus === 'Paid') return { order, alreadyPaid: true, needsRefund: false };

  if (order.orderStatus === 'Pending Payment') {
    const res = await prisma.order.updateMany({
      where: { id: orderId, paymentStatus: 'Pending', orderStatus: 'Pending Payment' },
      data: { paymentStatus: 'Paid', orderStatus: 'Payment Confirmed', paymentRef },
    });
    const fresh = (await prisma.order.findUnique({ where: { id: orderId } }))!;
    return { order: fresh, alreadyPaid: res.count === 0, needsRefund: false };
  }

  if (order.orderStatus === 'Cancelled') {
    // Payment landed after we released the stock. Try to take the stock back; otherwise flag a refund.
    try {
      await prisma.$transaction(async (tx) => {
        for (const item of storedItems(order.items)) {
          const r = await tx.product.updateMany({
            where: { id: item.productId, stock: { gte: item.quantity } },
            data: { stock: { decrement: item.quantity } },
          });
          if (r.count === 0) throw new OrderError('Stock no longer available', 409);
        }
        await tx.order.update({
          where: { id: orderId },
          data: { paymentStatus: 'Paid', orderStatus: 'Payment Confirmed', paymentRef },
        });
        await tx.activityLog.create({
          data: { adminName: 'System', action: `Reinstated order ${orderId}`, details: 'Payment arrived after the order was auto-cancelled.' },
        });
      });
      return { order: (await prisma.order.findUnique({ where: { id: orderId } }))!, alreadyPaid: false, needsRefund: false };
    } catch (err) {
      if (!(err instanceof OrderError)) throw err;
      const updated = await prisma.order.update({ where: { id: orderId }, data: { paymentStatus: 'Paid', paymentRef } });
      await prisma.activityLog.create({
        data: { adminName: 'System', action: `REFUND NEEDED for order ${orderId}`, details: `Payment ${paymentRef} received but the order was cancelled and stock is gone.` },
      });
      return { order: updated, alreadyPaid: false, needsRefund: true };
    }
  }

  return { order, alreadyPaid: true, needsRefund: false };
}

/** After a failed or abandoned payment, put the customer's items back in their cart. */
export async function restoreCartFromOrder(sessionId: string, order: { items: unknown; couponCode: string | null }) {
  for (const item of storedItems(order.items)) {
    const product = await prisma.product.findUnique({ where: { id: item.productId }, select: { id: true } });
    if (!product) continue;
    await prisma.cartItem.upsert({
      where: { sessionId_productId_selectedVariantId: { sessionId, productId: item.productId, selectedVariantId: '' } },
      create: { sessionId, productId: item.productId, quantity: item.quantity, selectedVariantId: '' },
      update: { quantity: item.quantity },
    });
  }
  if (order.couponCode) {
    await prisma.cartSession.update({ where: { id: sessionId }, data: { activeCouponCode: order.couponCode } });
  }
}
