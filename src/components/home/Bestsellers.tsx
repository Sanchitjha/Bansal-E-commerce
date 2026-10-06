'use client';

import React from 'react';
import { useLuminary } from '@/context/LuminaryContext';
import { Product } from '@/types';
import { ProductCard } from './ProductCard';

interface BestsellersProps {
  onQuickView: (product: Product) => void;
  onOpenBulkModal: (product: Product) => void;
}

export const Bestsellers: React.FC<BestsellersProps> = ({ onQuickView, onOpenBulkModal }) => {
  const { products } = useLuminary();
  const bestsellers = products.filter((p) => p.isBestSeller).sort((a, b) => b.reviewsCount - a.reviewsCount).slice(0, 8);

  if (bestsellers.length === 0) return null;

  return (
    <section id="bestsellers" className="scroll-mt-24 max-w-[1400px] mx-auto px-4 sm:px-6 py-10">
      <h2 className="text-3xl sm:text-4xl font-bold text-brand-green-800">Our Bestsellers</h2>
      <p className="text-sm text-slate-600 mt-1 mb-6">Most loved by our customers</p>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {bestsellers.map((prod) => (
          <ProductCard key={prod.id} product={prod} onQuickView={onQuickView} onOpenBulkModal={onOpenBulkModal} />
        ))}
      </div>
    </section>
  );
};
