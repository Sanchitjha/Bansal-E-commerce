'use client';

import React, { useState } from 'react';
import { useLuminary } from '@/context/LuminaryContext';
import { Product } from '@/types';
import { btnGhost, card, errText, inputCls } from '../ui';

const AdjustRow: React.FC<{ product: Product }> = ({ product }) => {
  const { addStockAdjustment, showToast } = useLuminary();
  const [qty, setQty] = useState('');
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState(false);

  const apply = async (sign: 1 | -1) => {
    const n = Number(qty);
    if (!Number.isInteger(n) || n <= 0) return showToast('Enter a whole number of units.', 'error');
    if (sign === -1 && n > product.stock) return showToast(`Only ${product.stock} in stock.`, 'error');
    setBusy(true);
    try {
      await addStockAdjustment(product.id, sign * n, reason.trim() || (sign === 1 ? 'Stock received' : 'Stock removed'));
      setQty('');
      setReason('');
      showToast(`${product.name}: ${sign === 1 ? '+' : '-'}${n}`, 'success');
    } catch (err) {
      showToast(errText(err), 'error');
    } finally {
      setBusy(false);
    }
  };

  return (
    <tr className="hover:bg-obsidian-900/50">
      <td className="p-3">
        <div className="flex items-center gap-2">
          <img src={product.images[0]} alt="" className="w-8 h-8 rounded object-cover border border-slate-800" />
          <div className="min-w-0">
            <div className="font-semibold text-slate-100 truncate max-w-[220px]">{product.name}</div>
            <div className="font-mono text-[10px] text-slate-500">{product.sku}</div>
          </div>
        </div>
      </td>
      <td className="p-3">
        <span
          className={`px-2 py-0.5 rounded font-mono font-bold text-[11px] ${
            product.stock === 0 ? 'bg-rose-600 text-white' : product.stock <= product.lowStockThreshold ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30' : 'bg-emerald-500/20 text-emerald-400'
          }`}
        >
          {product.stock}
        </span>
        <span className="text-[10px] text-slate-500 ml-2">alert at {product.lowStockThreshold}</span>
      </td>
      <td className="p-3">
        <div className="flex flex-wrap items-center gap-2">
          <input type="number" min="1" step="1" value={qty} onChange={(e) => setQty(e.target.value)} placeholder="Qty" className={`${inputCls} w-20 font-mono`} />
          <input value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Reason (optional)" className={`${inputCls} w-44`} />
          <button disabled={busy} onClick={() => apply(1)} className={btnGhost}>+ Add</button>
          <button disabled={busy} onClick={() => apply(-1)} className={btnGhost}>− Remove</button>
        </div>
      </td>
    </tr>
  );
};

export const InventoryTab: React.FC = () => {
  const { adminProducts } = useLuminary();
  const low = adminProducts.filter((p) => p.status === 'active' && p.stock <= p.lowStockThreshold);
  const sorted = [...adminProducts].sort((a, b) => a.stock - b.stock);

  return (
    <div className="space-y-5">
      <div>
        <h3 className="font-serif text-lg font-bold text-slate-100">Inventory</h3>
        <p className="text-xs text-slate-400">Every change is recorded in the activity log. Orders reduce stock automatically and cancelled orders put it back.</p>
      </div>

      {low.length > 0 ? (
        <div className="rounded-2xl border border-rose-500/30 bg-rose-500/5 p-4">
          <h4 className="text-xs font-bold text-rose-400 uppercase tracking-wider mb-2">Needs restocking ({low.length})</h4>
          <ul className="text-xs text-slate-300 space-y-1">
            {low.map((p) => (
              <li key={p.id} className="flex justify-between gap-3">
                <span className="truncate">{p.name}</span>
                <span className="font-mono font-bold text-rose-400 shrink-0">{p.stock} left</span>
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <p className="text-xs text-emerald-400 font-semibold">All active products are above their low-stock level.</p>
      )}

      <div className={`${card} overflow-x-auto`}>
        <table className="w-full text-xs text-slate-300">
          <thead className="bg-obsidian-900 text-slate-400 uppercase font-bold text-[10px] tracking-wider border-b border-slate-800">
            <tr>
              <th className="p-3 text-left">Product</th>
              <th className="p-3 text-left">In stock</th>
              <th className="p-3 text-left">Adjust</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {sorted.map((p) => (
              <AdjustRow key={`${p.id}-${p.stock}`} product={p} />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

