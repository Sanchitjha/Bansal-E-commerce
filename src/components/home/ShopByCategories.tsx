'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { useLuminary } from '@/context/LuminaryContext';
import { collectionHref, slugify } from '@/lib/collections';
import { optimizeImage } from '@/lib/media';

/** Product types (Perfumes, Attars, Gift sets…), each linking to its own page. */
export const ShopByCategories: React.FC = () => {
  const { products } = useLuminary();

  const groups = new Map<string, { name: string; count: number; image: string }>();
  products.forEach((p) => {
    const key = p.subcategory || p.category;
    const existing = groups.get(key);
    if (existing) existing.count += 1;
    else groups.set(key, { name: key, count: 1, image: p.images[0] });
  });
  const items = Array.from(groups.values());

  if (items.length === 0) return null;

  return (
    <section id="categories" className="scroll-mt-32 bg-brand-green-800 mt-6 py-12">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between gap-4 mb-6">
          <h2 className="text-2xl sm:text-3xl font-bold uppercase tracking-wide text-white">Shop by type</h2>
          <Link
            href={collectionHref('all')}
            className="inline-flex items-center gap-2 px-5 py-2 border border-white/70 text-white text-[12px] font-semibold uppercase tracking-[0.16em] hover:bg-white hover:text-brand-green-800 transition"
          >
            All products <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="flex flex-wrap justify-center gap-4">
          {items.map((item) => (
            <Link
              key={item.name}
              href={collectionHref(slugify(item.name))}
              className="w-[calc(50%-8px)] sm:w-[calc(33.333%-11px)] lg:w-[calc(16.666%-14px)] bg-white p-5 flex flex-col items-center gap-3 text-center hover:-translate-y-1 hover:shadow-xl transition"
            >
              <img src={optimizeImage(item.image, 160)} alt={item.name} className="w-16 h-16 object-cover bg-stone-100" />
              <div>
                <div className="text-sm font-semibold text-slate-900 leading-tight">{item.name}</div>
                <div className="text-xs text-slate-500 mt-1">
                  {item.count} {item.count === 1 ? 'product' : 'products'}
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
};
