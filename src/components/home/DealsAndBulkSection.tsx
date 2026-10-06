'use client';

import React from 'react';
import { ArrowRight } from 'lucide-react';
import { useLuminary } from '@/context/LuminaryContext';
import { Product } from '@/types';

interface DealsAndBulkSectionProps {
  onOpenBulkModal: (product?: Product) => void;
}

export const DealsAndBulkSection: React.FC<DealsAndBulkSectionProps> = ({ onOpenBulkModal }) => {
  const { products } = useLuminary();

  const deals = products
    .filter((p) => p.isBulkAvailable && p.bulkSlabs && p.bulkSlabs.length > 1)
    .map((p) => {
      const best = [...p.bulkSlabs].sort((a, b) => b.minQty - a.minQty)[0];
      return { product: p, best, saving: Math.round((1 - best.pricePerUnit / p.sellingPrice) * 100) };
    })
    .sort((a, b) => b.saving - a.saving)
    .slice(0, 6);

  if (deals.length === 0) return null;

  return (
    <section id="deals" className="scroll-mt-24 max-w-[1400px] mx-auto px-4 sm:px-6 py-12">
      <div className="flex items-end justify-between gap-4 mb-6">
        <div>
          <h2 className="text-3xl sm:text-4xl font-bold text-brand-green-800">
            Bulk <span className="italic font-semibold text-brand-orange-500">Deals</span>
          </h2>
          <p className="text-sm text-slate-600 mt-1">Better together — buy more, save more. GST invoice included.</p>
        </div>
        <button
          onClick={() => onOpenBulkModal()}
          className="inline-flex items-center gap-2 px-5 py-2 rounded-full border border-brand-green-700 text-brand-green-700 text-sm font-semibold hover:bg-brand-green-700 hover:text-white transition shrink-0"
        >
          Request a quote <ArrowRight className="w-4 h-4" />
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {deals.map(({ product, best, saving }) => (
          <div key={product.id} className="bg-white rounded-2xl border border-stone-200 p-4 flex items-center gap-4">
            <img src={product.images[0]} alt={product.name} className="w-24 h-24 rounded-xl object-cover bg-stone-100 shrink-0" />
            <div className="flex-1 min-w-0">
              <span className="text-[11px] font-bold tracking-wider text-brand-orange-500">SAVE {saving}%</span>
              <h3 className="text-[15px] font-semibold text-slate-900 leading-snug line-clamp-2">{product.name}</h3>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-lg font-bold text-slate-900">₹{best.pricePerUnit.toLocaleString('en-IN')}</span>
                <span className="text-sm text-slate-400 line-through">₹{product.sellingPrice.toLocaleString('en-IN')}</span>
                <span className="text-xs text-slate-500">each at {best.minQty}+ pcs</span>
              </div>
            </div>
            <button
              onClick={() => onOpenBulkModal(product)}
              className="hidden sm:inline-flex items-center gap-1.5 px-4 py-2 rounded-full border border-slate-800 text-slate-800 text-sm font-medium hover:bg-slate-800 hover:text-white transition shrink-0"
            >
              Get quote <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>
    </section>
  );
};
