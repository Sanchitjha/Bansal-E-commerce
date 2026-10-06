'use client';

import React, { useState } from 'react';
import { Download, FileText } from 'lucide-react';
import { useLuminary } from '@/context/LuminaryContext';
import { Order, OrderStatus } from '@/types';
import { downloadCSV } from '../csv';
import { ORDER_STATUS_OPTIONS, btnGhost, card, errText, inr } from '../ui';

const OrderCard: React.FC<{ order: Order }> = ({ order }) => {
  const { updateOrderStatus, showToast } = useLuminary();
  const [courier, setCourier] = useState(order.courier ?? '');
  const [tracking, setTracking] = useState(order.trackingNumber ?? '');
  const [busy, setBusy] = useState(false);

  const changeStatus = async (status: OrderStatus) => {
    if (status === order.orderStatus) return;
    if (status === 'Cancelled' && !window.confirm(`Cancel order ${order.id}? Stock will be returned to inventory and the customer will be emailed.`)) return;
    setBusy(true);
    try {
      await updateOrderStatus(order.id, status, courier || undefined, tracking || undefined);
      showToast(`Order marked ${status}`, 'success');
    } catch (err) {
      showToast(errText(err), 'error');
    } finally {
      setBusy(false);
    }
  };

  const saveShipping = async () => {
    setBusy(true);
    try {
      await updateOrderStatus(order.id, order.orderStatus, courier || undefined, tracking || undefined);
      showToast('Shipping details saved', 'success');
    } catch (err) {
      showToast(errText(err), 'error');
    } finally {
      setBusy(false);
    }
  };

  const shippingDirty = courier !== (order.courier ?? '') || tracking !== (order.trackingNumber ?? '');

  return (
    <div className={`${card} p-4 space-y-3`}>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-2">
        <div>
          <span className="font-mono font-bold text-gold-300 text-sm">{order.id}</span>
          <span className="text-xs text-slate-400 ml-3">{new Date(order.date).toLocaleString('en-IN')}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400">Status</span>
          <select
            value={order.orderStatus}
            disabled={busy}
            onChange={(e) => changeStatus(e.target.value as OrderStatus)}
            className="px-2 py-1 text-xs bg-obsidian-900 border border-gold-500/40 rounded text-gold-300 font-bold outline-none"
          >
            {ORDER_STATUS_OPTIONS.map((st) => (
              <option key={st} value={st}>{st}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs text-slate-300">
        <div>
          <span className="text-slate-500 block">Customer</span>
          <strong className="text-slate-100">{order.customerName}</strong>
          <span className="block text-[11px] text-slate-400">{order.phone} · {order.email}</span>
        </div>
        <div>
          <span className="text-slate-500 block">Ship to</span>
          <span>{order.shippingAddress}, {order.city}, {order.state} - {order.pincode}</span>
        </div>
        <div>
          <span className="text-slate-500 block">Amount</span>
          <strong className="font-mono text-gold-300 text-sm">{inr(order.totalAmount)}</strong>
          <span className="block text-[10px] text-slate-400">
            {order.paymentMethod} · {order.paymentStatus}
            {order.couponCode ? ` · coupon ${order.couponCode}` : ''}
          </span>
          {order.paymentStatus === 'Paid' && order.orderStatus === 'Cancelled' && (
            <span className="block text-[10px] font-bold text-rose-400 mt-0.5">Paid but cancelled: issue a refund in Razorpay</span>
          )}
        </div>
      </div>

      <div className="text-[11px] text-slate-400 border-t border-slate-800 pt-2">
        {order.items.map((i) => `${i.productName} × ${i.quantity}`).join('  ·  ')}
      </div>

      <div className="flex flex-wrap items-end gap-2 border-t border-slate-800 pt-3">
        <div>
          <label className="block text-[10px] text-slate-500 mb-0.5">Courier</label>
          <input value={courier} onChange={(e) => setCourier(e.target.value)} placeholder="e.g. Delhivery" className="w-36 p-1.5 text-xs bg-obsidian-900 border border-slate-800 rounded text-slate-100 outline-none focus:border-gold-500" />
        </div>
        <div>
          <label className="block text-[10px] text-slate-500 mb-0.5">Tracking number</label>
          <input value={tracking} onChange={(e) => setTracking(e.target.value)} placeholder="AWB / tracking id" className="w-44 p-1.5 text-xs bg-obsidian-900 border border-slate-800 rounded text-slate-100 outline-none focus:border-gold-500 font-mono" />
        </div>
        <button onClick={saveShipping} disabled={!shippingDirty || busy} className={btnGhost}>Save shipping</button>
        <a href={`/invoice/${encodeURIComponent(order.id)}`} target="_blank" rel="noopener noreferrer" className={`${btnGhost} inline-flex items-center gap-1 ml-auto`}>
          <FileText className="w-3.5 h-3.5" /> Invoice
        </a>
      </div>
    </div>
  );
};

export const OrdersTab: React.FC = () => {
  const { orders } = useLuminary();
  const [filter, setFilter] = useState<'all' | OrderStatus>('all');
  const [query, setQuery] = useState('');

  const q = query.trim().toLowerCase();
  const visible = orders.filter(
    (o) =>
      (filter === 'all' || o.orderStatus === filter) &&
      (!q || o.id.toLowerCase().includes(q) || o.customerName.toLowerCase().includes(q) || o.phone.includes(q) || o.email.toLowerCase().includes(q))
  );

  const exportRegister = () =>
    downloadCSV(`sales-register-${new Date().toISOString().slice(0, 10)}.csv`, [
      ['Order ID', 'Date', 'Customer', 'Phone', 'Email', 'City', 'State', 'Pincode', 'Items', 'Subtotal', 'Discount', 'Coupon', 'Shipping', 'Total', 'Payment method', 'Payment status', 'Order status', 'Courier', 'Tracking'],
      ...visible.map((o) => [
        o.id,
        new Date(o.date).toLocaleString('en-IN'),
        o.customerName,
        o.phone,
        o.email,
        o.city,
        o.state,
        o.pincode,
        o.items.map((i) => `${i.productName} x${i.quantity}`).join('; '),
        o.subtotal,
        o.discount,
        o.couponCode ?? '',
        o.shippingFee,
        o.totalAmount,
        o.paymentMethod,
        o.paymentStatus,
        o.orderStatus,
        o.courier ?? '',
        o.trackingNumber ?? '',
      ]),
    ]);

  return (
    <div className="space-y-4">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        <div>
          <h3 className="font-serif text-lg font-bold text-slate-100">Orders ({visible.length})</h3>
          <p className="text-xs text-slate-400">Update status, add the courier and tracking number. Customers are emailed on shipping, delivery and cancellation.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search id, name, phone…" className="p-2 text-xs bg-obsidian-950 border border-slate-800 rounded text-slate-100 outline-none focus:border-gold-500 w-48" />
          <select value={filter} onChange={(e) => setFilter(e.target.value as 'all' | OrderStatus)} className="p-2 text-xs bg-obsidian-950 border border-slate-800 rounded text-slate-100 outline-none">
            <option value="all">All statuses</option>
            {ORDER_STATUS_OPTIONS.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
          <button onClick={exportRegister} className={`${btnGhost} flex items-center gap-1`}>
            <Download className="w-3.5 h-3.5" /> Export CSV
          </button>
        </div>
      </div>

      <div className="space-y-3">
        {visible.map((o) => (
          <OrderCard key={`${o.id}-${o.orderStatus}-${o.courier}-${o.trackingNumber}`} order={o} />
        ))}
        {visible.length === 0 && <p className="text-center text-sm text-slate-500 py-10">No orders match.</p>}
      </div>
    </div>
  );
};
