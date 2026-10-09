'use client';

import React, { useEffect, useState } from 'react';
import { ArrowDown, ArrowUp, Plus, Trash2, Upload, X } from 'lucide-react';
import { useLuminary } from '@/context/LuminaryContext';
import { HeroBanner } from '@/types';
import { btnGhost, btnGold, card, errText, errorBox, inputCls, labelCls } from '../ui';
import { uploadImage, useUploadEnabled } from '../upload';

type BannerDraft = Omit<HeroBanner, 'id'> & { id: string };

const blankBanner = (priority: number): BannerDraft => ({
  id: `new-${Date.now()}-${priority}`,
  title: '',
  subtitle: '',
  badge: '',
  discountTag: '',
  buttonText: 'SHOP NOW',
  destinationUrl: '',
  imageUrl: '',
  priority,
  isActive: true,
  productId: undefined,
  layout: 'full',
  showText: true,
});

export const MerchandisingTab: React.FC = () => {
  const { adminProducts, reorderPriorityProducts, adminBanners, updateHeroBanners, showToast } = useLuminary();
  const uploadEnabled = useUploadEnabled();

  // --- Product order ---
  const serverPriority = adminProducts
    .filter((p) => p.isHomepagePriority && p.status === 'active')
    .sort((a, b) => a.priorityOrder - b.priorityOrder)
    .map((p) => p.id);
  const [order, setOrder] = useState<string[]>(serverPriority);
  const [savingOrder, setSavingOrder] = useState(false);

  useEffect(() => {
    setOrder(serverPriority);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [serverPriority.join('|')]);

  const move = (index: number, dir: -1 | 1) => {
    const next = [...order];
    const target = index + dir;
    if (target < 0 || target >= next.length) return;
    [next[index], next[target]] = [next[target], next[index]];
    setOrder(next);
  };

  const saveOrder = async () => {
    setSavingOrder(true);
    try {
      await reorderPriorityProducts(order);
      showToast('Product order saved', 'success');
    } catch (err) {
      showToast(errText(err), 'error');
    } finally {
      setSavingOrder(false);
    }
  };

  const candidates = adminProducts.filter((p) => p.status === 'active' && !order.includes(p.id));
  const dirty = order.join('|') !== serverPriority.join('|');

  // --- Banners ---
  const [banners, setBanners] = useState<BannerDraft[]>([]);
  const [bannerError, setBannerError] = useState<string | null>(null);
  const [savingBanners, setSavingBanners] = useState(false);
  const [uploadingIndex, setUploadingIndex] = useState<number | null>(null);

  useEffect(() => {
    setBanners(adminBanners.map((b) => ({ ...b })));
  }, [adminBanners]);

  const patch = (i: number, change: Partial<BannerDraft>) => setBanners((prev) => prev.map((b, idx) => (idx === i ? { ...b, ...change } : b)));

  const moveBanner = (index: number, dir: -1 | 1) => {
    const next = [...banners];
    const target = index + dir;
    if (target < 0 || target >= next.length) return;
    [next[index], next[target]] = [next[target], next[index]];
    setBanners(next);
  };

  const saveBanners = async () => {
    setBannerError(null);
    for (const b of banners) {
      if (!b.title.trim() || !b.imageUrl.trim()) return setBannerError('Every banner needs a headline and an image.');
    }
    setSavingBanners(true);
    try {
      await updateHeroBanners(
        banners.map((b, i) => ({
          ...b,
          title: b.title.trim(),
          subtitle: b.subtitle.trim(),
          badge: b.badge.trim(),
          discountTag: b.discountTag.trim(),
          buttonText: b.buttonText.trim() || 'SHOP NOW',
          destinationUrl: b.destinationUrl.trim(),
          imageUrl: b.imageUrl.trim(),
          priority: i + 1,
          productId: b.productId || undefined,
        }))
      );
      showToast('Banners saved', 'success');
    } catch (err) {
      setBannerError(errText(err));
    } finally {
      setSavingBanners(false);
    }
  };

  return (
    <div className="space-y-8">
      <section className={`${card} p-5 space-y-4 border-gold-500/20`}>
        <div>
          <h3 className="font-serif text-base font-bold text-gold-400">Product order on the shop page</h3>
          <p className="text-xs text-slate-400">Products listed here appear first in the shop grid, in this order. Everything else follows.</p>
        </div>

        <div className="space-y-2">
          {order.length === 0 && <p className="text-xs text-slate-500">No products pinned yet.</p>}
          {order.map((id, i) => {
            const p = adminProducts.find((x) => x.id === id);
            if (!p) return null;
            return (
              <div key={id} className="p-3 rounded-xl bg-obsidian-900 border border-slate-800 flex items-center justify-between text-xs gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <span className="font-mono font-bold text-gold-400 bg-obsidian-950 px-2 py-1 rounded shrink-0">#{i + 1}</span>
                  <img src={p.images[0]} alt="" className="w-8 h-8 rounded object-cover shrink-0" />
                  <span className="font-semibold text-slate-200 truncate">{p.name}</span>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button onClick={() => move(i, -1)} disabled={i === 0} className="p-1.5 rounded bg-slate-800 text-slate-300 disabled:opacity-30" aria-label="Move up"><ArrowUp className="w-3.5 h-3.5" /></button>
                  <button onClick={() => move(i, 1)} disabled={i === order.length - 1} className="p-1.5 rounded bg-slate-800 text-slate-300 disabled:opacity-30" aria-label="Move down"><ArrowDown className="w-3.5 h-3.5" /></button>
                  <button onClick={() => setOrder(order.filter((x) => x !== id))} className="p-1.5 rounded bg-slate-800 text-rose-400" aria-label="Unpin"><X className="w-3.5 h-3.5" /></button>
                </div>
              </div>
            );
          })}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <select className={`${inputCls} max-w-xs`} value="" onChange={(e) => e.target.value && setOrder([...order, e.target.value])}>
            <option value="">+ Pin a product…</option>
            {candidates.map((p) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
          <button onClick={saveOrder} disabled={!dirty || savingOrder} className={btnGold}>{savingOrder ? 'Saving…' : 'Save order'}</button>
        </div>
      </section>

      <section className={`${card} p-5 space-y-4 border-gold-500/20`}>
        <div className="flex items-center justify-between gap-3">
          <div>
            <h3 className="font-serif text-base font-bold text-gold-400">Homepage banners</h3>
            <p className="text-xs text-slate-400">The large slides at the top of the home page. Banners are shown in this order.</p>
          </div>
          <button onClick={() => setBanners([...banners, blankBanner(banners.length + 1)])} className={`${btnGhost} flex items-center gap-1`}>
            <Plus className="w-3.5 h-3.5" /> Add banner
          </button>
        </div>

        <div className="space-y-4">
          {banners.map((b, i) => (
            <div key={b.id} className="rounded-xl bg-obsidian-900 border border-slate-800 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-gold-300">Banner {i + 1}</span>
                <div className="flex items-center gap-1">
                  <button onClick={() => moveBanner(i, -1)} disabled={i === 0} className="p-1.5 rounded bg-slate-800 text-slate-300 disabled:opacity-30" aria-label="Move up"><ArrowUp className="w-3.5 h-3.5" /></button>
                  <button onClick={() => moveBanner(i, 1)} disabled={i === banners.length - 1} className="p-1.5 rounded bg-slate-800 text-slate-300 disabled:opacity-30" aria-label="Move down"><ArrowDown className="w-3.5 h-3.5" /></button>
                  <button onClick={() => setBanners(banners.filter((_, idx) => idx !== i))} className="p-1.5 rounded bg-slate-800 text-rose-400" aria-label="Delete banner"><Trash2 className="w-3.5 h-3.5" /></button>
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-3">
                <div className="sm:col-span-2">
                  <label className={labelCls}>Headline *</label>
                  <input className={inputCls} value={b.title} onChange={(e) => patch(i, { title: e.target.value })} />
                </div>
                <div className="sm:col-span-2">
                  <label className={labelCls}>Sub-text</label>
                  <input className={inputCls} value={b.subtitle} onChange={(e) => patch(i, { subtitle: e.target.value })} />
                </div>
                <div>
                  <label className={labelCls}>Small badge text</label>
                  <input className={inputCls} value={b.badge} onChange={(e) => patch(i, { badge: e.target.value })} placeholder="e.g. NEW COLLECTION" />
                </div>
                <div>
                  <label className={labelCls}>Offer tag</label>
                  <input className={inputCls} value={b.discountTag} onChange={(e) => patch(i, { discountTag: e.target.value })} placeholder="e.g. UP TO 40% OFF" />
                </div>
                <div>
                  <label className={labelCls}>Opens this product (optional)</label>
                  <select className={inputCls} value={b.productId ?? ''} onChange={(e) => patch(i, { productId: e.target.value || undefined })}>
                    <option value="">Bulk quote form</option>
                    {adminProducts.map((p) => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className={labelCls}>Or opens this page on the site</label>
                  <input className={inputCls} value={b.destinationUrl} onChange={(e) => patch(i, { destinationUrl: e.target.value })} placeholder="/collections/gift-sets" />
                  <p className="text-[10px] text-slate-500 mt-1">Used when no product is chosen. Leave empty to open the bulk quote form.</p>
                </div>
                <div>
                  <label className={labelCls}>Button text</label>
                  <input className={inputCls} value={b.buttonText} onChange={(e) => patch(i, { buttonText: e.target.value })} placeholder="SHOP NOW" />
                </div>
                <div>
                  <label className={labelCls}>Layout</label>
                  <select className={inputCls} value={b.layout ?? 'split'} onChange={(e) => patch(i, { layout: e.target.value as 'full' | 'split' })}>
                    <option value="full">Full-width picture (bigger, recommended)</option>
                    <option value="split">Text on the left, small picture on the right</option>
                  </select>
                </div>
                <label className="flex items-center gap-2 text-xs font-semibold text-slate-200 mt-5">
                  <input type="checkbox" className="accent-gold-400" checked={b.showText !== false} onChange={(e) => patch(i, { showText: e.target.checked })} />
                  Show headline, offer and button on the picture
                </label>
                <label className="flex items-center gap-2 text-xs font-semibold text-slate-200 sm:col-span-2">
                  <input type="checkbox" className="accent-gold-400" checked={b.isActive} onChange={(e) => patch(i, { isActive: e.target.checked })} />
                  Show this banner
                </label>
                <div className="sm:col-span-2">
                  <label className={labelCls}>Image *</label>
                  <p className="text-[10px] text-slate-500 mb-1">For the full-width layout use a wide landscape picture, about 2400 × 900 pixels, with the product on the right side. Turn off "Show headline…" if your picture already has its own text.</p>
                  <div className="flex items-center gap-2">
                    {b.imageUrl && <img src={b.imageUrl} alt="" className="w-14 h-10 rounded object-cover border border-slate-800 shrink-0" />}
                    <input className={inputCls} value={b.imageUrl} onChange={(e) => patch(i, { imageUrl: e.target.value })} placeholder="https://… image link" />
                    {uploadEnabled && (
                      <label className="shrink-0 cursor-pointer px-2.5 py-2 rounded bg-obsidian-950 border border-slate-700 text-gold-300" title="Upload image">
                        <Upload className="w-4 h-4" />
                        <input
                          type="file"
                          accept="image/jpeg,image/png,image/webp,image/gif"
                          className="hidden"
                          onChange={async (e) => {
                            const file = e.target.files?.[0];
                            e.target.value = '';
                            if (!file) return;
                            setUploadingIndex(i);
                            try {
                              patch(i, { imageUrl: await uploadImage(file) });
                            } catch (err) {
                              setBannerError(errText(err));
                            } finally {
                              setUploadingIndex(null);
                            }
                          }}
                        />
                      </label>
                    )}
                  </div>
                  {uploadingIndex === i && <p className="text-[11px] text-slate-400 mt-1">Uploading…</p>}
                </div>
              </div>
            </div>
          ))}
          {banners.length === 0 && <p className="text-xs text-slate-500">No banners. The home page hero shows an empty block until you add one.</p>}
        </div>

        {bannerError && <p className={errorBox}>{bannerError}</p>}
        <button onClick={saveBanners} disabled={savingBanners} className={btnGold}>{savingBanners ? 'Saving…' : 'Save banners'}</button>
      </section>
    </div>
  );
};
