'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { useLuminary } from '@/context/LuminaryContext';
import { Product } from '@/types';
import { CategoryPage, collectionHref } from '@/lib/collections';
import { ProductCard } from './ProductCard';

interface CategorySectionProps {
  page: CategoryPage;
  /** Products already shown higher up the page, so nothing appears twice. */
  exclude: Set<string>;
  onQuickView: (product: Product) => void;
  onOpenBulkModal: (product: Product) => void;
  limit?: number;
}

/** One division of the store (Fragrances, Ayurvedic Care, Mini Gadgets) with a link to its own page. */
export const CategorySection: React.FC<CategorySectionProps> = ({ page, exclude, onQuickView, onOpenBulkModal, limit = 8 }) => {
  const { products } = useLuminary();

  const inDivision = products.filter((p) => p.category === page.category);
  const shown = inDivision.filter((p) => !exclude.has(p.id)).slice(0, limit);
  if (shown.length === 0) return null;

  return (
    <section id={page.slug} className="scroll-mt-32 max-w-[1400px] mx-auto px-4 sm:px-6 py-10 border-t border-stone-200/70 first:border-t-0">
      <div className="flex items-end justify-between gap-4 mb-6">
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold text-brand-green-900">{page.title}</h2>
          <p className="text-sm text-slate-600 mt-1 max-w-xl">{page.description}</p>
        </div>
        <Link
          href={collectionHref(page.slug)}
          className="hidden sm:inline-flex items-center gap-2 shrink-0 text-[12px] font-semibold uppercase tracking-[0.16em] text-slate-900 hover:text-brand-green-700"
        >
          View all {inDivision.length} <ArrowRight className="w-4 h-4" />
        </Link>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-5">
        {shown.map((product) => (
          <ProductCard key={product.id} product={product} onQuickView={onQuickView} onOpenBulkModal={onOpenBulkModal} />
        ))}
      </div>

      <div className="sm:hidden text-center mt-6">
        <Link href={collectionHref(page.slug)} className="inline-block px-8 py-3 border border-black text-[12px] font-semibold uppercase tracking-[0.16em]">
          View all {inDivision.length}
        </Link>
      </div>
    </section>
  );
};
