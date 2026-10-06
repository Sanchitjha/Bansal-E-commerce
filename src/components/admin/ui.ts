// Shared class names so every admin tab looks the same.
export const card = 'rounded-2xl bg-obsidian-950 border border-slate-800';
export const inputCls =
  'w-full p-2 bg-obsidian-950 border border-slate-800 focus:border-gold-500 rounded text-slate-100 text-xs outline-none';
export const labelCls = 'block text-slate-300 font-bold mb-1 text-xs';
export const btnGold = 'px-4 py-2 rounded-xl gold-gradient-bg text-obsidian-950 font-bold text-xs uppercase tracking-wider disabled:opacity-60';
export const btnGhost =
  'px-3 py-1.5 rounded-lg bg-obsidian-900 border border-slate-700 text-xs font-semibold text-gold-300 hover:border-gold-500/60 transition disabled:opacity-60';
export const btnDanger =
  'px-3 py-1.5 rounded-lg bg-obsidian-900 border border-rose-900 text-xs font-semibold text-rose-400 hover:bg-rose-600 hover:text-white transition';
export const th = 'p-3 text-left';
export const errorBox = 'text-[11px] text-rose-400 font-semibold bg-rose-500/10 border border-rose-500/30 rounded-lg py-2 px-3';
export const okBox = 'text-[11px] text-emerald-400 font-semibold bg-emerald-500/10 border border-emerald-500/30 rounded-lg py-2 px-3';

export const ORDER_STATUS_OPTIONS = [
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

export const inr = (n: number) => `₹${(Math.round(n * 100) / 100).toLocaleString('en-IN')}`;

export const errText = (e: unknown, fallback = 'Something went wrong') => (e instanceof Error ? e.message : fallback);
