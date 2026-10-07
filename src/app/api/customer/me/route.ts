import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/models';
import { getCustomerFromRequest } from '@/lib/customer-auth';
import { badRequest, serverError, unauthorized } from '@/lib/api-helpers';
import { normalizeIndianMobile } from '@/lib/india';
import { newAccessToken } from '@/lib/orders';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const session = getCustomerFromRequest(request);
  if (!session) return unauthorized();

  try {
    const { Customer, Order } = await db();
    const customer = await Customer.findById(session.sub);
    if (!customer) return unauthorized();

    const orders = await Order.find({ customerId: customer._id }).sort({ date: -1 }).limit(50);

    // Make sure every order has an invoice-link token.
    for (const order of orders) {
      if (!order.accessToken) {
        order.accessToken = newAccessToken();
        await order.save();
      }
    }

    return NextResponse.json({
      customer: { id: customer._id, name: customer.name, email: customer.email, phone: customer.phone },
      orders,
    });
  } catch (err) {
    return serverError(err);
  }
}

export async function PATCH(request: NextRequest) {
  const session = getCustomerFromRequest(request);
  if (!session) return unauthorized();

  try {
    const body = await request.json();
    const data: { name?: string; phone?: string } = {};
    if (body.name !== undefined) {
      const name = String(body.name).trim().slice(0, 100);
      if (!name) return badRequest('Name cannot be empty.');
      data.name = name;
    }
    if (body.phone !== undefined) {
      const phone = normalizeIndianMobile(String(body.phone));
      if (!phone) return badRequest('Please enter a valid 10-digit Indian mobile number.');
      data.phone = phone;
    }

    const { Customer } = await db();
    const customer = await Customer.findByIdAndUpdate(session.sub, { $set: data }, { new: true });
    if (!customer) return unauthorized();
    return NextResponse.json({ id: customer._id, name: customer.name, email: customer.email, phone: customer.phone });
  } catch (err) {
    return serverError(err);
  }
}
