'use client';

import React, { useState } from 'react';
import { X, Search, SlidersHorizontal, Star, ShoppingBag, Eye } from 'lucide-react';
import { useLuminary } from '@/context/LuminaryContext';
import { Product, CategoryType } from '@/types';

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectProduct: (product: Product) => void;
}

export const SearchModal: React.FC<SearchModalProps> = ({
  isOpen,
  onClose,
  onSelectProduct,
}) => {
  if (!isOpen) return null;

  const { products } = useLuminary();
  const [query, setQuery] = useState('');
  const [selectedCat, setSelectedCat] = useState<CategoryType | 'all'>('all');
  const [maxPrice, setMaxPrice] = useState<number>(5000);
  const [inStockOnly, setInStockOnly] = useState(false);

  const filteredProducts = products.filter((p) => {
    const matchesQuery =
      query.trim() === '' ||
      p.name.toLowerCase().includes(query.toLowerCase()) ||
      p.sku.toLowerCase().includes(query.toLowerCase()) ||
      p.brand.toLowerCase().includes(query.toLowerCase()) ||
      p.shortDescription.toLowerCase().includes(query.toLowerCase()) ||
      (p.keywords && p.keywords.some((k) => k.toLowerCase().includes(query.toLowerCase())));

    const matchesCat = selectedCat === 'all' || p.category === selectedCat;
    const matchesPrice = p.sellingPrice <= maxPrice;
    const matchesStock = !inStockOnly || p.stock > 0;

    return matchesQuery && matchesCat && matchesPrice && matchesStock;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center p-4 pt-16 bg-slate-900/50 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-3xl bg-white border border-stone-200 rounded-3xl shadow-2xl overflow-hidden animate-fade-in text-slate-900 mb-8">
        {/* Search Header */}
        <div className="p-4 sm:p-6 bg-stone-50 border-b border-stone-200 flex items-center gap-3">
          <Search className="w-5 h-5 text-brand-green-700 shrink-0" />
          <input
            type="text"
            autoFocus
            placeholder="Search perfumes, attars, kumkumadi oils, gadgets or SKU..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full bg-transparent text-sm text-slate-900 placeholder-slate-500 outline-none"
          />
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-stone-100 text-slate-500 hover:text-brand-green-700 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Filter Controls Bar */}
        <div className="p-4 bg-stone-50 border-b border-stone-200 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <span className="text-slate-500 font-semibold flex items-center gap-1">
              <SlidersHorizontal className="w-3.5 h-3.5 text-brand-green-700" />
              Category:
            </span>
            {(['all', 'fragrance', 'ayurvedic', 'gadgets'] as const).map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCat(cat)}
                className={`px-2.5 py-1 rounded-full uppercase text-[10px] font-bold transition ${
                  selectedCat === cat
                    ? 'bg-brand-green-700 text-obsidian-950 shadow'
                    : 'bg-white text-slate-500 border border-stone-200 hover:text-slate-800'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-4">
            <label className="flex items-center gap-1.5 cursor-pointer text-slate-700">
              <input
                type="checkbox"
                checked={inStockOnly}
                onChange={(e) => setInStockOnly(e.target.checked)}
                className="accent-brand-green-700"
              />
              <span>In Stock Only</span>
            </label>
          </div>
        </div>

        {/* Product Results Grid */}
        <div className="p-6 max-h-[60vh] overflow-y-auto">
          {filteredProducts.length === 0 ? (
            <div className="text-center py-12 text-slate-500">
              <p className="font-semibold text-slate-800">No products match your search criteria.</p>
              <p className="text-xs mt-1">Try searching for 'Pure Extract', 'Gift set', or 'Attar'</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {filteredProducts.map((prod) => (
                <div
                  key={prod.id}
                  onClick={() => {
                    onClose();
                    onSelectProduct(prod);
                  }}
                  className="p-3 rounded-2xl bg-stone-50 border border-stone-200 hover:border-brand-green-600/40 cursor-pointer transition flex gap-3 group"
                >
                  <div className="w-16 h-16 rounded-xl overflow-hidden bg-white shrink-0 border border-stone-200">
                    <img src={prod.images[0]} alt="" className="w-full h-full object-cover group-hover:scale-105 transition" />
                  </div>
                  <div className="flex-1 min-w-0 flex flex-col justify-between">
                    <div>
                      <span className="text-[10px] font-bold uppercase text-brand-green-700">
                        {prod.category}
                      </span>
                      <h5 className=" font-bold text-xs text-slate-800 truncate group-hover:text-brand-green-700">
                        {prod.name}
                      </h5>
                      <span className="text-[10px] text-slate-500 font-mono">SKU: {prod.sku}</span>
                    </div>

                    <div className="flex items-center justify-between mt-1">
                      <span className="font-mono text-xs font-bold text-brand-green-700">
                        ₹{prod.sellingPrice.toLocaleString()}
                      </span>
                      <span className="text-[10px] text-brand-green-700 underline font-semibold flex items-center gap-1">
                        <Eye className="w-3 h-3" /> View Product
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
