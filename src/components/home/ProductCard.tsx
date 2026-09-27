'use client';

import React, { useState } from 'react';
import { Heart, Star, ShoppingBag, Eye, MessageCircle, Sparkles, AlertCircle } from 'lucide-react';
import { Product } from '@/types';
import { useLuminary } from '@/context/LuminaryContext';

interface ProductCardProps {
  product: Product;
  onQuickView: (product: Product) => void;
  onOpenBulkModal: (product: Product) => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({
  product,
  onQuickView,
  onOpenBulkModal,
}) => {
  const { wishlist, toggleWishlist, addToCart, settings } = useLuminary();
  const [addedAnimation, setAddedAnimation] = useState(false);

  const isWishlisted = wishlist.includes(product.id);

  const handleAddToCart = (e: React.MouseEvent) => {
    e.stopPropagation();
    addToCart(product, 1);
    setAddedAnimation(true);
    setTimeout(() => setAddedAnimation(false), 2000);
  };

  const handleWhatsAppEnquiry = (e: React.MouseEvent) => {
    e.stopPropagation();
    const message = encodeURIComponent(
      `Hi Luminary Concierge, I am interested in ${product.name} (SKU: ${product.sku}). Please share bulk pricing details.`
    );
    window.open(`https://wa.me/${settings.whatsAppNumber}?text=${message}`, '_blank');
  };

  const bestBulkSlab = product.bulkSlabs && product.bulkSlabs.length > 1 ? product.bulkSlabs[1] : null;

  return (
    <div
      onClick={() => onQuickView(product)}
      className="group relative rounded-2xl bg-white dark:bg-obsidian-900 border border-slate-200 dark:border-slate-800 hover:border-amber-500 transition-all duration-300 shadow-md hover:shadow-xl hover:-translate-y-1 flex flex-col justify-between overflow-hidden cursor-pointer"
    >
      {/* Image Thumbnail & Floating Badges */}
      <div className="relative aspect-square overflow-hidden bg-slate-100 dark:bg-obsidian-950">
        <img
          src={product.images[0]}
          alt={product.name}
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
        />

        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/60 via-transparent to-transparent opacity-40 group-hover:opacity-20 transition" />

        {/* Badges Stack */}
        <div className="absolute top-3 left-3 flex flex-col gap-1.5 z-10">
          {product.isHomepagePriority && (
            <span className="px-2 py-0.5 rounded bg-amber-500 text-slate-950 text-[10px] font-extrabold uppercase tracking-wider shadow">
              PRIORITY #{product.priorityOrder}
            </span>
          )}
          {product.discountPercent > 0 && (
            <span className="px-2 py-0.5 rounded bg-rose-600 text-white text-[10px] font-extrabold uppercase tracking-wider shadow">
              {product.discountPercent}% OFF
            </span>
          )}
          {product.stock <= product.lowStockThreshold && product.stock > 0 && (
            <span className="px-2 py-0.5 rounded bg-amber-600 text-white text-[10px] font-extrabold flex items-center gap-1 shadow">
              <AlertCircle className="w-3 h-3" />
              Only {product.stock} Left
            </span>
          )}
        </div>

        {/* Wishlist Button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            toggleWishlist(product.id);
          }}
          className={`absolute top-3 right-3 p-2 rounded-full backdrop-blur-md border transition z-10 ${
            isWishlisted
              ? 'bg-pink-500 text-white border-pink-400 shadow-md'
              : 'bg-white/80 dark:bg-obsidian-950/70 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-700 hover:text-pink-500'
          }`}
          title="Add to Wishlist"
        >
          <Heart className={`w-4 h-4 ${isWishlisted ? 'fill-current' : ''}`} />
        </button>

        {/* Quick View Hover Button */}
        <div className="absolute inset-x-4 bottom-4 opacity-0 group-hover:opacity-100 transition-all duration-300 z-10 flex gap-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onQuickView(product);
            }}
            className="flex-1 py-2 rounded-lg bg-slate-950/90 text-amber-300 text-xs font-bold flex items-center justify-center gap-1.5 hover:bg-amber-500 hover:text-slate-950 transition shadow-lg"
          >
            <Eye className="w-3.5 h-3.5" />
            <span>Quick View</span>
          </button>
        </div>
      </div>

      {/* Card Body */}
      <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
        <div>
          <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
            <span className="uppercase tracking-wider font-extrabold text-amber-600 dark:text-gold-400">
              {product.subcategory || product.category}
            </span>
            <div className="flex items-center gap-1 text-amber-500 font-extrabold">
              <Star className="w-3.5 h-3.5 fill-current" />
              <span>{product.rating}</span>
              <span className="text-slate-400 font-normal">({product.reviewsCount})</span>
            </div>
          </div>

          <h4 className="font-serif font-bold text-sm text-slate-900 dark:text-slate-100 mt-1 line-clamp-2 group-hover:text-amber-600 dark:group-hover:text-gold-300 transition">
            {product.name}
          </h4>

          <p className="text-[11px] text-slate-600 dark:text-slate-400 line-clamp-1 mt-1 font-medium">
            {product.shortDescription}
          </p>
        </div>

        {/* Bulk Pricing Tier Alert */}
        {bestBulkSlab && (
          <div
            onClick={(e) => {
              e.stopPropagation();
              onOpenBulkModal(product);
            }}
            className="px-2.5 py-1 rounded bg-amber-500/10 dark:bg-gold-500/10 border border-amber-500/20 text-[10px] text-amber-700 dark:text-gold-300 flex items-center justify-between hover:bg-amber-500/20 transition font-medium"
          >
            <span className="font-extrabold">Bulk Slab:</span>
            <span className="font-mono font-bold">
              {bestBulkSlab.minQty}+ pcs @ ₹{bestBulkSlab.pricePerUnit}/ea
            </span>
          </div>
        )}

        {/* Price & Actions */}
        <div className="pt-2 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between gap-2">
          <div>
            <div className="flex items-baseline gap-1.5">
              <span className="font-mono text-base font-extrabold text-slate-900 dark:text-gold-300">
                ₹{product.sellingPrice.toLocaleString()}
              </span>
              {product.mrp > product.sellingPrice && (
                <span className="font-mono text-xs text-slate-400 line-through">
                  ₹{product.mrp.toLocaleString()}
                </span>
              )}
            </div>
            <span className="text-[9px] text-slate-400 font-medium">Incl. {product.gstRate}% GST</span>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={handleWhatsAppEnquiry}
              className="p-2 rounded-lg bg-emerald-600/15 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-600 hover:text-white transition"
              title="Chat on WhatsApp"
            >
              <MessageCircle className="w-4 h-4" />
            </button>

            <button
              onClick={handleAddToCart}
              disabled={product.stock <= 0}
              className={`px-3.5 py-2 rounded-lg font-extrabold text-xs flex items-center gap-1.5 transition ${
                addedAnimation
                  ? 'bg-emerald-500 text-white'
                  : product.stock <= 0
                  ? 'bg-slate-300 dark:bg-slate-800 text-slate-500 cursor-not-allowed'
                  : 'gold-gradient-bg text-slate-950 hover:scale-105 shadow-md'
              }`}
            >
              <ShoppingBag className="w-3.5 h-3.5" />
              <span>{addedAnimation ? 'Added!' : product.stock <= 0 ? 'Out of Stock' : 'Add'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
