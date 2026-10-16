'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Star, CheckCircle2, AlertCircle, Truck, ShieldCheck, RefreshCw, PlayCircle } from 'lucide-react';
import { WhatsAppIcon } from '@/components/ui/WhatsAppIcon';
import { optimizeImage, videoPoster } from '@/lib/media';
import { Product } from '@/types';
import { useLuminary } from '@/context/LuminaryContext';
import { useShell } from '@/components/layout/StoreShell';
import { ProductReviews } from './ProductReviews';
import { ProductCard } from '@/components/home/ProductCard';
import { trackViewContent } from '@/lib/metaPixel';
import { getMaxOrderLimit } from '@/lib/pricing';

const CATEGORY_LABEL: Record<string, string> = { fragrance: 'Fragrances', ayurvedic: 'Ayurvedic Care', gadgets: 'Mini Gadgets' };

export const ProductPageView: React.FC<{ product: Product }> = ({ product: initial }) => {
  const { products, addToCart, getUnitPriceForProduct, settings } = useLuminary();
  const shell = useShell();

  // Prefer the live copy so stock and price stay current after the page was cached.
  const product = products.find((p) => p.id === initial.id) ?? initial;
  const videos = product.videos ?? [];
  const [active, setActive] = useState<{ type: 'image' | 'video'; url: string }>({ type: 'image', url: product.images[0] ?? '' });
  const [selectedVariantId, setSelectedVariantId] = useState<string>(product.variants?.[0]?.id || '');
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);

  useEffect(() => {
    setSelectedVariantId(product.variants?.[0]?.id || '');
    setActive({ type: 'image', url: product.images[0] ?? '' });
    setQuantity(1);
  }, [product.id]);

  const selectedVariant = product.variants?.find((v) => v.id === selectedVariantId);
  const activePrice = selectedVariant?.price ?? product.sellingPrice;
  const activeMrp = selectedVariant?.mrp ?? product.mrp;
  const activeSku = selectedVariant?.sku ?? product.sku;
  const activeStock = selectedVariant?.stock ?? product.stock;
  const maxLimit = getMaxOrderLimit(product);

  const unitPrice = getUnitPriceForProduct(product, quantity, selectedVariantId);
  const inStock = activeStock > 0;
  const related = products.filter((p) => p.category === product.category && p.id !== product.id).slice(0, 4);

  useEffect(() => {
    if (product) {
      trackViewContent({
        id: activeSku || product.id,
        name: selectedVariant ? `${product.name} (${selectedVariant.name})` : product.name,
        price: unitPrice,
      });
    }
  }, [product?.id, activeSku, product?.name, unitPrice, selectedVariant]);

  const add = async (): Promise<boolean> => {
    const ok = await addToCart(product, quantity, selectedVariantId);
    if (ok) {
      setAdded(true);
      setTimeout(() => setAdded(false), 1800);
    }
    return ok;
  };

  return (
    <div className="max-w-[1400px] mx-auto px-4 sm:px-6 py-8">
      <nav className="text-xs text-slate-500 mb-5" aria-label="Breadcrumb">
        <Link href="/" className="hover:text-brand-green-700">Home</Link>
        <span className="mx-2">/</span>
        <span>{CATEGORY_LABEL[product.category] ?? product.category}</span>
        <span className="mx-2">/</span>
        <span className="text-slate-700">{product.name}</span>
      </nav>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 bg-white rounded-3xl border border-stone-200 p-5 sm:p-8">
        <div className="space-y-3">
          {/* Main Uncropped Image Container */}
          <div className="aspect-square rounded-2xl overflow-hidden bg-gradient-to-b from-stone-50 via-white to-stone-50 border border-stone-200 p-4 sm:p-6 flex items-center justify-center">
            {active.type === 'video' ? (
              <video key={active.url} src={active.url} poster={videoPoster(active.url, 900) ?? optimizeImage(product.images[0], 900)} controls playsInline preload="metadata" className="w-full h-full object-contain bg-black" />
            ) : (
              <img src={optimizeImage(active.url || product.images[0], 900)} alt={product.name} className="w-full h-full object-contain drop-shadow-md transition-all duration-300" />
            )}
          </div>
          {(product.images.length > 1 || videos.length > 0) && (
            <div className="flex gap-2 overflow-x-auto pb-1">
              {product.images.map((img) => (
                <button
                  key={img}
                  onClick={() => setActive({ type: 'image', url: img })}
                  className={`w-16 h-16 rounded-lg overflow-hidden border-2 shrink-0 bg-stone-50 p-1 flex items-center justify-center ${active.url === img ? 'border-brand-green-600 scale-105' : 'border-stone-200 opacity-70 hover:opacity-100'}`}
                >
                  <img src={optimizeImage(img, 160)} alt="" className="w-full h-full object-contain" />
                </button>
              ))}
              {videos.map((v) => (
                <button
                  key={v}
                  onClick={() => setActive({ type: 'video', url: v })}
                  aria-label="Play product video"
                  className={`relative w-16 h-16 rounded-lg overflow-hidden border-2 shrink-0 bg-slate-800 ${active.url === v ? 'border-brand-green-600 scale-105' : 'border-stone-200 opacity-80 hover:opacity-100'}`}
                >
                  <img src={videoPoster(v, 160) ?? optimizeImage(product.images[0], 160)} alt="" className="w-full h-full object-cover" />
                  <PlayCircle className="absolute inset-0 m-auto w-6 h-6 text-white drop-shadow" />
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-brand-green-600">
              {product.brand} · {product.subcategory || CATEGORY_LABEL[product.category]}
            </span>
            {product.netQuantity && (
              <span className="text-xs font-bold text-slate-700 bg-stone-100 border border-stone-200 px-2.5 py-0.5 rounded-full">
                Net Qty: {product.netQuantity}
              </span>
            )}
          </div>

          <h1 className="text-3xl font-bold text-slate-900 leading-tight">{product.name}</h1>

          {product.reviewsCount > 0 ? (
            <div className="flex items-center gap-2 text-sm">
              <span className="flex text-amber-500">
                {[1, 2, 3, 4, 5].map((s) => (
                  <Star key={s} className={`w-4 h-4 ${s <= Math.round(product.rating) ? 'fill-current' : 'text-stone-300'}`} />
                ))}
              </span>
              <span className="text-slate-500">
                {product.rating} ({product.reviewsCount.toLocaleString('en-IN')} reviews)
              </span>
            </div>
          ) : (
            <div className="text-sm text-slate-500">No reviews yet</div>
          )}

          <p className="text-slate-600 leading-relaxed">{product.shortDescription}</p>

          {/* Variant Selection Buttons (Sizes / Packs / Volumes) */}
          {product.variants && product.variants.length > 0 && (
            <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200">
              <div className="flex items-center justify-between text-xs font-bold text-slate-800 mb-2">
                <span>Select Size / Volume / Pack:</span>
                <span className="text-brand-green-700 font-semibold">{selectedVariant ? selectedVariant.name : 'Choose an option'}</span>
              </div>
              <div className="flex flex-wrap gap-2.5">
                {product.variants.map((v) => {
                  const isSelected = selectedVariantId === v.id;
                  return (
                    <button
                      key={v.id}
                      type="button"
                      onClick={() => {
                        setSelectedVariantId(v.id);
                        setQuantity(1);
                      }}
                      className={`px-4 py-2.5 rounded-xl text-xs font-semibold border transition flex items-center gap-2.5 ${
                        isSelected
                          ? 'bg-brand-green-700 text-white border-brand-green-700 shadow-sm'
                          : 'bg-white text-slate-800 border-stone-200 hover:border-brand-green-600/50'
                      }`}
                    >
                      <span className="font-bold">{v.name}</span>
                      <span className={isSelected ? 'text-amber-200 font-bold' : 'text-slate-500 font-normal'}>
                        ₹{v.price.toLocaleString('en-IN')}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          <div className="flex items-baseline gap-3">
            <span className="text-3xl font-bold text-slate-900">₹{unitPrice.toLocaleString('en-IN')}</span>
            {activeMrp > unitPrice && (
              <>
                <span className="text-lg text-slate-400 line-through">₹{activeMrp.toLocaleString('en-IN')}</span>
                <span className="text-sm font-semibold text-brand-orange-500">{Math.round((1 - unitPrice / (activeMrp || 1)) * 100)}% off</span>
              </>
            )}
          </div>
          <p className="text-xs text-slate-500 -mt-2">Inclusive of {product.gstRate}% GST</p>

          {product.isBulkAvailable && product.bulkSlabs.length > 1 && (() => {
            const slabs = [...product.bulkSlabs].sort((a, b) => a.minQty - b.minQty);
            const activeIndex = slabs.reduce((found, slab, i) => (quantity >= slab.minQty ? i : found), 0);
            const money = (n: number) => `₹${n.toLocaleString('en-IN')}`;
            const saved = (activePrice - unitPrice) * quantity;

            return (
              <div className="rounded-2xl border border-brand-green-200 overflow-hidden">
                <div className="flex items-center justify-between bg-brand-green-50 px-4 py-2.5 text-xs font-bold text-brand-green-800">
                  <span>Buy more, save more</span>
                  <button onClick={() => shell.openBulk(product)} className="underline font-semibold">Request B2B quote</button>
                </div>
                <table className="w-full text-xs bg-white">
                  <thead>
                    <tr className="text-[10px] uppercase tracking-wide text-slate-500 text-left">
                      <th className="px-4 py-2 font-semibold">Quantity</th>
                      <th className="py-2 font-semibold">Price each</th>
                      <th className="px-4 py-2 font-semibold text-right">You save (each)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {slabs.map((slab, i) => {
                      const save = activePrice - slab.pricePerUnit;
                      const range = i < slabs.length - 1 ? `${slab.minQty}${slabs[i + 1].minQty - 1 > slab.minQty ? `–${slabs[i + 1].minQty - 1}` : ''}` : `${slab.minQty}+`;
                      return (
                        <tr
                          key={slab.minQty}
                          onClick={() => setQuantity(Math.min(slab.minQty, Math.max(activeStock, 1)))}
                          className={`cursor-pointer border-t border-stone-100 ${i === activeIndex ? 'bg-brand-green-50 font-semibold text-slate-900' : 'text-slate-700 hover:bg-stone-50'}`}
                        >
                          <td className="px-4 py-2">{range} {slab.minQty === 1 && i === slabs.length - 1 ? 'pc' : 'pcs'}</td>
                          <td className="py-2">{money(slab.pricePerUnit)}</td>
                          <td className="px-4 py-2 text-right">
                            {save > 0 ? `${money(save)} (${Math.round((save / (activePrice || 1)) * 100)}%)` : '–'}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
                <div className="px-4 py-2.5 text-xs bg-brand-green-50 text-brand-green-900">
                  {quantity} × {money(unitPrice)} = <strong>{money(unitPrice * quantity)}</strong>
                  {saved > 0 && <span className="text-brand-green-700"> · you save {money(saved)}</span>}
                  <span className="text-slate-500"> · GST included</span>
                </div>
              </div>
            );
          })()}

          <div className="flex items-center gap-2 text-sm font-semibold">
            {inStock ? (
              <span className="flex items-center gap-1.5 text-emerald-700">
                <CheckCircle2 className="w-4 h-4" />
                {activeStock <= product.lowStockThreshold ? `Only ${activeStock} left` : 'In stock'}
              </span>
            ) : (
              <span className="flex items-center gap-1.5 text-rose-600">
                <AlertCircle className="w-4 h-4" /> Out of stock
              </span>
            )}
            {maxLimit === 1 && (
              <span className="ml-auto text-xs font-bold text-rose-600 bg-rose-50 border border-rose-200 px-3 py-1 rounded-full">
                ⚡ Limit: 1 unit per order
              </span>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center rounded-full border border-stone-300">
              <button
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                disabled={quantity <= 1}
                className="px-4 py-2 text-lg text-slate-600 disabled:opacity-40"
                aria-label="Decrease quantity"
              >
                −
              </button>
              <span className="px-3 font-semibold min-w-[2ch] text-center">{quantity}</span>
              <button
                onClick={() => setQuantity((q) => Math.min(Math.min(activeStock, maxLimit), q + 1))}
                disabled={quantity >= Math.min(activeStock, maxLimit)}
                className="px-4 py-2 text-lg text-slate-600 disabled:opacity-40 disabled:cursor-not-allowed"
                aria-label="Increase quantity"
              >
                +
              </button>
            </div>
            <button
              onClick={add}
              disabled={!inStock}
              className="flex-1 min-w-[140px] py-3 rounded-full bg-brand-green-700 hover:bg-brand-green-800 text-white font-semibold disabled:bg-stone-300 disabled:text-stone-500 transition"
            >
              {added ? 'Added to cart' : 'Add to cart'}
            </button>
            <button
              onClick={async () => {
                if (await add()) shell.openCheckout();
              }}
              disabled={!inStock}
              className="flex-1 min-w-[140px] py-3 rounded-full bg-brand-orange-500 hover:bg-brand-orange-600 text-white font-semibold disabled:bg-stone-300 disabled:text-stone-500 transition"
            >
              Buy now
            </button>
          </div>

          <button
            onClick={() => window.open(`https://wa.me/${settings.whatsAppNumber}?text=${encodeURIComponent(`Hi, I have a question about ${product.name} ${selectedVariant ? `(${selectedVariant.name}) ` : ''}(SKU ${activeSku}).`)}`, '_blank')}
            className="self-start inline-flex items-center gap-2 text-sm font-semibold text-brand-green-700 hover:underline"
          >
            <WhatsAppIcon className="w-4 h-4" /> Ask a question on WhatsApp
          </button>

          <ul className="grid sm:grid-cols-3 gap-3 pt-2 text-xs text-slate-600">
            <li className="flex items-start gap-2"><Truck className="w-4 h-4 text-brand-green-700 shrink-0" /> Free delivery above ₹{settings.freeShippingThreshold.toLocaleString('en-IN')}</li>
            <li className="flex items-start gap-2"><ShieldCheck className="w-4 h-4 text-brand-green-700 shrink-0" /> Secure payments & COD</li>
            <li className="flex items-start gap-2"><RefreshCw className="w-4 h-4 text-brand-green-700 shrink-0" /> <Link href="/policies/returns" className="underline">7-day damage replacement</Link></li>
          </ul>
        </div>
      </div>

      <section className="mt-8 bg-white rounded-3xl border border-stone-200 p-5 sm:p-8 grid md:grid-cols-3 gap-8">
        <div className="md:col-span-2">
          <h2 className="text-xl font-bold text-brand-green-800 mb-3">About this product</h2>
          <p className="text-slate-600 leading-relaxed whitespace-pre-line">{product.longDescription}</p>
        </div>
        <dl className="text-sm space-y-2">
          <h2 className="text-xl font-bold text-brand-green-800 mb-3">Details</h2>
          {[
            ['SKU', activeSku],
            ['HSN code', product.hsnCode],
            ...(product.netQuantity ? [['Net Quantity', product.netQuantity]] : []),
            ['GST rate', `${product.gstRate}%`],
            ['Weight', `${product.weightKg} kg`],
            ...(product.dimensionsCm ? [['Dimensions', `${product.dimensionsCm} cm`]] : []),
          ].map(([k, v]) => (
            <div key={k} className="flex justify-between border-b border-stone-100 pb-1.5">
              <dt className="text-slate-500">{k}</dt>
              <dd className="font-medium text-slate-900">{v}</dd>
            </div>
          ))}
        </dl>
      </section>

      <ProductReviews productId={product.id} />

      {related.length > 0 && (
        <section className="mt-10">
          <h2 className="text-2xl font-bold text-brand-green-800 mb-5">You may also like</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {related.map((p) => (
              <ProductCard key={p.id} product={p} onQuickView={shell.openProduct} onOpenBulkModal={shell.openBulk} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
};
