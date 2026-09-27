'use client';

import React from 'react';
import { Sparkles, Leaf, Cpu, ArrowRight } from 'lucide-react';
import { useLuminary } from '@/context/LuminaryContext';
import { CategoryType } from '@/types';

export const CategorySection: React.FC = () => {
  const { activeCategoryFilter, setActiveCategoryFilter } = useLuminary();

  const categories = [
    {
      id: 'fragrance' as CategoryType,
      title: 'FRAGRANCES',
      tagline: 'Perfumes • Attars • Gift Sets',
      description: 'Artisanal French & Arabian perfume oils, concentrated attars, and luxury coffrets.',
      image: 'https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?auto=format&fit=crop&w=600&q=80',
      icon: Sparkles,
      count: '9 Products',
    },
    {
      id: 'ayurvedic' as CategoryType,
      title: 'AYURVEDIC / HERBAL',
      tagline: 'Kashmiri Saffron • Gold Elixirs • Herbal Oils',
      description: '100% natural, 24k Gold leaf infused Kumkumadi serums and botanical hair revitalizers.',
      image: 'https://images.unsplash.com/photo-1608248597263-00079e960339?auto=format&fit=crop&w=600&q=80',
      icon: Leaf,
      count: '6 Products',
    },
    {
      id: 'gadgets' as CategoryType,
      title: 'MINI GADGETS & LIFESTYLE',
      tagline: 'Smart Diffusers • Atomizers • Accessories',
      description: 'Ultrasonic cold-mist aroma nebulizers, rechargeable perfume powerbanks & utility electronics.',
      image: 'https://images.unsplash.com/photo-1546554137-f86b9593a222?auto=format&fit=crop&w=600&q=80',
      icon: Cpu,
      count: '5 Products',
    },
  ];

  const handleSelect = (catId: CategoryType) => {
    setActiveCategoryFilter(catId);
    const elem = document.getElementById('catalog-section');
    if (elem) {
      elem.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <section className="py-12 bg-slate-100 dark:bg-obsidian-950 border-b border-slate-200 dark:border-slate-800 transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-8">
          <div>
            <span className="text-xs font-bold uppercase tracking-widest text-amber-600 dark:text-gold-400">
              EXPLORE OUR THREE DIVISIONS
            </span>
            <h2 className="font-serif text-2xl sm:text-3xl font-bold text-slate-900 dark:text-slate-100 mt-1">
              Shop By Category
            </h2>
          </div>
          <button
            onClick={() => setActiveCategoryFilter('all')}
            className={`text-xs font-bold uppercase tracking-wider transition ${
              activeCategoryFilter === 'all'
                ? 'text-amber-600 dark:text-gold-400 underline'
                : 'text-slate-600 dark:text-slate-400 hover:text-amber-600'
            }`}
          >
            Show All Categories
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {categories.map((cat) => {
            const Icon = cat.icon;
            const isSelected = activeCategoryFilter === cat.id;

            return (
              <div
                key={cat.id}
                onClick={() => handleSelect(cat.id)}
                className={`relative group rounded-2xl overflow-hidden cursor-pointer border transition-all duration-300 bg-white dark:bg-obsidian-900 shadow-md hover:shadow-xl ${
                  isSelected ? 'border-amber-500 ring-2 ring-amber-500/40' : 'border-slate-200 dark:border-slate-800 hover:border-amber-500'
                }`}
              >
                {/* Image Background */}
                <div className="h-56 relative overflow-hidden">
                  <img
                    src={cat.image}
                    alt={cat.title}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/60 to-transparent" />
                  <div className="absolute top-4 right-4 px-3 py-1 rounded-full bg-slate-950/80 border border-amber-400/40 text-[10px] font-extrabold text-amber-300 uppercase tracking-wider">
                    {cat.count}
                  </div>
                </div>

                {/* Content Overlay */}
                <div className="p-6 relative -mt-12 bg-white dark:bg-obsidian-900 rounded-t-2xl">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="p-2 rounded-lg bg-amber-500/15 text-amber-600 dark:text-gold-400 border border-amber-500/30">
                      <Icon className="w-5 h-5" />
                    </div>
                    <span className="text-[11px] font-extrabold tracking-wider uppercase text-amber-600 dark:text-gold-400">
                      {cat.tagline}
                    </span>
                  </div>

                  <h3 className="font-serif text-xl font-bold text-slate-900 dark:text-slate-100 group-hover:text-amber-600 dark:group-hover:text-gold-300 transition">
                    {cat.title}
                  </h3>

                  <p className="text-xs text-slate-600 dark:text-slate-300 mt-2 line-clamp-2 leading-relaxed font-medium">
                    {cat.description}
                  </p>

                  <div className="mt-4 pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs font-extrabold text-amber-600 dark:text-gold-400">
                    <span>EXPLORE COLLECTION</span>
                    <ArrowRight className="w-4 h-4 transform group-hover:translate-x-1 transition" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
