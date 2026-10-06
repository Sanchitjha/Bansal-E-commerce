import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCustomerFromRequest } from '@/lib/customer-auth';
import { badRequest, serverError, unauthorized } from '@/lib/api-helpers';
import { normalizeIndianMobile } from '@/lib/india';
import { newAccessToken } from '@/lib/orders';

export async function GET(request: NextRequest) {
  const session = getCustomerFromRequest(request);
  if (!session) return unauthorized();

  try {
    const customer = await prisma.customer.findUnique({ where: { id: session.sub } });
    if (!customer) return unauthorized();

    let orders = await prisma.order.findMany({
      where: { customerId: customer.id },
      orderBy: { date: 'desc' },
      take: 50,
    });

    // Make sure every order has an invoice-link token.
    orders = await Promise.all(
      orders.map((o) => (o.accessToken ? o : prisma.order.update({ where: { id: o.id }, data: { accessToken: newAccessToken() } })))
    );

    return NextResponse.json({
      customer: { id: customer.id, name: customer.name, email: customer.email, phone: customer.phone },
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

    const customer = await prisma.customer.update({ where: { id: session.sub }, data });
    return NextResponse.json({ id: customer.id, name: customer.name, email: customer.email, phone: customer.phone });
  } catch (err) {
    return serverError(err);
  }
}
