'use client';

import React, { useMemo } from 'react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { useLuminary } from '@/context/LuminaryContext';
import { card, inr } from '../ui';

const NOT_REVENUE = ['Cancelled', 'Returned', 'Refunded', 'Pending Payment'];
const OPEN_STATUSES = ['Pending Payment', 'Payment Confirmed', 'Processing', 'Packed'];
const CATEGORY_LABELS: Record<string, string> = { fragrance: 'Fragrances', ayurvedic: 'Ayurvedic', gadgets: 'Mini Gadgets' };

export const OverviewTab: React.FC = () => {
  const { orders, adminProducts, bulkEnquiries } = useLuminary();

  const stats = useMemo(() => {
    const counted = orders.filter((o) => !NOT_REVENUE.includes(o.orderStatus));
    const revenue = counted.reduce((sum, o) => sum + o.totalAmount, 0);
    const open = orders.filter((o) => OPEN_STATUSES.includes(o.orderStatus)).length;
    const lowStock = adminProducts.filter((p) => p.status === 'active' && p.stock <= p.lowStockThreshold).length;

    const days = Array.from({ length: 7 }, (_, i) => {
      const d = new Date();
      d.setHours(0, 0, 0, 0);
      d.setDate(d.getDate() - (6 - i));
      return { key: d.toLocaleDateString('en-CA'), name: d.toLocaleDateString('en-IN', { weekday: 'short' }), Sales: 0 };
    });
    counted.forEach((o) => {
      const day = days.find((d) => d.key === new Date(o.date).toLocaleDateString('en-CA'));
      if (day) day.Sales += o.totalAmount;
    });

    const categoryOf = new Map(adminProducts.map((p) => [p.id, p.category]));
    const byCategory: Record<string, number> = {};
    counted.forEach((o) =>
      o.items.forEach((item) => {
        const cat = categoryOf.get(item.productId) ?? 'other';
        byCategory[cat] = (byCategory[cat] ?? 0) + item.totalPrice;
      })
    );
    const categoryTotal = Object.values(byCategory).reduce((a, b) => a + b, 0);

    return { revenue, open, lowStock, days, byCategory, categoryTotal, countedOrders: counted.length };
  }, [orders, adminProducts]);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className={`${card} p-4 border-gold-500/20`}>
          <span className="text-[11px] text-slate-400 uppercase font-semibold">Revenue</span>
          <div className="font-mono text-2xl font-bold text-gold-300 mt-1">{inr(stats.revenue)}</div>
          <span className="text-[10px] text-slate-500 block mt-1">From {stats.countedOrders} confirmed orders, excluding cancelled and refunded</span>
        </div>
        <div className={`${card} p-4`}>
          <span className="text-[11px] text-slate-400 uppercase font-semibold">Total orders</span>
          <div className="font-mono text-2xl font-bold text-slate-100 mt-1">{orders.length}</div>
          <span className="text-[10px] text-amber-400 font-bold block mt-1">{stats.open} waiting to be shipped</span>
        </div>
        <div className={`${card} p-4`}>
          <span className="text-[11px] text-slate-400 uppercase font-semibold">Bulk enquiries</span>
          <div className="font-mono text-2xl font-bold text-amber-400 mt-1">{bulkEnquiries.length}</div>
          <span className="text-[10px] text-slate-500 block mt-1">{bulkEnquiries.filter((b) => b.status === 'New').length} new</span>
        </div>
        <div className={`${card} p-4`}>
          <span className="text-[11px] text-slate-400 uppercase font-semibold">Low stock</span>
          <div className="font-mono text-2xl font-bold text-rose-400 mt-1">{stats.lowStock}</div>
          <span className="text-[10px] text-slate-500 block mt-1">Products at or below their alert level</span>
        </div>
      </div>

      <div className={`${card} p-6 space-y-4`}>
        <div>
          <h3 className="font-serif text-base font-bold text-slate-100">Sales in the last 7 days</h3>
          <p className="text-xs text-slate-400">Daily order value (₹), excluding cancelled and refunded orders</p>
        </div>
        <div className="h-64 w-full pt-2">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={stats.days}>
              <CartesianGrid strokeDasharray="3 3" stroke="#212534" />
              <XAxis dataKey="name" stroke="#64748b" fontSize={11} />
              <YAxis stroke="#64748b" fontSize={11} />
              <Tooltip contentStyle={{ backgroundColor: '#0c0d12', borderColor: '#d4af37' }} formatter={(v: number) => inr(v)} />
              <Bar dataKey="Sales" fill="#d4af37" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className={`${card} p-6 space-y-4`}>
        <h3 className="font-serif text-base font-bold text-slate-100">Revenue by category</h3>
        {stats.categoryTotal === 0 ? (
          <p className="text-xs text-slate-500">No confirmed sales yet.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {Object.entries(stats.byCategory).map(([cat, amount]) => (
              <div key={cat} className="p-4 rounded-xl bg-obsidian-900 border border-slate-800 text-center">
                <span className="text-xs text-amber-400 font-bold block uppercase">{CATEGORY_LABELS[cat] ?? cat}</span>
                <span className="font-mono text-2xl font-bold text-gold-300">{Math.round((amount / stats.categoryTotal) * 100)}%</span>
                <span className="text-[10px] text-slate-500 block">{inr(amount)}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
