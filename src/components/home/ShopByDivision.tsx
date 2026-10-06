'use client';

import React from 'react';
import { ArrowRight } from 'lucide-react';
import { useLuminary } from '@/context/LuminaryContext';
import { CategoryType, Product } from '@/types';
import { ProductCard } from './ProductCard';

interface ShopByDivisionProps {
  onQuickView: (product: Product) => void;
  onOpenBulkModal: (product: Product) => void;
}

const TABS: { id: CategoryType | 'all'; label: string }[] = [
  { id: 'all', label: 'All Products' },
  { id: 'fragrance', label: 'Fragrances' },
  { id: 'ayurvedic', label: 'Ayurvedic Care' },
  { id: 'gadgets', label: 'Mini Gadgets' },
];

export const ShopByDivision: React.FC<ShopByDivisionProps> = ({ onQuickView, onOpenBulkModal }) => {
  const { products, activeCategoryFilter, setActiveCategoryFilter } = useLuminary();

  const filtered = products.filter((p) => activeCategoryFilter === 'all' || p.category === activeCategoryFilter);

  return (
    <section id="shop" className="scroll-mt-24 max-w-[1400px] mx-auto px-4 sm:px-6 py-10">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h2 className="text-3xl sm:text-4xl font-bold text-brand-green-800">
            Shop By <span className="italic font-semibold text-brand-orange-500">Division</span>
          </h2>
          <p className="text-sm text-slate-600 mt-1">Browse products by what you are looking for</p>
        </div>
        <button
          onClick={() => setActiveCategoryFilter('all')}
          className="hidden sm:inline-flex items-center gap-2 px-5 py-2 rounded-full border border-brand-green-700 text-brand-green-700 text-sm font-semibold hover:bg-brand-green-700 hover:text-white transition"
        >
          View All <ArrowRight className="w-4 h-4" />
        </button>
      </div>

      <div className="flex gap-3 overflow-x-auto scrollbar-none py-5">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveCategoryFilter(tab.id)}
            className={`shrink-0 px-5 py-2 rounded-full border text-sm font-semibold transition ${
              activeCategoryFilter === tab.id
                ? 'bg-brand-green-700 border-brand-green-700 text-white'
                : 'bg-white border-brand-green-700 text-brand-green-700 hover:bg-brand-green-50'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {products.length === 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="h-96 rounded-2xl bg-white/70 animate-pulse" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <p className="text-center text-slate-500 py-16">No products in this division yet.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {filtered.map((prod) => (
            <ProductCard key={prod.id} product={prod} onQuickView={onQuickView} onOpenBulkModal={onOpenBulkModal} />
          ))}
        </div>
      )}
    </section>
  );
};
