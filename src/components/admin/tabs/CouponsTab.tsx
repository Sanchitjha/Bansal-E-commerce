'use client';

import React, { useState } from 'react';
import { Plus } from 'lucide-react';
import { useLuminary } from '@/context/LuminaryContext';
import { Coupon } from '@/types';
import { btnGhost, btnGold, card, errText, errorBox, inputCls, labelCls } from '../ui';

interface Draft {
  id?: string;
  code: string;
  type: 'percentage' | 'flat';
  value: string;
  minOrderValue: string;
  maxDiscount: string;
  categorySpecific: '' | 'fragrance' | 'ayurvedic' | 'gadgets';
  firstOrderOnly: boolean;
  isActive: boolean;
}

const blank: Draft = { code: '', type: 'percentage', value: '', minOrderValue: '0', maxDiscount: '', categorySpecific: '', firstOrderOnly: false, isActive: true };

const toDraft = (c: Coupon): Draft => ({
  id: c.id,
  code: c.code,
  type: c.type,
  value: String(c.value),
  minOrderValue: String(c.minOrderValue),
  maxDiscount: c.maxDiscount ? String(c.maxDiscount) : '',
  categorySpecific: (c.categorySpecific ?? '') as Draft['categorySpecific'],
  firstOrderOnly: !!c.firstOrderOnly,
  isActive: c.isActive,
});

export const CouponsTab: React.FC = () => {
  const { coupons, saveCoupon, toggleCouponStatus, showToast } = useLuminary();
  const [draft, setDraft] = useState<Draft | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const set = <K extends keyof Draft>(key: K, value: Draft[K]) => setDraft((d) => (d ? { ...d, [key]: value } : d));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!draft) return;
    setError(null);

    const value = Number(draft.value);
    const minOrderValue = Number(draft.minOrderValue || 0);
    const maxDiscount = draft.maxDiscount === '' ? undefined : Number(draft.maxDiscount);
    if (!/^[A-Za-z0-9_-]{3,20}$/.test(draft.code.trim())) return setError('Code must be 3–20 letters or numbers.');
    if (!(value > 0)) return setError('Discount value must be more than 0.');
    if (draft.type === 'percentage' && value > 100) return setError('A percentage discount cannot exceed 100.');
    if (!(minOrderValue >= 0)) return setError('Minimum order must be 0 or more.');
    if (maxDiscount !== undefined && !(maxDiscount > 0)) return setError('Maximum discount must be more than 0, or left empty.');

    setSaving(true);
    try {
      await saveCoupon({
        ...(draft.id ? { id: draft.id } : {}),
        code: draft.code.trim().toUpperCase(),
        type: draft.type,
        value,
        minOrderValue,
        maxDiscount,
        categorySpecific: draft.categorySpecific || undefined,
        firstOrderOnly: draft.firstOrderOnly,
        isActive: draft.isActive,
      });
      showToast('Coupon saved', 'success');
      setDraft(null);
    } catch (err) {
      setError(errText(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h3 className="font-serif text-lg font-bold text-slate-100">Coupons ({coupons.length})</h3>
          <p className="text-xs text-slate-400">Customers enter these in the cart. Checks are done on the server.</p>
        </div>
        <button onClick={() => { setError(null); setDraft({ ...blank }); }} className={`${btnGold} flex items-center gap-1.5`}>
          <Plus className="w-4 h-4" /> New coupon
        </button>
      </div>

      {draft && (
        <form onSubmit={submit} className={`${card} p-5 space-y-4 border-gold-500/30`}>
          <h4 className="text-sm font-bold text-gold-400">{draft.id ? `Edit ${draft.code}` : 'New coupon'}</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div>
              <label className={labelCls}>Code *</label>
              <input className={`${inputCls} font-mono uppercase`} value={draft.code} onChange={(e) => set('code', e.target.value.toUpperCase())} />
            </div>
            <div>
              <label className={labelCls}>Type</label>
              <select className={inputCls} value={draft.type} onChange={(e) => set('type', e.target.value as Draft['type'])}>
                <option value="percentage">Percentage off</option>
                <option value="flat">Flat ₹ off</option>
              </select>
            </div>
            <div>
              <label className={labelCls}>{draft.type === 'percentage' ? 'Percent (%)' : 'Amount (₹)'} *</label>
              <input type="number" min="0" step="any" className={`${inputCls} font-mono`} value={draft.value} onChange={(e) => set('value', e.target.value)} />
            </div>
            <div>
              <label className={labelCls}>Min order (₹)</label>
              <input type="number" min="0" step="any" className={`${inputCls} font-mono`} value={draft.minOrderValue} onChange={(e) => set('minOrderValue', e.target.value)} />
            </div>
            <div>
              <label className={labelCls}>Max discount (₹, optional)</label>
              <input type="number" min="0" step="any" className={`${inputCls} font-mono`} value={draft.maxDiscount} onChange={(e) => set('maxDiscount', e.target.value)} />
            </div>
            <div>
              <label className={labelCls}>Only for category</label>
              <select className={inputCls} value={draft.categorySpecific} onChange={(e) => set('categorySpecific', e.target.value as Draft['categorySpecific'])}>
                <option value="">All products</option>
                <option value="fragrance">Fragrances</option>
                <option value="ayurvedic">Ayurvedic</option>
                <option value="gadgets">Mini Gadgets</option>
              </select>
            </div>
            <label className="flex items-center gap-2 text-xs font-semibold text-slate-200 mt-5">
              <input type="checkbox" className="accent-gold-400" checked={draft.firstOrderOnly} onChange={(e) => set('firstOrderOnly', e.target.checked)} />
              First order only
            </label>
            <label className="flex items-center gap-2 text-xs font-semibold text-slate-200 mt-5">
              <input type="checkbox" className="accent-gold-400" checked={draft.isActive} onChange={(e) => set('isActive', e.target.checked)} />
              Active
            </label>
          </div>
          {error && <p className={errorBox}>{error}</p>}
          <div className="flex gap-2">
            <button type="submit" disabled={saving} className={btnGold}>{saving ? 'Saving…' : 'Save coupon'}</button>
            <button type="button" onClick={() => setDraft(null)} className={btnGhost}>Cancel</button>
          </div>
        </form>
      )}

      <div className={`${card} overflow-x-auto`}>
        <table className="w-full text-xs text-slate-300">
          <thead className="bg-obsidian-900 text-slate-400 uppercase font-bold text-[10px] tracking-wider border-b border-slate-800">
            <tr>
              <th className="p-3 text-left">Code</th>
              <th className="p-3 text-left">Discount</th>
              <th className="p-3 text-left">Rules</th>
              <th className="p-3 text-left">Used</th>
              <th className="p-3 text-left">Status</th>
              <th className="p-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {coupons.map((c) => (
              <tr key={c.id}>
                <td className="p-3 font-mono font-bold text-gold-300">{c.code}</td>
                <td className="p-3">{c.type === 'percentage' ? `${c.value}%` : `₹${c.value}`}{c.maxDiscount ? ` (max ₹${c.maxDiscount})` : ''}</td>
                <td className="p-3 text-slate-400">
                  Min ₹{c.minOrderValue}
                  {c.categorySpecific ? ` · ${c.categorySpecific} only` : ''}
                  {c.firstOrderOnly ? ' · first order only' : ''}
                </td>
                <td className="p-3 font-mono">{c.usageCount}</td>
                <td className="p-3">
                  <span className={`text-[10px] font-bold uppercase ${c.isActive ? 'text-emerald-400' : 'text-slate-500'}`}>{c.isActive ? 'Active' : 'Paused'}</span>
                </td>
                <td className="p-3 text-right space-x-2 whitespace-nowrap">
                  <button onClick={() => { setError(null); setDraft(toDraft(c)); }} className={btnGhost}>Edit</button>
                  <button onClick={() => toggleCouponStatus(c.id).catch((err) => showToast(errText(err), 'error'))} className={btnGhost}>
                    {c.isActive ? 'Pause' : 'Activate'}
                  </button>
                </td>
              </tr>
            ))}
            {coupons.length === 0 && (
              <tr><td colSpan={6} className="p-8 text-center text-slate-500">No coupons yet.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
