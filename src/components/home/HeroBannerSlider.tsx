'use client';

import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Sparkles, ArrowRight, ShieldCheck } from 'lucide-react';
import { useLuminary } from '@/context/LuminaryContext';

interface HeroBannerSliderProps {
  onSelectProduct: (productId: string) => void;
  onOpenBulkModal: () => void;
}

export const HeroBannerSlider: React.FC<HeroBannerSliderProps> = ({
  onSelectProduct,
  onOpenBulkModal,
}) => {
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

  if (activeBanners.length === 0) return null;

  const banner = activeBanners[activeSlide] || activeBanners[0];
  const priorityProducts = products.filter((p) => p.isHomepagePriority).sort((a, b) => a.priorityOrder - b.priorityOrder).slice(0, 5);

  return (
    <section className="relative w-full overflow-hidden bg-slate-50 dark:bg-obsidian-950 py-8 lg:py-14 border-b border-amber-500/20 transition-colors duration-300">
      {/* Dynamic Vibrant Gradient Backdrop */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-amber-400/20 via-slate-50 to-slate-50 dark:from-gold-600/15 dark:via-obsidian-950 dark:to-obsidian-950 pointer-events-none" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          {/* Main Slide Content */}
          <div className="lg:col-span-7 space-y-6">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-500/15 dark:bg-gold-500/10 border border-amber-500/40 dark:border-gold-500/30 text-amber-800 dark:text-gold-300 text-xs font-extrabold uppercase tracking-widest shadow-sm">
              <Sparkles className="w-3.5 h-3.5 text-amber-600 dark:text-gold-400" />
              <span>{banner.badge}</span>
              {banner.discountTag && (
                <span className="ml-2 px-2 py-0.5 rounded bg-amber-500 text-slate-950 font-extrabold text-[10px]">
                  {banner.discountTag}
                </span>
              )}
            </div>

            <h1 className="font-serif text-3xl sm:text-5xl lg:text-6xl font-bold text-slate-900 dark:text-slate-100 leading-tight tracking-tight">
              <span className="gold-gradient-text">{banner.title}</span>
            </h1>

            <p className="text-slate-700 dark:text-slate-300 text-sm sm:text-base leading-relaxed max-w-xl font-medium">
              {banner.subtitle}
            </p>

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center gap-4 pt-2">
              {banner.productId ? (
                <button
                  onClick={() => onSelectProduct(banner.productId!)}
                  className="px-6 py-3.5 rounded-xl gold-gradient-bg text-slate-950 font-extrabold text-xs uppercase tracking-wider shadow-lg hover:scale-105 transition flex items-center gap-2 shimmer-btn"
                >
                  <span>{banner.buttonText}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              ) : (
                <a
                  href="#catalog-section"
                  className="px-6 py-3.5 rounded-xl gold-gradient-bg text-slate-950 font-extrabold text-xs uppercase tracking-wider shadow-lg hover:scale-105 transition flex items-center gap-2 shimmer-btn"
                >
                  <span>{banner.buttonText}</span>
                  <ArrowRight className="w-4 h-4" />
                </a>
              )}

              <button
                onClick={onOpenBulkModal}
                className="px-6 py-3.5 rounded-xl bg-white dark:bg-obsidian-900 border border-amber-500/40 text-amber-700 dark:text-gold-300 font-extrabold text-xs uppercase tracking-wider transition shadow-sm hover:border-amber-600"
              >
                <span>Request Wholesale Quote</span>
                <span className="ml-1.5 text-[10px] bg-amber-500/20 px-1.5 py-0.5 rounded text-amber-800 dark:text-gold-300 font-bold">
                  B2B
                </span>
              </button>
            </div>

            {/* Slider Dots */}
            {activeBanners.length > 1 && (
              <div className="flex items-center gap-2 pt-4">
                {activeBanners.map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => setActiveSlide(idx)}
                    className={`h-2 rounded-full transition-all duration-300 ${
                      idx === activeSlide ? 'w-8 bg-amber-500 dark:bg-gold-400' : 'w-2 bg-slate-300 dark:bg-slate-700'
                    }`}
                    aria-label={`Go to slide ${idx + 1}`}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Banner Hero Image Card */}
          <div className="lg:col-span-5 relative">
            <div className="relative aspect-[4/3] rounded-2xl overflow-hidden border border-amber-500/30 dark:border-gold-500/30 shadow-2xl group">
              <img
                src={banner.imageUrl}
                alt={banner.title}
                className="w-full h-full object-cover transition transform duration-700 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent opacity-80" />

              <div className="absolute bottom-4 left-4 right-4 p-4 rounded-xl glass-panel border border-amber-500/30 dark:border-gold-500/30 flex items-center justify-between">
                <div>
                  <p className="text-[11px] text-amber-600 dark:text-gold-400 uppercase tracking-widest font-extrabold">
                    ADMIN MERCHANDISED SELECTION
                  </p>
                  <p className="text-xs text-slate-900 dark:text-slate-100 font-extrabold truncate max-w-[200px]">
                    {banner.title}
                  </p>
                </div>
                {banner.productId && (
                  <button
                    onClick={() => onSelectProduct(banner.productId!)}
                    className="px-3 py-1.5 rounded-lg bg-amber-500 text-slate-950 font-extrabold text-[11px] hover:bg-amber-400 transition"
                  >
                    Quick View
                  </button>
                )}
              </div>
            </div>

            {/* Controls */}
            {activeBanners.length > 1 && (
              <div className="absolute -bottom-4 right-4 flex items-center gap-2">
                <button
                  onClick={() => setActiveSlide((prev) => (prev === 0 ? activeBanners.length - 1 : prev - 1))}
                  className="p-2 rounded-full bg-white dark:bg-obsidian-900 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200 hover:text-amber-600 transition shadow-md"
                  aria-label="Previous Slide"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setActiveSlide((prev) => (prev + 1) % activeBanners.length)}
                  className="p-2 rounded-full bg-white dark:bg-obsidian-900 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200 hover:text-amber-600 transition shadow-md"
                  aria-label="Next Slide"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Priority Products Bar Preview (PDF Section 5 Requirement) */}
        {priorityProducts.length > 0 && (
          <div className="mt-12 pt-6 border-t border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2 text-xs text-amber-600 dark:text-gold-400 font-extrabold uppercase tracking-wider">
                <ShieldCheck className="w-4 h-4" />
                <span>FEATURED HOMEPAGE PRIORITY SELECTION (ADMIN ORDERED)</span>
              </div>
              <span className="text-[11px] text-slate-500 font-semibold">
                {priorityProducts.length} Items Configured
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
              {priorityProducts.map((item, index) => (
                <div
                  key={item.id}
                  onClick={() => onSelectProduct(item.id)}
                  className="p-2.5 rounded-xl bg-white dark:bg-obsidian-900 border border-slate-200 dark:border-slate-800 hover:border-amber-500 cursor-pointer transition transform hover:-translate-y-1 group flex items-center gap-3 shadow-sm"
                >
                  <span className="font-mono text-xs font-bold text-amber-600 dark:text-gold-500 bg-amber-500/10 dark:bg-obsidian-950 px-1.5 py-0.5 rounded border border-amber-500/20">
                    #{index + 1}
                  </span>
                  <div className="w-10 h-10 rounded-lg overflow-hidden shrink-0 border border-slate-200 dark:border-slate-800">
                    <img src={item.images[0]} alt={item.name} className="w-full h-full object-cover group-hover:scale-110 transition" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h5 className="text-[11px] font-bold text-slate-900 dark:text-slate-100 truncate">{item.name}</h5>
                    <p className="text-[10px] text-amber-600 dark:text-gold-400 font-mono font-bold">₹{item.sellingPrice}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
};
