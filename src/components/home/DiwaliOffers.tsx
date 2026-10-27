'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Sparkles, ShoppingBag, Eye, Gift, Flame, ArrowRight } from 'lucide-react';
import { useLuminary } from '@/context/LuminaryContext';
import { optimizeImage } from '@/lib/media';
import { Product } from '@/types';

interface DiwaliOffersProps {
  onQuickView: (product: Product) => void;
}

const ATTAR_ID = 'prod-attar-2ml';
const ATTAR_SLUG = 'diwali-special-attar-2ml';

export const DiwaliOffers: React.FC<DiwaliOffersProps> = ({ onQuickView }) => {
  const { products, settings, addToCart, showToast } = useLuminary();
  const [addingId, setAddingId] = useState<string | null>(null);

  const handleAddToCart = async (e: React.MouseEvent, product: Product) => {
    e.stopPropagation();
    setAddingId(product.id);
    await addToCart(product, 1);
    showToast(`${product.name} added to cart!`, 'success');
    setTimeout(() => setAddingId(null), 1200);
  };

  const attar = products.find((p) => p.id === ATTAR_ID || p.urlSlug === ATTAR_SLUG);
  const giftPacks = products.filter((p) => p.subcategory === 'Gift sets').slice(0, 3);
  if (!attar && giftPacks.length === 0) return null;

  const shipping = settings.defaultShippingCharge;
  const threshold = settings.freeShippingThreshold;

  const cards = [
    ...(attar
      ? [
          {
            product: attar,
            badge: 'DIWALI OFFER',
            tag: `JUST ₹${attar.sellingPrice}`,
            notes: '2 ml pure concentrated attar · 1 per order',
            delivery: `+ ₹${shipping} delivery · Total ₹${attar.sellingPrice + shipping}`,
          },
        ]
      : []),
    ...giftPacks.map((product) => {
      const packsForFreeDelivery = Math.ceil(threshold / product.sellingPrice);
      return {
        product,
        badge: 'DIWALI GIFTING OFFER',
        tag: `${Math.round(((product.mrp - product.sellingPrice) / product.mrp) * 100)}% OFF`,
        notes: '2 perfume sprays + 2 crown-cap attars',
        delivery:
          product.sellingPrice >= threshold
            ? 'FREE delivery'
            : `Buy ${packsForFreeDelivery} for FREE delivery`,
      };
    }),
  ];

  return (
    <section id="diwali-offers" className="relative w-full overflow-hidden bg-[#2a1306] text-white py-14 sm:py-20">
      {/* Warm festive background gradients and glowing ambiance */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-[#b86b1c]/35 via-[#4a1c06]/60 to-[#1e0a02] pointer-events-none" />

      {/* Decorative dotted mandala watermarks */}
      <div
        className="absolute -top-32 -left-32 w-96 h-96 rounded-full border border-amber-500/15 pointer-events-none opacity-40 blur-[1px]"
        style={{
          backgroundImage: 'radial-gradient(circle, rgba(245,158,11,0.15) 2px, transparent 2px)',
          backgroundSize: '24px 24px',
        }}
      />
      <div
        className="absolute -top-32 -right-32 w-96 h-96 rounded-full border border-amber-500/15 pointer-events-none opacity-40 blur-[1px]"
        style={{
          backgroundImage: 'radial-gradient(circle, rgba(245,158,11,0.15) 2px, transparent 2px)',
          backgroundSize: '24px 24px',
        }}
      />

      {/* Hanging fairy lights at the top */}
      <div className="absolute top-0 inset-x-0 h-6 flex justify-around opacity-75 pointer-events-none">
        {[...Array(9)].map((_, idx) => (
          <div key={idx} className="flex flex-col items-center">
            <div className="w-[1px] h-3 bg-gradient-to-b from-amber-200 to-amber-500" />
            <div className="w-2 h-2 rounded-full bg-amber-300 shadow-[0_0_8px_#f59e0b] animate-pulse" />
          </div>
        ))}
      </div>

      <div className="relative max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-center mb-8">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-gradient-to-r from-amber-500/20 via-orange-500/25 to-amber-500/20 border border-amber-400/40 text-amber-300 text-xs sm:text-sm font-semibold tracking-wide shadow-lg backdrop-blur-md">
            <Flame className="w-4 h-4 text-amber-400 fill-amber-400 animate-bounce" />
            <span>DIWALI OFFERS ARE LIVE</span>
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping" />
          </div>
        </div>

        <div className="text-center max-w-3xl mx-auto mb-12 sm:mb-16">
          <div className="flex items-center justify-center gap-2 text-amber-400 text-xs sm:text-sm uppercase tracking-[0.25em] font-bold mb-2">
            <Sparkles className="w-4 h-4" />
            <span>HAPPY DIWALI</span>
            <Sparkles className="w-4 h-4" />
          </div>

          <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-extrabold uppercase tracking-wide text-transparent bg-clip-text bg-gradient-to-b from-[#fff3db] via-[#f7d088] to-[#d69838] drop-shadow-[0_4px_16px_rgba(217,119,6,0.35)] font-serif leading-tight">
            Diwali Offers
          </h2>

          <div className="mt-3 flex items-center justify-center gap-3">
            <div className="h-[1px] w-16 sm:w-24 bg-gradient-to-r from-transparent via-amber-400 to-transparent" />
            <span className="text-amber-400 text-lg">🪔</span>
            <div className="h-[1px] w-16 sm:w-24 bg-gradient-to-r from-transparent via-amber-400 to-transparent" />
          </div>

          <p className="mt-4 text-sm sm:text-base text-amber-100/80 leading-relaxed max-w-2xl mx-auto">
            A 2 ml attar for just ₹1 and any Luminary gift pack at ₹549. Premium fragrances in elegant packaging, ready to gift this Diwali.
          </p>
        </div>

        {/* Offer cards: the ₹1 attar and the gift packs */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8 mb-14">
          {cards.map(({ product, badge, tag, notes, delivery }) => (
            <div
              key={product.id}
              className="group relative flex flex-col items-center bg-gradient-to-b from-[#3a1b0b]/90 to-[#1f0b02] rounded-t-[120px] rounded-b-3xl border-2 border-amber-500/40 p-4 sm:p-5 shadow-[0_12px_36px_rgba(0,0,0,0.6)] hover:border-amber-400 hover:shadow-[0_0_35px_rgba(245,158,11,0.35)] transition-all duration-500 hover:-translate-y-1.5 cursor-pointer"
              onClick={() => onQuickView(product)}
            >
              <div className="absolute inset-1 rounded-t-[115px] rounded-b-[20px] border border-amber-400/20 pointer-events-none group-hover:border-amber-400/50 transition-colors" />

              <div className="relative -mt-2 mb-3 flex flex-col items-center">
                <span className="text-xl filter drop-shadow-[0_0_8px_rgba(245,158,11,0.8)]">🪔</span>
                <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-amber-300 mt-1 px-2.5 py-0.5 rounded-full bg-amber-950/80 border border-amber-500/40">
                  {badge}
                </span>
              </div>

              <div className="relative w-full aspect-[4/5] rounded-t-[90px] rounded-b-2xl overflow-hidden bg-white border-2 border-amber-400/60 flex items-center justify-center p-3.5 shadow-[0_8px_24px_rgba(0,0,0,0.4)]">
                <div className="absolute top-0 inset-x-0 h-16 bg-gradient-to-b from-amber-100/40 to-transparent pointer-events-none" />

                <div className="absolute bottom-3 right-3 z-10 px-2 py-0.5 rounded bg-brand-orange-500 text-white text-[10px] font-extrabold tracking-wide shadow-md">
                  {tag}
                </div>

                <img
                  src={optimizeImage(product.images[0], 600)}
                  alt={product.name}
                  loading="lazy"
                  className="relative z-10 w-full h-full object-contain filter drop-shadow-[0_8px_16px_rgba(0,0,0,0.2)] group-hover:scale-105 transition-transform duration-500"
                />

                <div className="absolute inset-0 z-20 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-400 text-black text-xs font-bold uppercase tracking-wider shadow-xl">
                    <Eye className="w-3.5 h-3.5" />
                    Quick View
                  </span>
                </div>
              </div>

              <div className="w-full mt-4 flex flex-col items-center text-center">
                <h3 className="text-base sm:text-lg font-bold text-amber-100 font-serif leading-snug group-hover:text-amber-300 transition line-clamp-2 min-h-[2.75rem]">
                  {product.name}
                </h3>
                <p className="text-xs text-amber-200/60 mt-1 line-clamp-1 italic">{notes}</p>

                <div className="mt-3 flex items-baseline gap-2">
                  <span className="text-xl sm:text-2xl font-extrabold text-amber-300">
                    ₹{product.sellingPrice.toLocaleString('en-IN')}
                  </span>
                  <span className="text-xs text-amber-300/40 line-through">
                    ₹{product.mrp.toLocaleString('en-IN')}
                  </span>
                </div>
                <div className="mt-1 text-[11px] font-medium text-amber-200/90 bg-amber-950/70 border border-amber-500/30 px-2 py-0.5 rounded-full inline-block">
                  {delivery}
                </div>

                <div className="mt-4 w-full flex gap-2">
                  <button
                    onClick={(e) => handleAddToCart(e, product)}
                    disabled={addingId === product.id}
                    className="flex-1 inline-flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black text-xs font-bold uppercase tracking-wider shadow-lg transition"
                  >
                    <ShoppingBag className="w-3.5 h-3.5" />
                    {addingId === product.id ? 'Added!' : 'Add to Cart'}
                  </button>

                  <Link
                    href={`/product/${product.urlSlug}`}
                    onClick={(e) => e.stopPropagation()}
                    className="p-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-amber-300 transition"
                    aria-label="View Product"
                  >
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* The two offers, in plain words */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {attar && (
            <div className="rounded-3xl border-2 border-amber-500/50 bg-gradient-to-r from-[#3e1707] via-[#2a0e03] to-[#451b08] p-6 sm:p-8 shadow-2xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-orange-500/20 text-brand-orange-400 border border-brand-orange-500/40 text-xs font-bold uppercase tracking-wider">
                <Gift className="w-3.5 h-3.5" />
                Diwali Offer
              </div>
              <h3 className="mt-3 text-2xl sm:text-3xl font-bold font-serif text-amber-100 leading-tight">
                2 ml Attar (Worth ₹{attar.mrp}) <span className="text-amber-300 font-extrabold underline decoration-amber-500">Just at ₹{attar.sellingPrice} Only</span>
              </h3>
              <div className="mt-4 p-4 rounded-2xl bg-black/60 border border-amber-400/40 space-y-2 text-sm">
                <div className="flex items-center justify-between border-b border-amber-500/20 pb-2">
                  <span className="text-xs text-amber-200/80">Attar (2 ml)</span>
                  <span className="font-bold text-amber-300">₹{attar.sellingPrice}</span>
                </div>
                <div className="flex items-center justify-between border-b border-amber-500/20 pb-2">
                  <span className="text-xs text-amber-200/80">Delivery</span>
                  <span className="font-bold text-white">₹{shipping}</span>
                </div>
                <div className="flex items-center justify-between pt-1">
                  <span className="text-xs font-bold uppercase tracking-wider text-amber-400">Total payable</span>
                  <span className="font-extrabold text-amber-300">₹{attar.sellingPrice + shipping}</span>
                </div>
                <p className="text-[10px] text-amber-200/60 pt-1">Limit of one per order.</p>
              </div>
              <button
                onClick={(e) => handleAddToCart(e, attar)}
                disabled={addingId === attar.id}
                className="mt-5 w-full inline-flex items-center justify-center gap-2 py-3.5 px-6 rounded-xl bg-gradient-to-r from-amber-400 via-amber-300 to-amber-500 hover:brightness-110 text-brand-green-950 text-sm font-extrabold uppercase tracking-widest shadow-xl transition disabled:opacity-60"
              >
                <ShoppingBag className="w-4 h-4" />
                {addingId === attar.id ? 'Adding to Cart...' : `Grab 2 ml Attar @ ₹${attar.sellingPrice}`}
              </button>
            </div>
          )}

          {giftPacks.length > 0 && (
            <div className="rounded-3xl border-2 border-amber-500/50 bg-gradient-to-r from-[#3e1707] via-[#2a0e03] to-[#451b08] p-6 sm:p-8 shadow-2xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-orange-500/20 text-brand-orange-400 border border-brand-orange-500/40 text-xs font-bold uppercase tracking-wider">
                <Gift className="w-3.5 h-3.5" />
                Diwali Gifting Offer
              </div>
              <h3 className="mt-3 text-2xl sm:text-3xl font-bold font-serif text-amber-100 leading-tight">
                Any Gift Pack <span className="text-amber-300 font-extrabold underline decoration-amber-500">@ ₹{giftPacks[0].sellingPrice}</span>
                <span className="block text-base font-medium text-amber-200/70 mt-1">MRP ₹{giftPacks[0].mrp}</span>
              </h3>
              <ul className="mt-4 p-4 rounded-2xl bg-black/60 border border-amber-400/40 space-y-2 text-sm text-amber-100/90">
                <li>🎁 Perfect Diwali gift</li>
                <li>✨ Premium fragrances</li>
                <li>📦 Elegant packaging</li>
                <li>💛 Long lasting impression</li>
              </ul>
              <Link
                href="/collections/gift-sets"
                className="mt-5 w-full inline-flex items-center justify-center gap-2 py-3.5 px-6 rounded-xl bg-gradient-to-r from-amber-400 via-amber-300 to-amber-500 hover:brightness-110 text-brand-green-950 text-sm font-extrabold uppercase tracking-widest shadow-xl transition"
              >
                Shop Gift Packs
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};
