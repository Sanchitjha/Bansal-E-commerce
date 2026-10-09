'use client';

import React, { useState } from 'react';
import { Heart, Star, Sparkles, PlayCircle } from 'lucide-react';
import { optimizeImage } from '@/lib/media';
import { Product } from '@/types';
import { useLuminary } from '@/context/LuminaryContext';

interface ProductCardProps {
  product: Product;
  onQuickView: (product: Product) => void;
  onOpenBulkModal: (product: Product) => void;
}

const CATEGORY_LABEL: Record<string, string> = {
  fragrance: 'Fragrance',
  ayurvedic: 'Ayurvedic',
  gadgets: 'Mini Gadget',
};

export const ProductCard: React.FC<ProductCardProps> = ({ product, onQuickView, onOpenBulkModal }) => {
  const { wishlist, toggleWishlist, addToCart } = useLuminary();
  const [added, setAdded] = useState(false);

  const isWishlisted = wishlist.includes(product.id);
  const outOfStock = product.stock <= 0;
  const bulkSlab = product.isBulkAvailable && product.bulkSlabs && product.bulkSlabs.length > 1 ? product.bulkSlabs[1] : null;

  const handleAdd = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const ok = await addToCart(product, 1);
    if (ok) {
      setAdded(true);
      setTimeout(() => setAdded(false), 1800);
    }
  };

  return (
    <div
      onClick={() => onQuickView(product)}
      className="group bg-white rounded-2xl border border-stone-200 hover:border-brand-green-600/40 hover:shadow-lg transition overflow-hidden flex flex-col cursor-pointer"
    >
      <div className="relative aspect-square bg-stone-100 overflow-hidden">
        <img
          src={optimizeImage(product.images[0], 600)}
          alt={product.name}
          loading="lazy"
          className={`w-full h-full object-cover transition duration-500 ${product.images[1] ? 'group-hover:opacity-0' : 'group-hover:scale-105'}`}
        />
        {product.images[1] && (
          <img
            src={optimizeImage(product.images[1], 600)}
            alt=""
            loading="lazy"
            aria-hidden="true"
            className="absolute inset-0 w-full h-full object-cover opacity-0 group-hover:opacity-100 transition duration-500"
          />
        )}
        {product.videos && product.videos.length > 0 && (
          <span className="absolute bottom-3 left-3 inline-flex items-center gap-1 px-2 py-1 rounded-md bg-black/60 text-white text-[10px] font-semibold">
            <PlayCircle className="w-3.5 h-3.5" /> Video
          </span>
        )}

        <div className="absolute top-3 left-3 flex flex-col gap-1.5">
          {product.isBestSeller && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-brand-orange-500 text-white text-[11px] font-semibold shadow-sm">
              <Sparkles className="w-3 h-3" />
              Bestseller
            </span>
          )}
          {!product.isBestSeller && product.isNewArrival && (
            <span className="px-2.5 py-1 rounded-md bg-brand-green-700 text-white text-[11px] font-semibold shadow-sm">New</span>
          )}
        </div>

        <button
          onClick={(e) => {
            e.stopPropagation();
            toggleWishlist(product.id);
          }}
          className={`absolute top-3 right-3 w-8 h-8 rounded-full flex items-center justify-center shadow-sm transition ${
            isWishlisted ? 'bg-rose-500 text-white' : 'bg-white/90 text-slate-600 hover:text-rose-500'
          }`}
          aria-label="Toggle wishlist"
        >
          <Heart className={`w-4 h-4 ${isWishlisted ? 'fill-current' : ''}`} />
        </button>

        {outOfStock && (
          <div className="absolute inset-0 bg-white/70 flex items-center justify-center">
            <span className="px-3 py-1 rounded-md bg-slate-800 text-white text-xs font-semibold">Out of stock</span>
          </div>
        )}
      </div>

      <div className="p-4 flex flex-col flex-1 gap-2">
        <span className="text-[11px] font-bold uppercase tracking-wider text-brand-green-600">
          {product.subcategory || CATEGORY_LABEL[product.category]}
        </span>
        <h3 className="text-[15px] font-semibold text-slate-900 leading-snug line-clamp-2">
          <a
            href={`/product/${product.urlSlug}`}
            onClick={(e) => {
              // Plain click opens the quick view; modified clicks keep normal link behaviour.
              if (e.ctrlKey || e.metaKey || e.shiftKey) e.stopPropagation();
              else e.preventDefault();
            }}
          >
            {product.name}
          </a>
        </h3>
        <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">{product.shortDescription}</p>

        {product.reviewsCount > 0 ? (
          <div className="flex items-center gap-1 text-xs">
            <span className="flex text-amber-500">
              {[1, 2, 3, 4, 5].map((s) => (
                <Star key={s} className={`w-3.5 h-3.5 ${s <= Math.round(product.rating) ? 'fill-current' : 'text-stone-300'}`} />
              ))}
            </span>
            <span className="text-slate-500">({product.reviewsCount.toLocaleString('en-IN')})</span>
          </div>
        ) : (
          <div className="text-xs text-slate-400">No reviews yet</div>
        )}

        <div className="mt-auto pt-2">
          <div className="flex items-baseline gap-2">
            <span className="text-lg font-bold text-slate-900">₹{product.sellingPrice.toLocaleString('en-IN')}</span>
            {product.mrp > product.sellingPrice && (
              <>
                <span className="text-sm text-slate-400 line-through">₹{product.mrp.toLocaleString('en-IN')}</span>
                <span className="text-xs font-semibold text-brand-orange-500">{product.discountPercent}% off</span>
              </>
            )}
          </div>
          {bulkSlab ? (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onOpenBulkModal(product);
              }}
              className="mt-1 text-[11px] font-medium text-brand-green-700 hover:underline text-left"
            >
              Buy {bulkSlab.minQty}+ at ₹{bulkSlab.pricePerUnit.toLocaleString('en-IN')} each
            </button>
          ) : (
            <span className="block mt-1 text-[11px] text-slate-400">Inclusive of {product.gstRate}% GST</span>
          )}
        </div>

        <button
          onClick={handleAdd}
          disabled={outOfStock}
          className={`mt-2 w-full py-3 text-[12px] font-semibold uppercase tracking-[0.16em] transition ${
            outOfStock
              ? 'bg-stone-200 text-stone-500 cursor-not-allowed'
              : added
              ? 'bg-brand-green-700 text-white'
              : 'bg-black hover:bg-brand-green-800 text-white'
          }`}
        >
          {outOfStock ? 'Out of stock' : added ? 'Added ✓' : 'Add to cart'}
        </button>
      </div>
    </div>
  );
};
