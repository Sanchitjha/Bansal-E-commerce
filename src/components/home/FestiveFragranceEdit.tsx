'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Sparkles, ShoppingBag, Eye, Gift, Flame, ArrowRight, Check, Clock } from 'lucide-react';
import { useLuminary } from '@/context/LuminaryContext';
import { optimizeImage } from '@/lib/media';
import { Product } from '@/types';

interface FestiveFragranceEditProps {
  onQuickView: (product: Product) => void;
}

export const FestiveFragranceEdit: React.FC<FestiveFragranceEditProps> = ({ onQuickView }) => {
  const { products, addToCart, showToast } = useLuminary();
  const [addingId, setAddingId] = useState<string | null>(null);
  const [copiedCoupon, setCopiedCoupon] = useState(false);

  // Countdown timer for festival season urgency
  const [timeLeft, setTimeLeft] = useState({ hours: 18, minutes: 42, seconds: 15 });

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev.seconds > 0) return { ...prev, seconds: prev.seconds - 1 };
        if (prev.minutes > 0) return { ...prev, minutes: 59, seconds: 59 };
        if (prev.hours > 0) return { ...prev, hours: prev.hours - 1, minutes: 59, seconds: 59 };
        return { hours: 24, minutes: 0, seconds: 0 };
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const handleCopyCode = () => {
    navigator.clipboard?.writeText('NAVRATRI1');
    setCopiedCoupon(true);
    showToast('Coupon NAVRATRI1 copied! Apply at checkout for ₹1 Attar deal', 'success');
    setTimeout(() => setCopiedCoupon(false), 2500);
  };

  const handleAddToCart = async (e: React.MouseEvent, product: Product) => {
    e.stopPropagation();
    setAddingId(product.id);
    await addToCart(product, 1);
    showToast(`${product.name} added to cart!`, 'success');
    setTimeout(() => setAddingId(null), 1200);
  };

  // Find featured festive items from product list
  const oneLifeProduct = products.find((p) => p.urlSlug.includes('one-life')) || products[0];
  const pureExtractProduct = products.find((p) => p.urlSlug.includes('pure-extract')) || products[1];
  const fragranceLandProduct = products.find((p) => p.urlSlug.includes('fragrance-land-eau-de-parfum-100ml')) || products[2];
  const crownAttarProduct = products.find((p) => p.urlSlug.includes('crown-attar') || p.subcategory === 'Attars') || products[3];

  const festiveShowcase = [
    {
      title: 'One Life Eau de Parfum (60 ml)',
      badge: 'NAVRATRI SPECIAL',
      accentColor: 'from-amber-500 to-orange-600',
      tag: 'JUST ₹1',
      notes: 'Amber, Honey & Royal Florals',
      price: 1,
      mrp: 299,
      image: 'https://res.cloudinary.com/wu9kqgfs/image/upload/v1791381663/luminary/products/designer-bottles-1.jpg',
      product: oneLifeProduct,
    },
    {
      title: 'Pure Extract Eau de Parfum (60 ml)',
      badge: 'SAPPHIRE LUXURY',
      accentColor: 'from-blue-500 to-indigo-700',
      tag: 'JUST ₹1',
      notes: 'Sweet, Warm & Royal Amber Notes',
      price: 1,
      mrp: 299,
      image: 'https://res.cloudinary.com/wu9kqgfs/image/upload/v1791381664/luminary/products/designer-bottles-2.jpg',
      product: pureExtractProduct,
    },
    {
      title: 'Fragrance Land Eau de Parfum (100 ml)',
      badge: 'FESTIVE BESTSELLER',
      accentColor: 'from-amber-400 to-rose-600',
      tag: 'JUST ₹1',
      notes: 'Spicy Rose, Citrus & Sacred Woods',
      price: 1,
      mrp: 399,
      image: 'https://res.cloudinary.com/wu9kqgfs/image/upload/v1791381611/luminary/products/fragrance-land-100ml-1.jpg',
      product: fragranceLandProduct,
    },
    {
      title: 'Luminary Crown Attar (Teal & Gold)',
      badge: 'PURE ROYAL ITTAR',
      accentColor: 'from-emerald-500 to-teal-700',
      tag: 'JUST ₹1',
      notes: '100% Non-Alcoholic Concentrated Puja Ittar',
      price: 1,
      mrp: 299,
      image: 'https://res.cloudinary.com/wu9kqgfs/image/upload/v1791381631/luminary/products/crown-attar-2.jpg',
      product: crownAttarProduct,
    },
  ];

  return (
    <section id="festive-edit" className="relative w-full overflow-hidden bg-[#2a1306] text-white py-14 sm:py-20">
      {/* Warm festive background gradients and glowing ambiance */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-[#b86b1c]/35 via-[#4a1c06]/60 to-[#1e0a02] pointer-events-none" />

      {/* Decorative Mandala / Floral Watermarks */}
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

      {/* Hanging Festive Fairy Lights & Diya Accents at Top */}
      <div className="absolute top-0 inset-x-0 h-6 flex justify-around opacity-75 pointer-events-none">
        {[...Array(9)].map((_, idx) => (
          <div key={idx} className="flex flex-col items-center">
            <div className="w-[1px] h-3 bg-gradient-to-b from-amber-200 to-amber-500" />
            <div className="w-2 h-2 rounded-full bg-amber-300 shadow-[0_0_8px_#f59e0b] animate-pulse" />
          </div>
        ))}
      </div>

      <div className="relative max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
        {/* Top Floating Announcement Pill & Timer */}
        <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-6 mb-8">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-gradient-to-r from-amber-500/20 via-orange-500/25 to-amber-500/20 border border-amber-400/40 text-amber-300 text-xs sm:text-sm font-semibold tracking-wide shadow-lg backdrop-blur-md">
            <Flame className="w-4 h-4 text-amber-400 fill-amber-400 animate-bounce" />
            <span>NAVRATRI & DIWALI FESTIVE SALE IS LIVE</span>
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping" />
          </div>

          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-black/40 border border-amber-500/30 text-amber-200 text-xs font-mono">
            <Clock className="w-3.5 h-3.5 text-amber-400" />
            <span>FESTIVE DEALS END IN:</span>
            <span className="font-bold text-white bg-amber-600/40 px-1.5 py-0.5 rounded">
              {String(timeLeft.hours).padStart(2, '0')}h : {String(timeLeft.minutes).padStart(2, '0')}m : {String(timeLeft.seconds).padStart(2, '0')}s
            </span>
          </div>
        </div>

        {/* Grand Festive Title Header (Inspired by Belvish Reference) */}
        <div className="text-center max-w-3xl mx-auto mb-12 sm:mb-16">
          <div className="flex items-center justify-center gap-2 text-amber-400 text-xs sm:text-sm uppercase tracking-[0.25em] font-bold mb-2">
            <Sparkles className="w-4 h-4" />
            <span>ROYAL HERITAGE COLLECTION</span>
            <Sparkles className="w-4 h-4" />
          </div>

          <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-extrabold uppercase tracking-wide text-transparent bg-clip-text bg-gradient-to-b from-[#fff3db] via-[#f7d088] to-[#d69838] drop-shadow-[0_4px_16px_rgba(217,119,6,0.35)] font-serif leading-tight">
            Festive Fragrance Edit
          </h2>

          <div className="mt-3 flex items-center justify-center gap-3">
            <div className="h-[1px] w-16 sm:w-24 bg-gradient-to-r from-transparent via-amber-400 to-transparent" />
            <span className="text-amber-400 text-lg">🪔</span>
            <div className="h-[1px] w-16 sm:w-24 bg-gradient-to-r from-transparent via-amber-400 to-transparent" />
          </div>

          <p className="mt-4 text-sm sm:text-base text-amber-100/80 leading-relaxed max-w-2xl mx-auto">
            Bring home the divine fragrance of prosperity this festive season. Handcrafted luxury Eau de Parfums and regal attars, boxed to perfection for puja, celebrations & gifting.
          </p>
        </div>

        {/* 4 Grand Royal Architectural Jharokha Arches (Belvish Style) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-6 lg:gap-8 mb-14">
          {festiveShowcase.map((item, idx) => (
            <div
              key={idx}
              className="group relative flex flex-col items-center bg-gradient-to-b from-[#3a1b0b]/90 to-[#1f0b02] rounded-t-[120px] rounded-b-3xl border-2 border-amber-500/40 p-4 sm:p-5 shadow-[0_12px_36px_rgba(0,0,0,0.6)] hover:border-amber-400 hover:shadow-[0_0_35px_rgba(245,158,11,0.35)] transition-all duration-500 hover:-translate-y-1.5 cursor-pointer"
              onClick={() => item.product && onQuickView(item.product)}
            >
              {/* Inner Glowing Arch Contour */}
              <div className="absolute inset-1 rounded-t-[115px] rounded-b-[20px] border border-amber-400/20 pointer-events-none group-hover:border-amber-400/50 transition-colors" />

              {/* Arch Top Ornamental Crown / Diya */}
              <div className="relative -mt-2 mb-3 flex flex-col items-center">
                <span className="text-xl filter drop-shadow-[0_0_8px_rgba(245,158,11,0.8)]">🪔</span>
                <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-amber-300 mt-1 px-2.5 py-0.5 rounded-full bg-amber-950/80 border border-amber-500/40">
                  {item.badge}
                </span>
              </div>

              {/* Arch Alcove with Illuminated Pedestal Backdrop */}
              <div className="relative w-full aspect-[4/5] rounded-t-[90px] rounded-b-2xl overflow-hidden bg-white border-2 border-amber-400/60 flex items-center justify-center p-3.5 shadow-[0_8px_24px_rgba(0,0,0,0.4)]">
                {/* Subtle Top Golden Light Spill */}
                <div className="absolute top-0 inset-x-0 h-16 bg-gradient-to-b from-amber-100/40 to-transparent pointer-events-none" />

                {/* Floating Discount Badge */}
                <div className="absolute top-3 right-3 z-10 px-2 py-0.5 rounded bg-brand-orange-500 text-white text-[10px] font-extrabold tracking-wide shadow-md">
                  {item.tag}
                </div>

                <img
                  src={optimizeImage(item.image, 600)}
                  alt={item.title}
                  loading="lazy"
                  className="relative z-10 w-full h-full object-contain filter drop-shadow-[0_8px_16px_rgba(0,0,0,0.2)] group-hover:scale-108 transition-transform duration-500"
                />

                {/* Quick View Hover Overlay */}
                <div className="absolute inset-0 z-20 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-400 text-black text-xs font-bold uppercase tracking-wider shadow-xl">
                    <Eye className="w-3.5 h-3.5" />
                    Quick View
                  </span>
                </div>
              </div>

              {/* Product Information */}
              <div className="w-full mt-4 flex flex-col items-center text-center">
                <h3 className="text-base sm:text-lg font-bold text-amber-100 font-serif leading-snug group-hover:text-amber-300 transition line-clamp-1">
                  {item.title}
                </h3>
                <p className="text-xs text-amber-200/60 mt-1 line-clamp-1 italic">
                  {item.notes}
                </p>

                {/* Pricing Display */}
                <div className="mt-3 flex items-baseline gap-2">
                  <span className="text-xl sm:text-2xl font-extrabold text-amber-300">
                    ₹{item.price.toLocaleString('en-IN')}
                  </span>
                  <span className="text-xs text-amber-300/40 line-through">
                    ₹{item.mrp.toLocaleString('en-IN')}
                  </span>
                  <span className="text-[10px] font-bold text-amber-400 bg-amber-400/10 border border-amber-400/30 px-1.5 py-0.5 rounded">
                    FESTIVE DEAL
                  </span>
                </div>
                <div className="mt-1 text-[11px] font-medium text-amber-200/90 bg-amber-950/70 border border-amber-500/30 px-2 py-0.5 rounded-full inline-block">
                  + ₹98 Delivery · Total ₹99 Payable
                </div>

                {/* Action CTA */}
                <div className="mt-4 w-full flex gap-2">
                  <button
                    onClick={(e) => item.product && handleAddToCart(e, item.product)}
                    disabled={addingId === item.product?.id}
                    className="flex-1 inline-flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black text-xs font-bold uppercase tracking-wider shadow-lg transition"
                  >
                    <ShoppingBag className="w-3.5 h-3.5" />
                    {addingId === item.product?.id ? 'Added!' : 'Add to Cart'}
                  </button>

                  {item.product && (
                    <Link
                      href={`/product/${item.product.urlSlug}`}
                      onClick={(e) => e.stopPropagation()}
                      className="p-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-amber-300 transition"
                      aria-label="View Product"
                    >
                      <ArrowRight className="w-4 h-4" />
                    </Link>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Special Navratri ₹1 Attar Banner Spotlight (Featuring Image 3) */}
        <div className="relative rounded-3xl overflow-hidden border-2 border-amber-500/50 bg-gradient-to-r from-[#3e1707] via-[#2a0e03] to-[#451b08] p-6 sm:p-10 shadow-2xl">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            {/* Banner Artwork Preview */}
            <div className="lg:col-span-7 relative rounded-2xl overflow-hidden border border-amber-400/40 shadow-xl group">
              <img
                src="https://res.cloudinary.com/wu9kqgfs/image/upload/v1791713912/luminary/banners/navratri-special-offer-attar.jpg"
                alt="Navratri Special Offer – Any Perfume for Just ₹1"
                className="w-full h-auto object-cover group-hover:scale-102 transition duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none" />
              <div className="absolute bottom-3 left-3 text-white text-xs font-semibold bg-black/60 backdrop-blur-md px-3 py-1 rounded-full border border-amber-400/40">
                🪔 Navratri Special Festival Offer
              </div>
            </div>

            {/* Offer Details & Breakdown Box */}
            <div className="lg:col-span-5 flex flex-col items-start gap-4 text-left">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-orange-500/20 text-brand-orange-400 border border-brand-orange-500/40 text-xs font-bold uppercase tracking-wider">
                <Gift className="w-3.5 h-3.5" />
                Limited Time Festival Promotion
              </div>

              <h3 className="text-2xl sm:text-3xl font-bold font-serif text-amber-100 leading-tight">
                Navratri Special Offer – <span className="text-amber-300 font-extrabold underline decoration-amber-500">Any Perfume for Just ₹1!</span>
              </h3>

              <p className="text-sm text-amber-100/85 leading-relaxed">
                Celebrate Navratri with luxury fragrances! Get any premium Eau de Parfum (60ml/100ml) or Royal Attar for only <strong className="text-white">₹1</strong> (MRP ₹299–₹399). Flat ₹98 delivery charge per order — final amount payable is <strong className="text-amber-300 font-bold">exactly ₹99</strong> for one perfume.
              </p>

              {/* Offer Breakdown Strip */}
              <div className="w-full p-4 rounded-2xl bg-black/60 border border-amber-400/40 space-y-2">
                <div className="flex items-center justify-between border-b border-amber-500/20 pb-2">
                  <span className="text-xs text-amber-200/80">Perfume Price:</span>
                  <span className="text-sm font-bold text-amber-300">₹1 only</span>
                </div>
                <div className="flex items-center justify-between border-b border-amber-500/20 pb-2">
                  <span className="text-xs text-amber-200/80">Delivery Charges:</span>
                  <span className="text-sm font-bold text-white">₹98 (flat per order)</span>
                </div>
                <div className="flex items-center justify-between pt-1">
                  <span className="text-xs font-bold uppercase tracking-wider text-amber-400">Total Amount Payable:</span>
                  <span className="text-base font-extrabold text-amber-300">₹99 ONLY</span>
                </div>
                <p className="text-[10px] text-amber-200/60 pt-1">
                  *Buy multiple perfumes in the same order: ₹1 each, ₹98 delivery applied only once!
                </p>
              </div>

              <Link
                href="/collections/perfumes"
                className="w-full inline-flex items-center justify-center gap-2 py-3.5 px-6 rounded-xl bg-gradient-to-r from-amber-400 via-amber-300 to-amber-500 hover:brightness-110 text-brand-green-950 text-sm font-extrabold uppercase tracking-widest shadow-xl transition"
              >
                Shop All Perfumes @ ₹1
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>

        {/* Festive Bottom Trust Ticker */}
        <div className="mt-12 pt-8 border-t border-amber-500/20 grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
          <div className="flex flex-col items-center gap-1">
            <span className="text-xl">🪔</span>
            <span className="text-xs font-bold text-amber-200">100% Divine Scents</span>
            <span className="text-[11px] text-amber-200/50">Puja & festive friendly</span>
          </div>
          <div className="flex flex-col items-center gap-1">
            <span className="text-xl">🎁</span>
            <span className="text-xs font-bold text-amber-200">Luxury Gift Boxes</span>
            <span className="text-[11px] text-amber-200/50">Ready for Diwali gifting</span>
          </div>
          <div className="flex flex-col items-center gap-1">
            <span className="text-xl">⚡</span>
            <span className="text-xs font-bold text-amber-200">Fast Festival Dispatch</span>
            <span className="text-[11px] text-amber-200/50">Quick express delivery</span>
          </div>
          <div className="flex flex-col items-center gap-1">
            <span className="text-xl">🌟</span>
            <span className="text-xs font-bold text-amber-200">12+ Hour Projection</span>
            <span className="text-[11px] text-amber-200/50">Long-lasting Eau de Parfum</span>
          </div>
        </div>
      </div>
    </section>
  );
};
