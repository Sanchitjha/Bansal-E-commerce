// Runtime guards mirroring the TS unions in src/types/index.ts, since Postgres
// columns for these are plain strings (see prisma/schema.prisma).

export const CATEGORY_TYPES = ['fragrance', 'ayurvedic', 'gadgets'] as const;

export const ORDER_STATUSES = [
  'Pending Payment',
  'Payment Confirmed',
  'Processing',
  'Packed',
  'Shipped',
  'Out for Delivery',
  'Delivered',
  'Cancelled',
  'Returned',
  'Refunded',
] as const;

export const PAYMENT_METHODS = ['Razorpay', 'Cashfree', 'UPI', 'Credit Card', 'COD'] as const;

export const PAYMENT_STATUSES = ['Paid', 'Pending', 'Failed', 'Refunded'] as const;

export const BULK_ENQUIRY_STATUSES = [
  'New',
  'Contacted',
  'Quotation Sent',
  'Negotiation',
  'Confirmed',
  'Rejected',
  'Completed',
] as const;

export const COUPON_TYPES = ['percentage', 'flat'] as const;

export function isOneOf<T extends readonly string[]>(list: T, value: unknown): value is T[number] {
  return typeof value === 'string' && (list as readonly string[]).includes(value);
}
