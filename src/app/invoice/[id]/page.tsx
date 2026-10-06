import type { Metadata } from 'next';
import { cookies } from 'next/headers';
import { notFound } from 'next/navigation';
import crypto from 'crypto';
import { db } from '@/lib/models';
import { ADMIN_COOKIE_NAME, verifyAdminToken } from '@/lib/auth';
import { PrintButton } from '@/components/invoice/PrintButton';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: 'Tax Invoice', robots: { index: false, follow: false } };

interface InvoiceItem {
  productName: string;
  sku?: string;
  hsnCode?: string;
  gstRate?: number;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  taxableValue?: number;
  gstAmount?: number;
}

const inr = (n: number) => `₹${(Math.round(n * 100) / 100).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

function tokensMatch(a: string | null | undefined, b: string | undefined): boolean {
  if (!a || !b) return false;
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  return bufA.length === bufB.length && crypto.timingSafeEqual(bufA, bufB);
}

export default async function InvoicePage({ params, searchParams }: { params: { id: string }; searchParams: { t?: string } }) {
  const { Order, SiteSettings } = await db();
  const order = await Order.findById(decodeURIComponent(params.id));
  if (!order) notFound();

  const adminToken = cookies().get(ADMIN_COOKIE_NAME)?.value;
  const isAdmin = !!(adminToken && verifyAdminToken(adminToken));
  if (!isAdmin && !tokensMatch(order.accessToken, searchParams.t)) notFound();

  const settings = await SiteSettings.findById('singleton').lean();
  const seller = settings?.legalName || settings?.websiteName || 'Luminary';
  const items = (Array.isArray(order.items) ? order.items : []) as unknown as InvoiceItem[];
  const interState = order.igst > 0;

  return (
    <main className="min-h-screen bg-stone-100 py-8 px-4 print:bg-white print:p-0">
      <div className="max-w-3xl mx-auto bg-white rounded-2xl shadow-sm border border-stone-200 p-6 sm:p-10 print:shadow-none print:border-0 print:rounded-none">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-6 border-b border-stone-200 pb-6">
          <div>
            <h1 className="text-2xl font-bold text-brand-green-800">{seller}</h1>
            <p className="text-sm text-slate-600 mt-1 max-w-xs">{settings?.address}</p>
            {settings?.gstin && <p className="text-sm text-slate-700 mt-1">GSTIN: <b>{settings.gstin}</b></p>}
            <p className="text-sm text-slate-600">{settings?.contactPhone} · {settings?.contactEmail}</p>
          </div>
          <div className="sm:text-right">
            <div className="text-xs font-bold tracking-widest text-brand-orange-600">TAX INVOICE</div>
            <p className="text-sm text-slate-700 mt-1">Invoice no: <b>{order._id}</b></p>
            <p className="text-sm text-slate-700">Date: {order.date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</p>
            <p className="text-sm text-slate-700">Payment: {order.paymentMethod} ({order.paymentStatus})</p>
          </div>
        </div>

        <div className="grid sm:grid-cols-2 gap-6 py-6 text-sm">
          <div>
            <div className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">Billed & shipped to</div>
            <p className="font-semibold text-slate-900">{order.customerName}</p>
            <p className="text-slate-600">{order.shippingAddress}</p>
            <p className="text-slate-600">{order.city}, {order.state} - {order.pincode}</p>
            <p className="text-slate-600">{order.phone} · {order.email}</p>
          </div>
          <div>
            <div className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">Place of supply</div>
            <p className="text-slate-900">{order.state}</p>
            <p className="text-slate-600">{interState ? 'Inter-state supply (IGST)' : 'Intra-state supply (CGST + SGST)'}</p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-stone-50 text-left text-xs uppercase tracking-wider text-slate-500">
                <th className="p-2">Item</th>
                <th className="p-2">HSN</th>
                <th className="p-2 text-right">Qty</th>
                <th className="p-2 text-right">Rate</th>
                <th className="p-2 text-right">Taxable</th>
                <th className="p-2 text-right">GST</th>
                <th className="p-2 text-right">Amount</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item, i) => {
                const rate = item.gstRate ?? 18;
                const taxable = item.taxableValue ?? item.totalPrice / (1 + rate / 100);
                const gst = item.gstAmount ?? item.totalPrice - taxable;
                return (
                  <tr key={i} className="border-b border-stone-100 align-top">
                    <td className="p-2">
                      <div className="font-medium text-slate-900">{item.productName}</div>
                      {item.sku && <div className="text-xs text-slate-500">SKU {item.sku}</div>}
                    </td>
                    <td className="p-2 text-slate-600">{item.hsnCode ?? '-'}</td>
                    <td className="p-2 text-right">{item.quantity}</td>
                    <td className="p-2 text-right">{inr(item.unitPrice)}</td>
                    <td className="p-2 text-right">{inr(taxable)}</td>
                    <td className="p-2 text-right">{inr(gst)} <span className="text-xs text-slate-500">({rate}%)</span></td>
                    <td className="p-2 text-right font-medium">{inr(item.totalPrice)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="flex justify-end pt-6">
          <dl className="w-full sm:w-80 text-sm space-y-1.5">
            <div className="flex justify-between"><dt className="text-slate-600">Items total (incl. GST)</dt><dd>{inr(order.subtotal)}</dd></div>
            {order.discount > 0 && (
              <div className="flex justify-between text-emerald-700"><dt>Discount {order.couponCode ? `(${order.couponCode})` : ''}</dt><dd>-{inr(order.discount)}</dd></div>
            )}
            <div className="flex justify-between"><dt className="text-slate-600">Shipping</dt><dd>{order.shippingFee ? inr(order.shippingFee) : 'FREE'}</dd></div>
            <div className="flex justify-between border-t border-stone-200 pt-1.5"><dt className="text-slate-600">Taxable value</dt><dd>{inr(order.taxableAmount)}</dd></div>
            {interState ? (
              <div className="flex justify-between"><dt className="text-slate-600">IGST</dt><dd>{inr(order.igst)}</dd></div>
            ) : (
              <>
                <div className="flex justify-between"><dt className="text-slate-600">CGST</dt><dd>{inr(order.cgst)}</dd></div>
                <div className="flex justify-between"><dt className="text-slate-600">SGST</dt><dd>{inr(order.sgst)}</dd></div>
              </>
            )}
            <div className="flex justify-between border-t border-stone-300 pt-2 text-base font-bold text-slate-900">
              <dt>Grand total</dt><dd>{inr(order.totalAmount)}</dd>
            </div>
          </dl>
        </div>

        <p className="text-xs text-slate-500 mt-8">This is a computer-generated invoice and does not require a signature. Prices are inclusive of GST.</p>

        <div className="mt-6 flex justify-center"><PrintButton /></div>
      </div>
    </main>
  );
}
