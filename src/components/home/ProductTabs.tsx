'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useLuminary } from '@/context/LuminaryContext';
import { Product } from '@/types';
import { collectionHref } from '@/lib/collections';
import { homeBestSellers, homeNewArrivals } from '@/lib/home-sections';
import { ProductCard } from './ProductCard';

interface ProductTabsProps {
  onQuickView: (product: Product) => void;
  onOpenBulkModal: (product: Product) => void;
}

/** "Best Sellers | New Arrivals": one row that switches, so the same products are never listed twice in a row. */
export const ProductTabs: React.FC<ProductTabsProps> = ({ onQuickView, onOpenBulkModal }) => {
  const { products } = useLuminary();
  const best = homeBestSellers(products);
  const fresh = homeNewArrivals(products);
  const [tab, setTab] = useState<'best' | 'new'>('best');

  const tabs = [
    { id: 'best' as const, label: 'Best Sellers', list: best, href: collectionHref('best-sellers') },
    ...(fresh.length > 0 ? [{ id: 'new' as const, label: 'New Arrivals', list: fresh, href: collectionHref('new-arrivals') }] : []),
  ];
  const active = tabs.find((t) => t.id === tab) ?? tabs[0];

  if (products.length === 0) {
    return (
      <section className="max-w-[1400px] mx-auto px-4 sm:px-6 py-12 grid grid-cols-2 lg:grid-cols-4 gap-5">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="h-96 bg-white/70 animate-pulse" />
        ))}
      </section>
    );
  }

  return (
    <section id="bestsellers" className="scroll-mt-32 max-w-[1400px] mx-auto px-4 sm:px-6 py-12">
      <div role="tablist" className="flex items-center justify-center gap-6 sm:gap-10 mb-8">
        {tabs.map((t) => (
          <button
            key={t.id}
            role="tab"
            aria-selected={active.id === t.id}
            onClick={() => setTab(t.id)}
            className={`pb-2 text-lg sm:text-2xl font-bold uppercase tracking-wide border-b-2 transition ${
              active.id === t.id ? 'text-brand-green-900 border-brand-green-900' : 'text-slate-400 border-transparent hover:text-slate-700'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-5">
        {active.list.map((product) => (
          <ProductCard key={product.id} product={product} onQuickView={onQuickView} onOpenBulkModal={onOpenBulkModal} />
        ))}
      </div>

      <div className="text-center mt-8">
        <Link
          href={active.href}
          className="inline-block px-10 py-3 border border-black text-[12px] font-semibold uppercase tracking-[0.16em] hover:bg-black hover:text-white transition"
        >
          View all
        </Link>
      </div>
    </section>
  );
};
