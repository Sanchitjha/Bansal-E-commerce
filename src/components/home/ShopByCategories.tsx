'use client';

import React from 'react';
import { ArrowRight } from 'lucide-react';
import { useLuminary } from '@/context/LuminaryContext';
import { CategoryType } from '@/types';

export const ShopByCategories: React.FC = () => {
  const { products, setActiveCategoryFilter } = useLuminary();

  const groups = new Map<string, { name: string; count: number; image: string; category: CategoryType }>();
  products.forEach((p) => {
    const key = p.subcategory || p.category;
    const existing = groups.get(key);
    if (existing) {
      existing.count += 1;
    } else {
      groups.set(key, { name: key, count: 1, image: p.images[0], category: p.category });
    }
  });
  const items = Array.from(groups.values());

  if (items.length === 0) return null;

  const openCategory = (category: CategoryType | 'all') => {
    setActiveCategoryFilter(category);
    document.getElementById('shop')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <section id="categories" className="scroll-mt-24 bg-brand-green-800 mt-6 py-12">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between gap-4 mb-6">
          <h2 className="text-3xl sm:text-4xl font-bold text-white">Shop by Categories</h2>
          <button
            onClick={() => openCategory('all')}
            className="inline-flex items-center gap-2 px-5 py-2 rounded-full border border-white/70 text-white text-sm font-semibold hover:bg-white hover:text-brand-green-800 transition"
          >
            All categories <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          {items.map((item) => (
            <button
              key={item.name}
              onClick={() => openCategory(item.category)}
              className="bg-white rounded-2xl p-5 flex flex-col items-center gap-3 text-center hover:-translate-y-1 hover:shadow-xl transition"
            >
              <img src={item.image} alt={item.name} className="w-16 h-16 rounded-xl object-cover bg-stone-100" />
              <div>
                <div className="text-sm font-semibold text-slate-900 leading-tight">{item.name}</div>
                <div className="text-xs text-slate-500 mt-1">
                  {item.count} {item.count === 1 ? 'product' : 'products'}
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>
    </section>
  );
};
