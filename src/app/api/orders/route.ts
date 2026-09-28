import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { attachCartCookie, getExistingCartSessionId } from '@/lib/cart-session';
import { badRequest, requireAdmin, serverError, unauthorized } from '@/lib/api-helpers';
import { buildCartPayload } from '@/lib/cart-response';
import { PAYMENT_METHODS, isOneOf } from '@/lib/validators';

export async function GET(request: NextRequest) {
  const admin = requireAdmin(request);
  if (!admin) return unauthorized();

  try {
    const orders = await prisma.order.findMany({ orderBy: { date: 'desc' } });
    return NextResponse.json(orders);
  } catch (err) {
    return serverError(err);
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const required = ['customerName', 'phone', 'email', 'shippingAddress', 'city', 'state', 'pincode', 'paymentMethod'];
    for (const field of required) {
      if (!body[field]) return badRequest(`Missing required field: ${field}`);
    }
    if (!isOneOf(PAYMENT_METHODS, body.paymentMethod)) {
      return badRequest(`Invalid payment method: ${body.paymentMethod}`);
    }

    const sessionId = await getExistingCartSessionId(request);
    if (!sessionId) return badRequest('Cart is empty');

    const cart = await buildCartPayload(sessionId);
    if (cart.items.length === 0) return badRequest('Cart is empty');

    const orderItems = cart.items.map((item) => ({
      productId: item.product.id,
      productName: item.product.name,
      sku: item.product.sku,
      quantity: item.quantity,
      mrp: item.product.mrp,
      sellingPrice: item.product.sellingPrice,
      unitPrice: item.unitPrice,
      totalPrice: item.totalPrice,
      gstAmount: Math.round(item.totalPrice * (item.product.gstRate / 100) * 100) / 100,
    }));

    const isMaharashtra = String(body.state).toLowerCase().includes('maharashtra');
    const now = new Date();
    const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '');
    const orderNum = Math.floor(100000 + Math.random() * 900000);
    const orderId = `LF-${dateStr}-${orderNum}`;

    const totals = cart.totals;

    const order = await prisma.$transaction(async (tx) => {
      const created = await tx.order.create({
        data: {
          id: orderId,
          date: now,
          customerName: body.customerName,
          phone: body.phone,
          email: body.email,
          shippingAddress: body.shippingAddress,
          city: body.city,
          state: body.state,
          pincode: body.pincode,
          items: orderItems,
          subtotal: totals.subtotal,
          discount: totals.couponDiscount,
          couponCode: cart.appliedCoupon?.code,
          taxableAmount: totals.taxableAmount,
          gstAmount: totals.gstAmount,
          cgst: isMaharashtra ? totals.cgst : 0,
          sgst: isMaharashtra ? totals.sgst : 0,
          igst: !isMaharashtra ? totals.gstAmount : 0,
          shippingFee: totals.shippingFee,
          totalAmount: totals.grandTotal,
          paymentMethod: body.paymentMethod,
          paymentStatus: body.paymentMethod === 'COD' ? 'Pending' : 'Paid',
          orderStatus: 'Payment Confirmed',
        },
      });

      for (const item of cart.items) {
        await tx.product.update({
          where: { id: item.product.id },
          data: { stock: Math.max(0, item.product.stock - item.quantity) },
        });
      }

      if (cart.appliedCoupon) {
        await tx.coupon.update({
          where: { id: cart.appliedCoupon.id },
          data: { usageCount: { increment: 1 } },
        });
      }

      await tx.cartItem.deleteMany({ where: { sessionId } });
      await tx.cartSession.update({ where: { id: sessionId }, data: { activeCouponCode: null } });

      await tx.activityLog.create({
        data: {
          adminName: 'Storefront',
          action: `Created Order ${orderId}`,
          details: `Customer: ${body.customerName}, Total: ₹${totals.grandTotal}`,
        },
      });

      await tx.sheetSyncLog.createMany({
        data: [
          { sheetName: 'SALES REGISTER', orderId, event: `Appended order ${orderId} customer ${body.customerName}` },
          { sheetName: 'PRODUCT SALES', orderId, event: `Updated product sales units for order ${orderId}` },
          { sheetName: 'MONTHLY SUMMARY', orderId, event: `Updated monthly revenue by +₹${totals.grandTotal}` },
        ],
      });

      return created;
    });

    const response = NextResponse.json(order, { status: 201 });
    attachCartCookie(response, sessionId);
    return response;
  } catch (err) {
    return serverError(err);
  }
}
