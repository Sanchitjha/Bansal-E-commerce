'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useLuminary } from '@/context/LuminaryContext';
import { optimizeImage } from '@/lib/media';
import { collectionHref } from '@/lib/collections';
import type { HeroBanner } from '@/types';

interface HeroBannerSliderProps {
  onOpenBulkModal: () => void;
}

// Banners saved before the collection pages existed point at these old shortcuts.
const LEGACY_LINKS: Record<string, string> = {
  '/fragrance': collectionHref('fragrances'),
  '/ayurvedic': collectionHref('ayurvedic-care'),
  '/gadgets': collectionHref('mini-gadgets'),
};

export const HeroBannerSlider: React.FC<HeroBannerSliderProps> = ({ onOpenBulkModal }) => {
  const { heroBanners, products } = useLuminary();
  const [activeSlide, setActiveSlide] = useState(0);
  const [paused, setPaused] = useState(false);

  const banners = heroBanners.filter((b) => b.isActive).sort((a, b) => a.priority - b.priority);

  useEffect(() => {
    if (banners.length <= 1 || paused) return;
    const interval = setInterval(() => setActiveSlide((prev) => (prev + 1) % banners.length), 6000);
    return () => clearInterval(interval);
  }, [banners.length, paused]);

  const current = Math.min(activeSlide, Math.max(banners.length - 1, 0));
  const go = (dir: 1 | -1) => setActiveSlide((prev) => (prev + dir + banners.length) % banners.length);

  /** Where a banner leads: its product, a page on this site, or (as a last resort) the bulk quote form. */
  const hrefFor = (banner: HeroBanner): string | null => {
    const product = banner.productId ? products.find((p) => p.id === banner.productId) : undefined;
    if (product) return `/product/${product.urlSlug}`;
    const target = LEGACY_LINKS[banner.destinationUrl] ?? banner.destinationUrl;
    return /^\/(collections|product|policies)\//.test(target) || target === '/#deals' ? target : null;
  };

  if (banners.length === 0) {
    return <div className="w-full h-[320px] sm:h-[460px] bg-[#f1e6cf] animate-pulse" />;
  }

  const cta = (banner: HeroBanner, href: string | null, className: string) => {
    const label = banner.buttonText || 'SHOP NOW';
    return href ? (
      <Link href={href} className={className}>{label}</Link>
    ) : (
      <button onClick={onOpenBulkModal} className={className}>{label}</button>
    );
  };

  const buttonClass =
    'inline-flex items-center justify-center whitespace-nowrap px-8 py-3.5 bg-black hover:bg-brand-green-800 text-white text-[13px] font-semibold uppercase tracking-[0.16em] transition';

  return (
    <section
      className="relative w-full bg-[#f1e6cf] overflow-hidden"
      aria-roledescription="carousel"
      aria-label="Featured offers"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      {/* Slides sit on top of each other so the section keeps one height and they cross-fade. */}
      <div className="grid">
        {banners.map((banner, i) => {
          const href = hrefFor(banner);
          const isCurrent = i === current;
          const split = banner.layout === 'split';
          const showText = banner.showText !== false;

          return (
            <div
              key={banner.id}
              role="group"
              aria-label={`${i + 1} of ${banners.length}`}
              aria-hidden={!isCurrent}
              className={`[grid-area:1/1] transition-opacity duration-700 ${isCurrent ? 'opacity-100 z-10' : 'opacity-0 pointer-events-none z-0'}`}
            >
              {split ? (
                <div className="max-w-[1400px] mx-auto px-4 sm:px-6 pt-5 pb-8">
                  <div className="relative rounded-3xl overflow-hidden bg-[#f1e6cf] grid grid-cols-1 md:grid-cols-2 min-h-[380px] md:min-h-[440px]">
                    <div className="order-2 md:order-1 p-7 sm:p-10 md:p-14 flex flex-col justify-center gap-4 relative z-10">
                      {banner.badge && (
                        <span className="self-start px-3 py-1 rounded-full bg-white/70 text-brand-green-700 text-[11px] font-bold uppercase tracking-widest">{banner.badge}</span>
                      )}
                      <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-brand-green-800 leading-[1.1]">{banner.title}</h2>
                      <p className="text-sm sm:text-base text-slate-700 max-w-md leading-relaxed">{banner.subtitle}</p>
                      <div className="pt-1">{cta(banner, href, buttonClass)}</div>
                    </div>
                    <div className="order-1 md:order-2 relative h-56 md:h-auto md:rounded-l-[120px] overflow-hidden">
                      <img src={optimizeImage(banner.imageUrl, 1200)} alt={banner.title} className="absolute inset-0 w-full h-full object-cover" />
                    </div>
                  </div>
                </div>
              ) : (
                <div className="relative md:h-[540px] lg:h-[620px]">
                  <img
                    src={optimizeImage(banner.imageUrl, 2200)}
                    alt={showText ? '' : banner.title}
                    loading={i === 0 ? 'eager' : 'lazy'}
                    className="w-full h-60 sm:h-72 md:h-full object-cover object-[78%_center] md:absolute md:inset-0"
                  />

                  {showText ? (
                    <>
                      <div className="hidden md:block absolute inset-y-0 left-0 w-[52%] bg-gradient-to-r from-white/80 via-white/40 to-transparent" aria-hidden />
                      <div className="md:absolute md:inset-0 md:flex md:items-center bg-[#f6f0e4] md:bg-transparent">
                        <div className="w-full max-w-[1400px] mx-auto px-5 sm:px-8 md:px-20 py-7 md:py-0">
                          <div className="max-w-[460px] flex flex-col gap-4 items-start">
                            {banner.badge && (
                              <span className="px-3 py-1 bg-black text-white text-[11px] font-semibold uppercase tracking-[0.2em]">{banner.badge}</span>
                            )}
                            <h2 className="text-3xl sm:text-4xl lg:text-[3.4rem] font-bold text-brand-green-900 leading-[1.08]">{banner.title}</h2>
                            {banner.subtitle && <p className="text-sm sm:text-base text-slate-700 leading-relaxed">{banner.subtitle}</p>}
                            {banner.discountTag && (
                              <span className="px-3 py-1 bg-brand-orange-500 text-white text-xs font-bold tracking-wide">{banner.discountTag}</span>
                            )}
                            <div className="pt-1">{cta(banner, href, buttonClass)}</div>
                          </div>
                        </div>
                      </div>
                    </>
                  ) : href ? (
                    <Link href={href} className="absolute inset-0" aria-label={banner.title} />
                  ) : null}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {banners.length > 1 && (
        <>
          <button
            onClick={() => go(-1)}
            className="hidden md:flex absolute left-4 top-1/2 -translate-y-1/2 z-20 w-11 h-11 rounded-full bg-white/90 hover:bg-white text-slate-900 items-center justify-center shadow"
            aria-label="Previous slide"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            onClick={() => go(1)}
            className="hidden md:flex absolute right-4 top-1/2 -translate-y-1/2 z-20 w-11 h-11 rounded-full bg-white/90 hover:bg-white text-slate-900 items-center justify-center shadow"
            aria-label="Next slide"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
          <div className="absolute z-20 left-1/2 -translate-x-1/2 top-[206px] sm:top-[254px] md:top-auto md:bottom-5 flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/80">
            {banners.map((b, i) => (
              <button
                key={b.id}
                onClick={() => setActiveSlide(i)}
                aria-label={`Go to slide ${i + 1}`}
                className={`h-1.5 rounded-full transition-all ${i === current ? 'w-8 bg-black' : 'w-4 bg-black/30 hover:bg-black/50'}`}
              />
            ))}
          </div>
        </>
      )}
    </section>
  );
};
