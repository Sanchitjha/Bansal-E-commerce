'use client';

import React, { useState } from 'react';
import { X, Plus, Trash2, Upload, Film } from 'lucide-react';
import { useLuminary } from '@/context/LuminaryContext';
import { BulkSlab, CategoryType, Product } from '@/types';
import { btnGold, errorBox, errText, inputCls, labelCls } from './ui';
import { uploadImage, uploadVideo, useUploadEnabled } from './upload';

const slugify = (s: string) =>
  s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

const num = (v: string) => (v === '' ? NaN : Number(v));

interface Props {
  product: Product | null;
  onClose: () => void;
}

export const ProductFormModal: React.FC<Props> = ({ product, onClose }) => {
  const { saveProduct } = useLuminary();
  const isEdit = !!product;

  const [f, setF] = useState({
    name: product?.name ?? '',
    sku: product?.sku ?? '',
    category: (product?.category ?? 'fragrance') as CategoryType,
    subcategory: product?.subcategory ?? '',
    brand: product?.brand ?? 'Luminary',
    mrp: String(product?.mrp ?? ''),
    sellingPrice: String(product?.sellingPrice ?? ''),
    costPrice: String(product?.costPrice ?? ''),
    stock: String(product?.stock ?? '0'),
    lowStockThreshold: String(product?.lowStockThreshold ?? '10'),
    gstRate: String(product?.gstRate ?? '18'),
    hsnCode: product?.hsnCode ?? '',
    weightKg: String(product?.weightKg ?? '0.3'),
    dimensionsCm: product?.dimensionsCm ?? '',
    shortDescription: product?.shortDescription ?? '',
    longDescription: product?.longDescription ?? '',
    status: product?.status ?? ('active' as 'active' | 'inactive'),
    isFeatured: product?.isFeatured ?? false,
    isBestSeller: product?.isBestSeller ?? false,
    isNewArrival: product?.isNewArrival ?? false,
    isHomepagePriority: product?.isHomepagePriority ?? false,
    isBulkAvailable: product?.isBulkAvailable ?? false,
    urlSlug: product?.urlSlug ?? '',
    seoTitle: product?.seoTitle ?? '',
    metaDescription: product?.metaDescription ?? '',
  });
  const [images, setImages] = useState<string[]>(product?.images?.length ? product.images : ['']);
  const [slabs, setSlabs] = useState<BulkSlab[]>(product?.bulkSlabs ?? []);
  const [slugTouched, setSlugTouched] = useState(isEdit);
  const uploadEnabled = useUploadEnabled();
  const [videos, setVideos] = useState<string[]>(product?.videos ?? []);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const set = <K extends keyof typeof f>(key: K, value: (typeof f)[K]) => setF((prev) => ({ ...prev, [key]: value }));

  const onName = (name: string) => {
    setF((prev) => ({ ...prev, name, urlSlug: slugTouched ? prev.urlSlug : slugify(name) }));
  };

  const upload = async (file: File, kind: 'image' | 'video', index: number) => {
    setUploading(true);
    setError(null);
    try {
      const url = await (kind === 'image' ? uploadImage(file) : uploadVideo(file));
      if (kind === 'image') setImages((prev) => prev.map((img, i) => (i === index ? url : img)));
      else setVideos((prev) => prev.map((v, i) => (i === index ? url : v)));
    } catch (err) {
      setError(errText(err, 'Upload failed'));
    } finally {
      setUploading(false);
    }
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const mrp = num(f.mrp);
    const sellingPrice = num(f.sellingPrice);
    const costPrice = f.costPrice === '' ? 0 : num(f.costPrice);
    const stock = num(f.stock);
    const lowStockThreshold = num(f.lowStockThreshold);
    const gstRate = num(f.gstRate);
    const weightKg = f.weightKg === '' ? 0 : num(f.weightKg);
    const cleanImages = images.map((i) => i.trim()).filter(Boolean);
    const cleanVideos = videos.map((v) => v.trim()).filter(Boolean);
    const cleanSlabs = [...slabs].sort((a, b) => a.minQty - b.minQty);

    if (!f.name.trim() || !f.sku.trim()) return setError('Name and SKU are required.');
    if (!f.urlSlug.trim() || !/^[a-z0-9-]+$/.test(f.urlSlug)) return setError('URL slug may only contain lowercase letters, numbers and hyphens.');
    if (![mrp, sellingPrice, costPrice, weightKg].every((n) => Number.isFinite(n) && n >= 0)) return setError('Prices and weight must be numbers of 0 or more.');
    if (sellingPrice <= 0) return setError('Selling price must be more than 0.');
    if (sellingPrice > mrp) return setError('Selling price cannot be higher than MRP.');
    if (!Number.isInteger(stock) || stock < 0) return setError('Stock must be a whole number of 0 or more.');
    if (!Number.isInteger(lowStockThreshold) || lowStockThreshold < 0) return setError('Low-stock level must be a whole number of 0 or more.');
    if (!Number.isFinite(gstRate) || gstRate < 0 || gstRate > 40) return setError('GST rate must be between 0 and 40.');
    if (cleanImages.length === 0) return setError('Add at least one product image.');
    if (f.isBulkAvailable) {
      if (cleanSlabs.length < 2) return setError('Add at least two bulk price tiers, or switch bulk pricing off.');
      if (cleanSlabs.some((s) => !Number.isInteger(s.minQty) || s.minQty < 1 || !(s.pricePerUnit > 0))) return setError('Each bulk tier needs a quantity of 1 or more and a price above 0.');
      if (cleanSlabs.some((s, i) => i > 0 && (s.minQty === cleanSlabs[i - 1].minQty || s.pricePerUnit > cleanSlabs[i - 1].pricePerUnit))) {
        return setError('Bulk tiers must have different quantities, and the price must not go up as the quantity grows.');
      }
    }

    setSaving(true);
    try {
      await saveProduct({
        ...(product ? { id: product.id } : {}),
        name: f.name.trim(),
        sku: f.sku.trim(),
        category: f.category,
        subcategory: f.subcategory.trim(),
        brand: f.brand.trim(),
        shortDescription: f.shortDescription.trim(),
        longDescription: f.longDescription.trim(),
        images: cleanImages,
        videos: cleanVideos,
        mrp,
        sellingPrice,
        costPrice,
        discountPercent: mrp > 0 ? Math.round(((mrp - sellingPrice) / mrp) * 100) : 0,
        gstRate,
        hsnCode: f.hsnCode.trim(),
        stock,
        lowStockThreshold,
        weightKg,
        dimensionsCm: f.dimensionsCm.trim() || undefined,
        status: f.status,
        isFeatured: f.isFeatured,
        isBestSeller: f.isBestSeller,
        isNewArrival: f.isNewArrival,
        isHomepagePriority: f.isHomepagePriority,
        priorityOrder: product?.priorityOrder ?? 99,
        isBulkAvailable: f.isBulkAvailable,
        bulkSlabs: f.isBulkAvailable ? cleanSlabs : [],
        variants: product?.variants ?? [],
        rating: product?.rating ?? 0,
        reviewsCount: product?.reviewsCount ?? 0,
        seoTitle: f.seoTitle.trim() || undefined,
        metaDescription: f.metaDescription.trim() || undefined,
        urlSlug: f.urlSlug.trim(),
        keywords: product?.keywords ?? [],
      });
      onClose();
    } catch (err) {
      setError(errText(err, 'Could not save the product.'));
    } finally {
      setSaving(false);
    }
  };

  const check = (key: 'isFeatured' | 'isBestSeller' | 'isNewArrival' | 'isHomepagePriority' | 'isBulkAvailable', text: string) => (
    <label className="flex items-center gap-1.5 cursor-pointer text-slate-200 font-semibold text-xs">
      <input type="checkbox" checked={f[key]} onChange={(e) => set(key, e.target.checked)} className="accent-gold-400" />
      {text}
    </label>
  );

  return (
    <div className="fixed inset-0 z-[60] flex items-start justify-center p-4 bg-obsidian-950/90 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-3xl bg-obsidian-900 border border-gold-500/40 rounded-3xl p-6 shadow-2xl text-slate-100 my-6">
        <div className="flex justify-between items-center border-b border-slate-800 pb-3 mb-4">
          <h3 className="font-serif text-lg font-bold text-gold-400">{isEdit ? 'Edit product' : 'Add new product'}</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-white" aria-label="Close">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={submit} className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>Product name *</label>
              <input className={inputCls} value={f.name} onChange={(e) => onName(e.target.value)} required />
            </div>
            <div>
              <label className={labelCls}>SKU *</label>
              <input className={`${inputCls} font-mono`} value={f.sku} onChange={(e) => set('sku', e.target.value)} required />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className={labelCls}>Category *</label>
              <select className={inputCls} value={f.category} onChange={(e) => set('category', e.target.value as CategoryType)}>
                <option value="fragrance">Fragrances</option>
                <option value="ayurvedic">Ayurvedic</option>
                <option value="gadgets">Mini Gadgets</option>
              </select>
            </div>
            <div>
              <label className={labelCls}>Sub-category</label>
              <input className={inputCls} value={f.subcategory} onChange={(e) => set('subcategory', e.target.value)} placeholder="e.g. Perfumes" />
            </div>
            <div>
              <label className={labelCls}>Brand</label>
              <input className={inputCls} value={f.brand} onChange={(e) => set('brand', e.target.value)} />
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div>
              <label className={labelCls}>MRP (₹) *</label>
              <input type="number" min="0" step="any" className={`${inputCls} font-mono`} value={f.mrp} onChange={(e) => set('mrp', e.target.value)} required />
            </div>
            <div>
              <label className={labelCls}>Selling price (₹) *</label>
              <input type="number" min="0" step="any" className={`${inputCls} font-mono`} value={f.sellingPrice} onChange={(e) => set('sellingPrice', e.target.value)} required />
            </div>
            <div>
              <label className={`${labelCls} text-rose-400`}>Cost price (private)</label>
              <input type="number" min="0" step="any" className={`${inputCls} font-mono`} value={f.costPrice} onChange={(e) => set('costPrice', e.target.value)} />
            </div>
            <div>
              <label className={labelCls}>GST rate (%)</label>
              <input type="number" min="0" max="40" step="any" className={`${inputCls} font-mono`} value={f.gstRate} onChange={(e) => set('gstRate', e.target.value)} />
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div>
              <label className={labelCls}>Stock</label>
              <input type="number" min="0" step="1" className={`${inputCls} font-mono`} value={f.stock} onChange={(e) => set('stock', e.target.value)} />
            </div>
            <div>
              <label className={labelCls}>Low-stock alert at</label>
              <input type="number" min="0" step="1" className={`${inputCls} font-mono`} value={f.lowStockThreshold} onChange={(e) => set('lowStockThreshold', e.target.value)} />
            </div>
            <div>
              <label className={labelCls}>HSN code</label>
              <input className={`${inputCls} font-mono`} value={f.hsnCode} onChange={(e) => set('hsnCode', e.target.value)} />
            </div>
            <div>
              <label className={labelCls}>Weight (kg)</label>
              <input type="number" min="0" step="any" className={`${inputCls} font-mono`} value={f.weightKg} onChange={(e) => set('weightKg', e.target.value)} />
            </div>
          </div>

          <div>
            <label className={labelCls}>Short description</label>
            <textarea rows={2} className={inputCls} value={f.shortDescription} onChange={(e) => set('shortDescription', e.target.value)} />
          </div>
          <div>
            <label className={labelCls}>Full description</label>
            <textarea rows={4} className={inputCls} value={f.longDescription} onChange={(e) => set('longDescription', e.target.value)} />
          </div>

          <div className="space-y-2">
            <label className={labelCls}>Images (the first one is the main image) *</label>
            {images.map((img, i) => (
              <div key={i} className="flex items-center gap-2">
                {img ? <img src={img} alt="" className="w-10 h-10 rounded object-cover border border-slate-800 shrink-0" /> : <div className="w-10 h-10 rounded bg-obsidian-950 border border-slate-800 shrink-0" />}
                <input
                  className={inputCls}
                  placeholder="https://… image link"
                  value={img}
                  onChange={(e) => setImages((prev) => prev.map((x, idx) => (idx === i ? e.target.value : x)))}
                />
                {uploadEnabled && (
                  <label className="shrink-0 cursor-pointer px-2.5 py-2 rounded bg-obsidian-950 border border-slate-700 text-gold-300 hover:border-gold-500/60" title="Upload image">
                    <Upload className="w-4 h-4" />
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp,image/gif"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) upload(file, 'image', i);
                        e.target.value = '';
                      }}
                    />
                  </label>
                )}
                <button type="button" onClick={() => setImages((prev) => (prev.length > 1 ? prev.filter((_, idx) => idx !== i) : ['']))} className="text-slate-500 hover:text-rose-400 shrink-0" aria-label="Remove image">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
            <div className="flex items-center gap-3">
              <button type="button" onClick={() => setImages((prev) => [...prev, ''])} className="text-xs text-gold-300 font-semibold flex items-center gap-1">
                <Plus className="w-3.5 h-3.5" /> Add another image
              </button>
              {uploading && <span className="text-[11px] text-slate-400">Uploading…</span>}
              {!uploadEnabled && <span className="text-[11px] text-slate-500">Upload is not connected yet (Cloudinary). Paste links for now.</span>}
            </div>
          </div>

          <div className="space-y-2">
            <label className={labelCls}>Videos (optional, shown on the product page)</label>
            {videos.map((v, i) => (
              <div key={i} className="flex items-center gap-2">
                <Film className="w-4 h-4 text-slate-500 shrink-0" />
                <input className={inputCls} placeholder="https://… video link (MP4 / WebM)" value={v} onChange={(e) => setVideos((prev) => prev.map((x, idx) => (idx === i ? e.target.value : x)))} />
                {uploadEnabled && (
                  <label className="shrink-0 cursor-pointer px-2.5 py-2 rounded bg-obsidian-950 border border-slate-700 text-gold-300 hover:border-gold-500/60" title="Upload video (max 100 MB)">
                    <Upload className="w-4 h-4" />
                    <input
                      type="file"
                      accept="video/mp4,video/webm,video/quicktime"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) upload(file, 'video', i);
                        e.target.value = '';
                      }}
                    />
                  </label>
                )}
                <button type="button" onClick={() => setVideos((prev) => prev.filter((_, idx) => idx !== i))} className="text-slate-500 hover:text-rose-400 shrink-0" aria-label="Remove video">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
            <button type="button" onClick={() => setVideos((prev) => [...prev, ''])} className="text-xs text-gold-300 font-semibold flex items-center gap-1">
              <Plus className="w-3.5 h-3.5" /> Add a video
            </button>
          </div>

          <div className="space-y-3 pt-3 border-t border-slate-800">
            <div className="flex flex-wrap gap-x-5 gap-y-2">
              {check('isBestSeller', 'Bestseller badge')}
              {check('isNewArrival', 'New arrival badge')}
              {check('isFeatured', 'Featured')}
              {check('isHomepagePriority', 'Homepage priority')}
              {check('isBulkAvailable', 'Bulk pricing')}
            </div>

            {f.isBulkAvailable && (
              <div className="space-y-2 rounded-xl border border-slate-800 p-3 bg-obsidian-950">
                <label className={labelCls}>Bulk price tiers (price per unit at or above a quantity)</label>
                {slabs.map((slab, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <input type="number" min="1" step="1" className={`${inputCls} font-mono`} value={slab.minQty || ''} placeholder="Min qty" onChange={(e) => setSlabs((prev) => prev.map((s, idx) => (idx === i ? { ...s, minQty: Number(e.target.value) } : s)))} />
                    <input type="number" min="0" step="any" className={`${inputCls} font-mono`} value={slab.pricePerUnit || ''} placeholder="₹ per unit" onChange={(e) => setSlabs((prev) => prev.map((s, idx) => (idx === i ? { ...s, pricePerUnit: Number(e.target.value) } : s)))} />
                    <button type="button" onClick={() => setSlabs((prev) => prev.filter((_, idx) => idx !== i))} className="text-slate-500 hover:text-rose-400" aria-label="Remove tier">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => setSlabs((prev) => [...prev, { minQty: prev.length === 0 ? 1 : 0, pricePerUnit: prev.length === 0 ? Number(f.sellingPrice) || 0 : 0 }])}
                  className="text-xs text-gold-300 font-semibold flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" /> Add tier
                </button>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-3 border-t border-slate-800">
            <div>
              <label className={labelCls}>Visibility</label>
              <select className={inputCls} value={f.status} onChange={(e) => set('status', e.target.value as 'active' | 'inactive')}>
                <option value="active">Active (visible in the store)</option>
                <option value="inactive">Inactive (hidden)</option>
              </select>
            </div>
            <div>
              <label className={labelCls}>Page URL (slug)</label>
              <input
                className={`${inputCls} font-mono`}
                value={f.urlSlug}
                onChange={(e) => {
                  setSlugTouched(true);
                  set('urlSlug', e.target.value);
                }}
              />
            </div>
            <div>
              <label className={labelCls}>Google title (SEO)</label>
              <input className={inputCls} value={f.seoTitle} onChange={(e) => set('seoTitle', e.target.value)} placeholder="Defaults to the product name" />
            </div>
            <div>
              <label className={labelCls}>Google description (SEO)</label>
              <input className={inputCls} value={f.metaDescription} onChange={(e) => set('metaDescription', e.target.value)} placeholder="Defaults to the short description" />
            </div>
          </div>

          {error && <p className={errorBox}>{error}</p>}

          <button type="submit" disabled={saving || uploading} className={`${btnGold} w-full py-3`}>
            {saving ? 'Saving…' : isEdit ? 'Save changes' : 'Create product'}
          </button>
        </form>
      </div>
    </div>
  );
};
