'use client';

import React, { useState } from 'react';
import { Plus, Edit, Trash2 } from 'lucide-react';
import { useLuminary } from '@/context/LuminaryContext';
import { Product } from '@/types';
import { ProductFormModal } from '../ProductFormModal';
import { btnGold, card, errText, inr, th } from '../ui';

export const ProductsTab: React.FC = () => {
  const { adminProducts, deleteProduct, showToast } = useLuminary();
  const [editing, setEditing] = useState<Product | null>(null);
  const [showForm, setShowForm] = useState(false);

  const remove = async (p: Product) => {
    if (!window.confirm(`Delete "${p.name}"? This cannot be undone. To just hide it from the store, edit it and set it to Inactive instead.`)) return;
    try {
      await deleteProduct(p.id);
      showToast('Product deleted', 'success');
    } catch (err) {
      showToast(errText(err, 'Could not delete the product'), 'error');
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="font-serif text-lg font-bold text-slate-100">Products ({adminProducts.length})</h3>
          <p className="text-xs text-slate-400">Add products, change prices and stock, and hide items from the store</p>
        </div>
        <button
          onClick={() => {
            setEditing(null);
            setShowForm(true);
          }}
          className={`${btnGold} flex items-center gap-1.5`}
        >
          <Plus className="w-4 h-4" /> Add product
        </button>
      </div>

      <div className={`${card} overflow-x-auto`}>
        <table className="w-full text-xs text-slate-300">
          <thead className="bg-obsidian-900 text-slate-400 uppercase font-bold text-[10px] tracking-wider border-b border-slate-800">
            <tr>
              <th className={th}>Product</th>
              <th className={th}>SKU</th>
              <th className={th}>Price</th>
              <th className={th}>Cost / margin</th>
              <th className={th}>Stock</th>
              <th className={th}>Status</th>
              <th className="p-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {adminProducts.map((p) => (
              <tr key={p.id} className="hover:bg-obsidian-900/50">
                <td className="p-3">
                  <div className="flex items-center gap-2">
                    <img src={p.images[0]} alt="" className="w-9 h-9 rounded object-cover border border-slate-800" />
                    <span className="font-semibold text-slate-100 max-w-[220px] truncate">{p.name}</span>
                  </div>
                </td>
                <td className="p-3 font-mono text-[11px]">
                  {p.sku}
                  <span className="block text-[10px] text-gold-400 uppercase">{p.category}</span>
                </td>
                <td className="p-3 font-mono font-bold text-gold-300">
                  {inr(p.sellingPrice)} <span className="text-[10px] text-slate-500 line-through">{inr(p.mrp)}</span>
                </td>
                <td className="p-3 font-mono text-slate-400">
                  {inr(p.costPrice)}
                  <span className="text-[10px] text-emerald-400 block">
                    Margin {p.sellingPrice > 0 ? Math.round(((p.sellingPrice - p.costPrice) / p.sellingPrice) * 100) : 0}%
                  </span>
                </td>
                <td className="p-3">
                  <span
                    className={`px-2 py-0.5 rounded font-mono font-bold text-[11px] ${
                      p.stock <= p.lowStockThreshold ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30' : 'bg-emerald-500/20 text-emerald-400'
                    }`}
                  >
                    {p.stock}
                  </span>
                </td>
                <td className="p-3">
                  <span className={`text-[10px] font-bold uppercase ${p.status === 'active' ? 'text-emerald-400' : 'text-slate-500'}`}>{p.status}</span>
                </td>
                <td className="p-3 text-right space-x-2 whitespace-nowrap">
                  <button
                    onClick={() => {
                      setEditing(p);
                      setShowForm(true);
                    }}
                    className="p-1.5 rounded bg-slate-800 hover:bg-gold-500 hover:text-obsidian-950 text-slate-300 transition"
                    title="Edit"
                  >
                    <Edit className="w-3.5 h-3.5" />
                  </button>
                  <button onClick={() => remove(p)} className="p-1.5 rounded bg-slate-800 hover:bg-rose-600 hover:text-white text-slate-300 transition" title="Delete">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </td>
              </tr>
            ))}
            {adminProducts.length === 0 && (
              <tr>
                <td colSpan={7} className="p-8 text-center text-slate-500">No products yet. Add your first product.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {showForm && <ProductFormModal product={editing} onClose={() => setShowForm(false)} />}
    </div>
  );
};
