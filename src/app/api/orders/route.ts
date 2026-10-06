import { NextRequest, NextResponse } from 'next/server';
import type { HydratedDocument } from 'mongoose';
import { db, type IOrder } from '@/lib/models';
import { isDuplicateKey, withTransaction } from '@/lib/db';
import { revalidateCatalog } from '@/lib/data';
import { attachCartCookie, getExistingCartSessionId } from '@/lib/cart-session';
import { badRequest, requireAdmin, serverError, unauthorized } from '@/lib/api-helpers';
import { buildCartPayload } from '@/lib/cart-response';
import { getCustomerFromRequest } from '@/lib/customer-auth';
import { canonicalState, isValidEmail, normalizeIndianMobile } from '@/lib/india';
import { sendOrderPlacedEmails } from '@/lib/order-notify';
import { OrderError, cancelPendingOrder, newAccessToken, newOrderId, releaseExpiredPendingOrders, restoreCartFromOrder } from '@/lib/orders';
import { createRazorpayOrder, razorpayConfigured, razorpayKeyId } from '@/lib/payments';
import { isPincodeBlocked } from '@/lib/pincode';
import { PAYMENT_METHODS, isOneOf } from '@/lib/validators';

export async function GET(request: NextRequest) {
  const admin = requireAdmin(request);
  if (!admin) return unauthorized();

  try {
    await releaseExpiredPendingOrders().catch(() => {});
    const { Order } = await db();
    return NextResponse.json(await Order.find().sort({ date: -1 }));
  } catch (err) {
    return serverError(err);
  }
}

const clean = (v: unknown, max: number) => String(v ?? '').trim().slice(0, max);
const escapeRegex = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const customerName = clean(body.customerName, 100);
    const shippingAddress = clean(body.shippingAddress, 300);
    const city = clean(body.city, 80);
    const pincode = clean(body.pincode, 6);
    const email = clean(body.email, 254).toLowerCase();
    const phone = normalizeIndianMobile(String(body.phone ?? ''));
    const state = canonicalState(String(body.state ?? ''));

    if (!customerName) return badRequest('Please enter your full name.');
    if (!phone) return badRequest('Please enter a valid 10-digit Indian mobile number.');
    if (!isValidEmail(email)) return badRequest('Please enter a valid email address.');
    if (shippingAddress.length < 8) return badRequest('Please enter your complete shipping address.');
    if (!city) return badRequest('Please enter your city.');
    if (!state) return badRequest('Please select your state.');
    if (!/^[1-9]\d{5}$/.test(pincode)) return badRequest('Please enter a valid 6-digit pincode.');
    if (!isOneOf(PAYMENT_METHODS, body.paymentMethod) || !['COD', 'Razorpay'].includes(body.paymentMethod)) {
      return badRequest('Please choose a valid payment method.');
    }
    const paymentMethod = body.paymentMethod as 'COD' | 'Razorpay';

    const m = await db();
    const settings = await m.SiteSettings.findById('singleton');
    if (isPincodeBlocked(pincode, settings?.blockedPincodes ?? '')) {
      return badRequest('Sorry, we do not deliver to this pincode yet.');
    }
    if (paymentMethod === 'COD' && settings && !settings.codEnabled) {
      return badRequest('Cash on delivery is currently unavailable. Please pay online.');
    }
    if (paymentMethod === 'Razorpay' && !razorpayConfigured()) {
      return badRequest('Online payment is not available right now. Please choose Cash on Delivery.');
    }

    await releaseExpiredPendingOrders().catch(() => {});

    const sessionId = await getExistingCartSessionId(request);
    if (!sessionId) return badRequest('Your cart is empty.');

    const cart = await buildCartPayload(sessionId, state);
    if (cart.items.length === 0) return badRequest('Your cart is empty.');

    for (const item of cart.items) {
      if (item.product.status !== 'active') {
        return badRequest(`${item.product.name} is no longer available. Please remove it from your cart.`);
      }
    }

    const totals = cart.totals;
    const coupon = totals.couponDiscount > 0 ? cart.appliedCoupon : null;

    if (coupon?.firstOrderOnly) {
      const previous = await m.Order.countDocuments({
        orderStatus: { $ne: 'Cancelled' },
        paymentStatus: { $ne: 'Failed' },
        $or: [{ email: new RegExp(`^${escapeRegex(email)}$`, 'i') }, { phone }],
      });
      if (previous > 0) {
        return badRequest(`Coupon ${coupon.code} is valid on your first order only. Please remove it to continue.`);
      }
    }

    const customer = getCustomerFromRequest(request);
    const isOnline = paymentMethod !== 'COD';

    const orderItems = cart.items.map((item, i) => ({
      productId: item.product._id,
      productName: item.product.name,
      sku: item.product.sku,
      hsnCode: item.product.hsnCode,
      gstRate: item.product.gstRate,
      quantity: item.quantity,
      mrp: item.product.mrp,
      sellingPrice: item.product.sellingPrice,
      unitPrice: item.unitPrice,
      totalPrice: item.totalPrice,
      taxableValue: totals.lines[i].taxableValue,
      gstAmount: totals.lines[i].gstAmount,
    }));

    let createdId: string | null = null;
    for (let attempt = 0; attempt < 3 && !createdId; attempt++) {
      try {
        createdId = await withTransaction(async (session) => {
          // Reserve stock atomically: the update only matches while enough units remain.
          for (const item of cart.items) {
            const reserved = await m.Product.updateOne(
              { _id: item.product._id, status: 'active', stock: { $gte: item.quantity } },
              { $inc: { stock: -item.quantity } },
              { session }
            );
            if (reserved.modifiedCount === 0) {
              const current = await m.Product.findById(item.product._id).select('stock').session(session);
              const left = current?.stock ?? 0;
              throw new OrderError(
                left > 0
                  ? `Only ${left} unit${left === 1 ? '' : 's'} of ${item.product.name} left. Please update your cart.`
                  : `${item.product.name} just went out of stock. Please remove it from your cart.`,
                409
              );
            }
          }

          const [created] = await m.Order.create(
            [
              {
                _id: newOrderId(),
                date: new Date(),
                customerName,
                phone,
                email,
                shippingAddress,
                city,
                state,
                pincode,
                items: orderItems,
                subtotal: totals.subtotal,
                discount: totals.couponDiscount,
                couponCode: coupon?.code ?? null,
                taxableAmount: totals.taxableAmount,
                gstAmount: totals.gstAmount,
                cgst: totals.cgst,
                sgst: totals.sgst,
                igst: totals.igst,
                shippingFee: totals.shippingFee,
                totalAmount: totals.grandTotal,
                paymentMethod,
                paymentStatus: 'Pending',
                orderStatus: isOnline ? 'Pending Payment' : 'Processing',
                accessToken: newAccessToken(),
                customerId: customer?.sub ?? null,
              },
            ],
            { session }
          );

          if (coupon) await m.Coupon.updateOne({ _id: coupon._id }, { $inc: { usageCount: 1 } }, { session });
          await m.CartSession.updateOne({ _id: sessionId }, { $set: { items: [], activeCouponCode: null } }, { session });
          await m.ActivityLog.create(
            [
              {
                adminName: 'Storefront',
                action: `Created Order ${created._id}`,
                details: `Customer: ${customerName}, Total: ₹${totals.grandTotal}, ${paymentMethod}`,
              },
            ],
            { session }
          );
          await m.SheetSyncLog.insertMany(
            [
              { sheetName: 'SALES REGISTER', orderId: created._id, event: `Appended order ${created._id} customer ${customerName}` },
              { sheetName: 'PRODUCT SALES', orderId: created._id, event: `Updated product sales units for order ${created._id}` },
              { sheetName: 'MONTHLY SUMMARY', orderId: created._id, event: `Updated monthly revenue by +₹${totals.grandTotal}` },
            ],
            { session }
          );
          return created._id as string;
        });
      } catch (err) {
        // A random order-id collision is the only retryable failure.
        if (isDuplicateKey(err) && attempt < 2) continue;
        throw err;
      }
    }
    if (!createdId) throw new Error('Could not allocate an order id');
    // Re-read outside the transaction so the document is no longer tied to its (now closed) session.
    const order: HydratedDocument<IOrder> = (await m.Order.findById(createdId))!;
    revalidateCatalog();

    if (!isOnline) {
      await sendOrderPlacedEmails(order);
      const response = NextResponse.json({ order }, { status: 201 });
      attachCartCookie(response, sessionId);
      return response;
    }

    try {
      const gatewayOrder = await createRazorpayOrder({
        amountInRupees: order.totalAmount,
        receipt: order._id,
        notes: { orderId: order._id },
      });
      order.gatewayOrderId = gatewayOrder.id;
      await order.save();

      const response = NextResponse.json(
        {
          order,
          razorpay: {
            keyId: razorpayKeyId(),
            gatewayOrderId: gatewayOrder.id,
            amount: Math.round(order.totalAmount * 100),
            name: settings?.websiteName ?? 'Luminary',
            prefill: { name: customerName, email, contact: phone },
          },
        },
        { status: 201 }
      );
      attachCartCookie(response, sessionId);
      return response;
    } catch (err) {
      console.error(err);
      await cancelPendingOrder(order._id, 'Could not start the payment gateway');
      await restoreCartFromOrder(sessionId, order);
      return NextResponse.json({ error: 'We could not start the payment. Please try again or choose Cash on Delivery.' }, { status: 502 });
    }
  } catch (err) {
    if (err instanceof OrderError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    return serverError(err);
  }
}
