'use client';

import React, { useMemo, useEffect, useState } from 'react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { MousePointerClick, Eye, ShoppingCart, CreditCard, ShoppingBag, TrendingUp, RefreshCw } from 'lucide-react';
import { useLuminary } from '@/context/LuminaryContext';
import { card, inr } from '../ui';

const NOT_REVENUE = ['Cancelled', 'Returned', 'Refunded', 'Pending Payment'];
const OPEN_STATUSES = ['Pending Payment', 'Payment Confirmed', 'Processing', 'Packed'];
const CATEGORY_LABELS: Record<string, string> = { fragrance: 'Fragrances', ayurvedic: 'Ayurvedic', gadgets: 'Mini Gadgets' };

interface AnalyticsStats {
  funnel: {
    pageViews: number;
    productViews: number;
    addToCarts: number;
    initiateCheckouts: number;
    purchases: number;
    conversionRate: string;
  };
  recentEvents: Array<{
    id: string;
    eventType: string;
    eventName: string;
    url?: string;
    value?: number;
    timestamp: string;
  }>;
}

export const OverviewTab: React.FC = () => {
  const { orders, adminProducts, bulkEnquiries } = useLuminary();
  const [analytics, setAnalytics] = useState<AnalyticsStats | null>(null);
  const [loadingAnalytics, setLoadingAnalytics] = useState(false);

  const fetchAnalytics = async () => {
    try {
      setLoadingAnalytics(true);
      const res = await fetch('/api/analytics/stats');
      if (res.ok) {
        const data = await res.json();
        setAnalytics(data);
      }
    } catch {
      // Ignore
    } finally {
      setLoadingAnalytics(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
    const interval = setInterval(fetchAnalytics, 15000); // Live refresh every 15s
    return () => clearInterval(interval);
  }, []);

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
      {/* Main KPI Row */}
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

      {/* Live Clicks & Meta Conversion Funnel Section */}
      <div className={`${card} p-5 space-y-4 border-gold-500/30`}>
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
              <h3 className="font-serif text-base font-bold text-slate-100">Live Traffic & Meta Conversion Funnel</h3>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">Real-time visitor clicks, product views, cart additions and purchases</p>
          </div>
          <button
            onClick={fetchAnalytics}
            disabled={loadingAnalytics}
            className="px-3 py-1.5 rounded-lg bg-obsidian-900 border border-slate-800 text-xs text-slate-300 hover:text-gold-300 flex items-center gap-1.5 transition"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loadingAnalytics ? 'animate-spin text-gold-400' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <div className="p-3.5 rounded-xl bg-obsidian-900 border border-slate-800/80">
            <div className="flex items-center gap-2 text-slate-400 text-xs mb-1">
              <MousePointerClick className="w-4 h-4 text-sky-400" />
              <span>Clicks/Views</span>
            </div>
            <div className="font-mono text-xl font-bold text-slate-100">{analytics?.funnel.pageViews ?? 0}</div>
            <span className="text-[10px] text-slate-500">Store visits</span>
          </div>

          <div className="p-3.5 rounded-xl bg-obsidian-900 border border-slate-800/80">
            <div className="flex items-center gap-2 text-slate-400 text-xs mb-1">
              <Eye className="w-4 h-4 text-purple-400" />
              <span>Product Views</span>
            </div>
            <div className="font-mono text-xl font-bold text-slate-100">{analytics?.funnel.productViews ?? 0}</div>
            <span className="text-[10px] text-slate-500">ViewContent</span>
          </div>

          <div className="p-3.5 rounded-xl bg-obsidian-900 border border-slate-800/80">
            <div className="flex items-center gap-2 text-slate-400 text-xs mb-1">
              <ShoppingCart className="w-4 h-4 text-amber-400" />
              <span>Add to Cart</span>
            </div>
            <div className="font-mono text-xl font-bold text-amber-300">{analytics?.funnel.addToCarts ?? 0}</div>
            <span className="text-[10px] text-slate-500">Cart additions</span>
          </div>

          <div className="p-3.5 rounded-xl bg-obsidian-900 border border-slate-800/80">
            <div className="flex items-center gap-2 text-slate-400 text-xs mb-1">
              <CreditCard className="w-4 h-4 text-blue-400" />
              <span>Checkouts</span>
            </div>
            <div className="font-mono text-xl font-bold text-blue-300">{analytics?.funnel.initiateCheckouts ?? 0}</div>
            <span className="text-[10px] text-slate-500">InitiateCheckout</span>
          </div>

          <div className="p-3.5 rounded-xl bg-obsidian-900 border border-emerald-500/30">
            <div className="flex items-center gap-2 text-emerald-400 text-xs mb-1">
              <ShoppingBag className="w-4 h-4" />
              <span className="font-semibold">Purchases</span>
            </div>
            <div className="font-mono text-xl font-bold text-emerald-300">{analytics?.funnel.purchases ?? orders.length}</div>
            <span className="text-[10px] text-emerald-500">Confirmed orders</span>
          </div>

          <div className="p-3.5 rounded-xl bg-obsidian-900 border border-gold-500/30">
            <div className="flex items-center gap-2 text-gold-400 text-xs mb-1">
              <TrendingUp className="w-4 h-4" />
              <span className="font-semibold">Conv. Rate</span>
            </div>
            <div className="font-mono text-xl font-bold text-gold-300">{analytics?.funnel.conversionRate ?? '0.00'}%</div>
            <span className="text-[10px] text-gold-500">Visitor to buyer</span>
          </div>
        </div>

        {/* Live Visitor Feed */}
        {analytics?.recentEvents && analytics.recentEvents.length > 0 && (
          <div className="pt-2 border-t border-slate-800/60">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-2">Recent Live Activity Stream</span>
            <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
              {analytics.recentEvents.slice(0, 8).map((evt) => (
                <div key={evt.id} className="p-2 rounded-lg bg-obsidian-950 border border-slate-800/60 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2 min-w-0">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold shrink-0 ${
                        evt.eventType === 'purchase'
                          ? 'bg-emerald-500/20 text-emerald-300'
                          : evt.eventType === 'add_to_cart'
                          ? 'bg-amber-500/20 text-amber-300'
                          : evt.eventType === 'initiate_checkout'
                          ? 'bg-blue-500/20 text-blue-300'
                          : 'bg-slate-800 text-slate-300'
                      }`}
                    >
                      {evt.eventType.replace('_', ' ').toUpperCase()}
                    </span>
                    <span className="text-slate-200 truncate">{evt.eventName}</span>
                    {evt.value && evt.value > 0 && <span className="text-gold-400 font-mono font-bold shrink-0">₹{evt.value}</span>}
                  </div>
                  <span className="text-[10px] text-slate-500 font-mono shrink-0">
                    {new Date(evt.timestamp).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
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
