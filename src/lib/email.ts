import { siteUrl } from './site';

interface MailOrderItem {
  productName: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

export interface MailOrder {
  id: string;
  customerName: string;
  email: string;
  phone: string;
  shippingAddress: string;
  city: string;
  state: string;
  pincode: string;
  items: unknown;
  subtotal: number;
  discount: number;
  shippingFee: number;
  totalAmount: number;
  paymentMethod: string;
  paymentStatus: string;
  orderStatus: string;
  courier?: string | null;
  trackingNumber?: string | null;
  accessToken?: string | null;
}

const esc = (s: unknown) =>
  String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c] as string);
const inr = (n: number) => `₹${Math.round(n * 100) / 100}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',');

export function emailConfigured(): boolean {
  return !!(process.env.RESEND_API_KEY && process.env.EMAIL_FROM);
}

/** Sends through Resend. Never throws: a mail failure must not break an order. */
export async function sendEmail(params: { to: string; subject: string; html: string }): Promise<boolean> {
  if (!emailConfigured()) return false;
  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ from: process.env.EMAIL_FROM, to: [params.to], subject: params.subject, html: params.html }),
    });
    if (!res.ok) console.error('Email send failed', res.status, await res.text().catch(() => ''));
    return res.ok;
  } catch (err) {
    console.error('Email send error', err);
    return false;
  }
}

function wrap(brand: string, title: string, body: string): string {
  return `<div style="font-family:Arial,Helvetica,sans-serif;background:#f6f0e4;padding:24px">
  <div style="max-width:560px;margin:0 auto;background:#fff;border-radius:16px;padding:28px;color:#1e293b">
    <div style="font-size:22px;font-weight:700;color:#264b20;margin-bottom:4px">${esc(brand)}</div>
    <h2 style="font-size:18px;margin:16px 0 8px">${esc(title)}</h2>
    ${body}
    <p style="font-size:12px;color:#64748b;margin-top:24px">This is an automated message from ${esc(brand)}.</p>
  </div></div>`;
}

function itemsTable(order: MailOrder): string {
  const items = (Array.isArray(order.items) ? order.items : []) as MailOrderItem[];
  const rows = items
    .map(
      (i) =>
        `<tr><td style="padding:6px 0">${esc(i.productName)} × ${i.quantity}</td><td style="padding:6px 0;text-align:right">${inr(i.totalPrice)}</td></tr>`
    )
    .join('');
  return `<table style="width:100%;font-size:14px;border-collapse:collapse;border-top:1px solid #e7e5e4;border-bottom:1px solid #e7e5e4">${rows}
    <tr><td style="padding:6px 0;color:#64748b">Discount</td><td style="text-align:right;color:#64748b">-${inr(order.discount)}</td></tr>
    <tr><td style="padding:6px 0;color:#64748b">Shipping</td><td style="text-align:right;color:#64748b">${order.shippingFee ? inr(order.shippingFee) : 'FREE'}</td></tr>
    <tr><td style="padding:8px 0;font-weight:700">Total</td><td style="text-align:right;font-weight:700">${inr(order.totalAmount)}</td></tr></table>`;
}

function invoiceLink(order: MailOrder): string {
  return order.accessToken ? `${siteUrl()}/invoice/${encodeURIComponent(order.id)}?t=${order.accessToken}` : '';
}

export function orderConfirmationEmail(order: MailOrder, brand: string) {
  const invoice = invoiceLink(order);
  const payLine =
    order.paymentMethod === 'COD'
      ? 'Payment: Cash on Delivery. Please keep the amount ready at the time of delivery.'
      : `Payment: ${esc(order.paymentMethod)} (${esc(order.paymentStatus)}).`;
  const html = wrap(
    brand,
    `Thank you, ${order.customerName}! Your order is confirmed`,
    `<p style="font-size:14px;margin:0 0 12px">Order ID: <b>${esc(order.id)}</b></p>
    ${itemsTable(order)}
    <p style="font-size:14px">${payLine}</p>
    <p style="font-size:14px;color:#475569">Delivering to: ${esc(order.shippingAddress)}, ${esc(order.city)}, ${esc(order.state)} - ${esc(order.pincode)}</p>
    ${invoice ? `<p style="margin-top:16px"><a href="${invoice}" style="background:#f26b1d;color:#fff;padding:10px 18px;border-radius:999px;text-decoration:none;font-size:14px;font-weight:600">View invoice</a></p>` : ''}
    <p style="font-size:13px;color:#475569">You can track this order on our website using your Order ID and phone number.</p>`
  );
  return { subject: `Order confirmed: ${order.id}`, html };
}

export function orderStatusEmail(order: MailOrder, brand: string) {
  const tracking =
    order.courier || order.trackingNumber
      ? `<p style="font-size:14px">Courier: <b>${esc(order.courier ?? '-')}</b><br/>Tracking number: <b>${esc(order.trackingNumber ?? '-')}</b></p>`
      : '';
  const html = wrap(
    brand,
    `Your order is now: ${order.orderStatus}`,
    `<p style="font-size:14px;margin:0 0 12px">Order ID: <b>${esc(order.id)}</b></p>${tracking}
    <p style="font-size:13px;color:#475569">Track it anytime on our website with your Order ID and phone number.</p>`
  );
  return { subject: `Order ${order.id}: ${order.orderStatus}`, html };
}

export function adminNewOrderEmail(order: MailOrder, brand: string) {
  const html = wrap(
    brand,
    `New order ${order.id}`,
    `<p style="font-size:14px">${esc(order.customerName)} · ${esc(order.phone)} · ${esc(order.email)}</p>
    ${itemsTable(order)}
    <p style="font-size:14px">${esc(order.paymentMethod)} · ${esc(order.paymentStatus)}<br/>${esc(order.shippingAddress)}, ${esc(order.city)}, ${esc(order.state)} - ${esc(order.pincode)}</p>`
  );
  return { subject: `New order ${order.id} (${inr(order.totalAmount)})`, html };
}
