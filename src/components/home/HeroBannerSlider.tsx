'use client';

import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Play } from 'lucide-react';
import { useLuminary } from '@/context/LuminaryContext';

interface HeroBannerSliderProps {
  onSelectProduct: (productId: string) => void;
  onOpenBulkModal: () => void;
}

export const HeroBannerSlider: React.FC<HeroBannerSliderProps> = ({ onSelectProduct, onOpenBulkModal }) => {
  const { heroBanners, products } = useLuminary();
  const [activeSlide, setActiveSlide] = useState(0);

  const activeBanners = heroBanners.filter((b) => b.isActive).sort((a, b) => a.priority - b.priority);

  useEffect(() => {
    if (activeBanners.length <= 1) return;
    const interval = setInterval(() => {
      setActiveSlide((prev) => (prev + 1) % activeBanners.length);
    }, 6000);
    return () => clearInterval(interval);
  }, [activeBanners.length]);

  const totalReviews = products.reduce((sum, p) => sum + p.reviewsCount, 0);
  const avgRating = products.length
    ? (products.reduce((sum, p) => sum + p.rating, 0) / products.length).toFixed(1)
    : '0.0';

  const banner = activeBanners[activeSlide] || activeBanners[0];
  const go = (dir: 1 | -1) => setActiveSlide((prev) => (prev + dir + activeBanners.length) % activeBanners.length);

  return (
    <section className="max-w-[1400px] mx-auto px-4 sm:px-6 pt-5">
      {banner ? (
        <div className="relative rounded-3xl overflow-hidden bg-[#f1e6cf] grid grid-cols-1 md:grid-cols-2 min-h-[380px] md:min-h-[440px]">
          <div className="order-2 md:order-1 p-7 sm:p-10 md:p-14 flex flex-col justify-center gap-4 relative z-10">
            <span className="self-start px-3 py-1 rounded-full bg-white/70 text-brand-green-700 text-[11px] font-bold uppercase tracking-widest">
              {banner.badge}
            </span>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-brand-green-800 leading-[1.1]">
              {banner.title}
            </h1>
            <p className="text-sm sm:text-base text-slate-700 max-w-md leading-relaxed">{banner.subtitle}</p>
            {banner.discountTag && (
              <span className="self-start px-3 py-1 rounded-md bg-brand-orange-500 text-white text-xs font-bold tracking-wide">
                {banner.discountTag}
              </span>
            )}
            <div className="flex items-center gap-4 pt-1">
              <button
                onClick={() => (banner.productId ? onSelectProduct(banner.productId) : onOpenBulkModal())}
                className="inline-flex items-center gap-2 px-5 py-3 rounded-lg bg-brand-orange-500 hover:bg-brand-orange-600 text-white text-sm font-bold tracking-wide transition"
              >
                ORDER NOW
                <span className="w-5 h-5 rounded bg-white/90 text-brand-orange-500 flex items-center justify-center">
                  <Play className="w-3 h-3 fill-current" />
                </span>
              </button>
              <button onClick={onOpenBulkModal} className="text-sm font-semibold text-brand-green-700 underline underline-offset-4">
                Request bulk quote
              </button>
            </div>
          </div>

          <div className="order-1 md:order-2 relative h-56 md:h-auto md:rounded-l-[120px] overflow-hidden">
            <img key={banner.id} src={banner.imageUrl} alt={banner.title} className="absolute inset-0 w-full h-full object-cover" />
            {activeBanners.length > 1 && (
              <div className="absolute bottom-4 right-4 flex gap-2">
                <button
                  onClick={() => go(-1)}
                  className="w-9 h-9 rounded-full bg-white/90 text-slate-800 flex items-center justify-center shadow hover:bg-white"
                  aria-label="Previous slide"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <button
                  onClick={() => go(1)}
                  className="w-9 h-9 rounded-full bg-white/90 text-slate-800 flex items-center justify-center shadow hover:bg-white"
                  aria-label="Next slide"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="rounded-3xl bg-[#f1e6cf] min-h-[380px] animate-pulse" />
      )}

      <div className="flex items-center justify-between py-5">
        <div className="flex items-center gap-5 sm:gap-8">
          <div>
            <div className="text-xl sm:text-2xl font-bold text-brand-green-800">{totalReviews.toLocaleString('en-IN')}+</div>
            <div className="text-[10px] sm:text-[11px] font-semibold tracking-wider uppercase text-slate-500">Happy customers</div>
          </div>
          <div className="w-px h-9 bg-stone-300" />
          <div>
            <div className="text-xl sm:text-2xl font-bold text-brand-green-800">{products.length}+</div>
            <div className="text-[10px] sm:text-[11px] font-semibold tracking-wider uppercase text-slate-500">Products</div>
          </div>
          <div className="w-px h-9 bg-stone-300" />
          <div>
            <div className="text-xl sm:text-2xl font-bold text-brand-green-800">{avgRating}★</div>
            <div className="text-[10px] sm:text-[11px] font-semibold tracking-wider uppercase text-slate-500">Avg. rating</div>
          </div>
        </div>

        {activeBanners.length > 1 && (
          <div className="flex items-center gap-2">
            {activeBanners.map((b, i) => (
              <button
                key={b.id}
                onClick={() => setActiveSlide(i)}
                aria-label={`Go to slide ${i + 1}`}
                className={`h-2 rounded-full transition-all ${i === activeSlide ? 'w-5 bg-brand-green-700' : 'w-2 bg-stone-400'}`}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
};
