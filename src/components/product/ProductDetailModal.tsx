'use client';

import React, { useState } from 'react';
import {
  X,
  Star,
  ShoppingBag,
  Heart,
  Truck,
  ShieldCheck,
  RefreshCw,
  Layers,
  AlertCircle,
  CheckCircle2,
  FileText,
  PlayCircle,
} from 'lucide-react';
import { Product } from '@/types';
import { optimizeImage, videoPoster } from '@/lib/media';
import { useLuminary } from '@/context/LuminaryContext';
import { WhatsAppIcon } from '@/components/ui/WhatsAppIcon';

interface ProductDetailModalProps {
  product: Product | null;
  onClose: () => void;
  onOpenBulkModal: (product: Product) => void;
  onDirectBuy: (product: Product, quantity: number) => void;
}

export const ProductDetailModal: React.FC<ProductDetailModalProps> = ({
  product,
  onClose,
  onOpenBulkModal,
  onDirectBuy,
}) => {
  if (!product) return null;

  const { wishlist, toggleWishlist, addToCart, getUnitPriceForProduct, settings } = useLuminary();
  const [selectedImage, setSelectedImage] = useState(product.images[0] || '');
  const [selectedVideo, setSelectedVideo] = useState<string | null>(null);
  const videos = product.videos ?? [];
  const [quantity, setQuantity] = useState(1);
  const [activeTab, setActiveTab] = useState<'desc' | 'specs' | 'shipping' | 'bulk'>('desc');
  const [addedSuccess, setAddedSuccess] = useState(false);

  const isWishlisted = wishlist.includes(product.id);
  const currentUnitPrice = getUnitPriceForProduct(product, quantity);
  const totalPrice = currentUnitPrice * quantity;

  const handleAddToCart = async (): Promise<boolean> => {
    const ok = await addToCart(product, quantity);
    if (ok) {
      setAddedSuccess(true);
      setTimeout(() => setAddedSuccess(false), 2000);
    }
    return ok;
  };

  const handleWhatsAppChat = () => {
    const message = encodeURIComponent(
      `Hi Luminary Concierge, I am viewing ${product.name} (SKU: ${product.sku}). Can you assist me with my order?`
    );
    window.open(`https://wa.me/${settings.whatsAppNumber}?text=${message}`, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-4xl bg-white border border-stone-200 rounded-3xl shadow-2xl overflow-hidden my-8 animate-fade-in text-slate-900">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-20 p-2 rounded-full bg-white border border-stone-300 text-slate-700 hover:text-brand-green-700 shadow-sm transition"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 p-6 sm:p-8">
          {/* Left Column: Image Gallery */}
          <div className="md:col-span-6 space-y-4">
            <div className="relative aspect-square rounded-2xl overflow-hidden bg-stone-50 border border-stone-200">
              {selectedVideo ? (
                <video key={selectedVideo} src={selectedVideo} poster={videoPoster(selectedVideo, 800) ?? optimizeImage(product.images[0], 800)} controls playsInline preload="metadata" className="w-full h-full object-contain bg-black" />
              ) : (
                <img
                  src={optimizeImage(selectedImage || product.images[0], 800)}
                  alt={product.name}
                  className="w-full h-full object-cover transition-all duration-500"
                />
              )}
              <div className="absolute top-3 left-3 flex flex-col gap-1 z-10">
                {product.discountPercent > 0 && (
                  <span className="px-2.5 py-1 rounded-md bg-rose-600 text-white font-bold text-xs uppercase tracking-wider shadow">
                    {product.discountPercent}% OFF
                  </span>
                )}
                {product.isBestSeller && (
                  <span className="px-2.5 py-1 rounded-md bg-brand-green-700 text-white font-bold text-xs uppercase tracking-wider shadow">
                    BEST SELLER
                  </span>
                )}
              </div>
            </div>

            {/* Thumbnails */}
            {(product.images.length > 1 || videos.length > 0) && (
              <div className="flex gap-2 overflow-x-auto pb-1">
                {product.images.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      setSelectedImage(img);
                      setSelectedVideo(null);
                    }}
                    className={`w-16 h-16 rounded-lg overflow-hidden border-2 transition shrink-0 ${
                      !selectedVideo && selectedImage === img ? 'border-brand-green-600 scale-105' : 'border-stone-200 opacity-60 hover:opacity-100'
                    }`}
                  >
                    <img src={optimizeImage(img, 160)} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
                {videos.map((v) => (
                  <button
                    key={v}
                    onClick={() => setSelectedVideo(v)}
                    aria-label="Play product video"
                    className={`relative w-16 h-16 rounded-lg overflow-hidden border-2 transition shrink-0 bg-slate-800 ${
                      selectedVideo === v ? 'border-brand-green-600 scale-105' : 'border-stone-200 opacity-80 hover:opacity-100'
                    }`}
                  >
                    <img src={videoPoster(v, 160) ?? optimizeImage(product.images[0], 160)} alt="" className="w-full h-full object-cover" />
                    <PlayCircle className="absolute inset-0 m-auto w-6 h-6 text-white drop-shadow" />
                  </button>
                ))}
              </div>
            )}

            {/* Quick Specs Cards */}
            <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-500">
              <div className="p-2.5 rounded-xl bg-stone-50 border border-stone-200">
                <span className="text-slate-500 block">SKU Code</span>
                <span className="font-mono font-bold text-slate-800">{product.sku}</span>
              </div>
              <div className="p-2.5 rounded-xl bg-stone-50 border border-stone-200">
                <span className="text-slate-500 block">HSN Code</span>
                <span className="font-mono font-bold text-slate-800">{product.hsnCode}</span>
              </div>
            </div>
          </div>

          {/* Right Column: Product Meta & Purchase Panel */}
          <div className="md:col-span-6 flex flex-col justify-between space-y-4">
            <div>
              <div className="flex items-center justify-between text-xs text-slate-500">
                <span className="uppercase font-semibold text-brand-green-700 tracking-widest">
                  {product.brand} • {product.subcategory || product.category}
                </span>
                {product.reviewsCount > 0 ? (
                  <div className="flex items-center gap-1 text-amber-600 font-bold">
                    <Star className="w-4 h-4 fill-current" />
                    <span>{product.rating}</span>
                    <span className="text-slate-500 font-normal">({product.reviewsCount} reviews)</span>
                  </div>
                ) : (
                  <span className="text-slate-500">No reviews yet</span>
                )}
              </div>

              <h2 className=" text-2xl font-bold text-slate-900 mt-2">
                {product.name}
              </h2>

              <p className="text-xs text-slate-700 mt-2 leading-relaxed">
                {product.shortDescription}
              </p>
              <a href={`/product/${product.urlSlug}`} className="inline-block mt-1.5 text-xs font-semibold text-brand-green-700 hover:underline">
                Open full product page →
              </a>

              {/* Dynamic Pricing Display */}
              <div className="mt-4 p-3 rounded-xl bg-stone-50 border border-stone-200 flex items-center justify-between">
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-500">Unit Price</span>
                  <div className="flex items-baseline gap-2">
                    <span className="font-mono text-2xl font-bold text-brand-green-700">
                      ₹{currentUnitPrice.toLocaleString()}
                    </span>
                    {product.mrp > currentUnitPrice && (
                      <span className="font-mono text-sm text-slate-500 line-through">
                        ₹{product.mrp.toLocaleString()}
                      </span>
                    )}
                  </div>
                  {quantity > 1 && currentUnitPrice < product.sellingPrice && (
                    <span className="text-[10px] text-emerald-600 font-bold">
                      ✓ Wholesale Bulk Tier Price Applied!
                    </span>
                  )}
                </div>

                <div className="text-right">
                  <span className="text-[10px] text-slate-500 block">Stock Status</span>
                  {product.stock > 0 ? (
                    <span className="text-xs font-bold text-emerald-600 flex items-center gap-1 justify-end">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      In Stock ({product.stock} units)
                    </span>
                  ) : (
                    <span className="text-xs font-bold text-rose-600 flex items-center gap-1 justify-end">
                      <AlertCircle className="w-3.5 h-3.5" />
                      Out of Stock
                    </span>
                  )}
                </div>
              </div>

              {/* Bulk Quantity Tier Table Preview (PDF Requirement Page 5) */}
              {product.isBulkAvailable && product.bulkSlabs && product.bulkSlabs.length > 0 && (
                <div className="mt-4 p-3 rounded-xl bg-brand-green-50 border border-stone-200">
                  <div className="flex items-center justify-between text-xs font-bold text-brand-green-700 mb-2">
                    <span className="flex items-center gap-1">
                      <Layers className="w-3.5 h-3.5" />
                      RETAIL & BULK QUANTITY SLABS
                    </span>
                    <button
                      onClick={() => onOpenBulkModal(product)}
                      className="text-[10px] underline hover:text-brand-green-700"
                    >
                      Request B2B Quote
                    </button>
                  </div>

                  <div className="grid grid-cols-4 gap-1 text-[11px]">
                    {product.bulkSlabs.map((slab, idx) => {
                      const savePct = Math.round(((product.sellingPrice - slab.pricePerUnit) / product.sellingPrice) * 100);
                      return (
                        <div
                          key={idx}
                          onClick={() => setQuantity(slab.minQty)}
                          className={`p-1.5 rounded text-center cursor-pointer transition ${
                            quantity >= slab.minQty && (idx === product.bulkSlabs.length - 1 || quantity < product.bulkSlabs[idx + 1].minQty)
                              ? 'bg-brand-green-700 text-white font-bold shadow'
                              : 'bg-white border border-stone-200 text-slate-700 hover:border-brand-green-600/40'
                          }`}
                        >
                          <p className="text-[10px] uppercase opacity-80">{slab.minQty}+ pc{slab.minQty > 1 ? 's' : ''}</p>
                          <p className="font-mono font-bold text-xs">₹{slab.pricePerUnit.toLocaleString('en-IN')} each</p>
                          <p className="text-[10px] opacity-80">{savePct > 0 ? `save ${savePct}%` : 'regular'}</p>
                        </div>
                      );
                    })}
                  </div>
                  <p className="mt-2 text-[11px] text-slate-600">
                    {quantity} × ₹{currentUnitPrice.toLocaleString('en-IN')} = <strong>₹{(currentUnitPrice * quantity).toLocaleString('en-IN')}</strong>
                    {currentUnitPrice < product.sellingPrice && (
                      <span className="text-brand-green-700"> · you save ₹{((product.sellingPrice - currentUnitPrice) * quantity).toLocaleString('en-IN')}</span>
                    )}
                    <span className="text-slate-500"> · GST included</span>
                  </p>
                </div>
              )}

              {/* Quantity Selector */}
              <div className="mt-4 flex items-center gap-4">
                <span className="text-xs font-bold text-slate-700">Select Quantity:</span>
                <div className="flex items-center rounded-lg bg-stone-50 border border-stone-300">
                  <button
                    onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                    className="px-3 py-1.5 text-slate-700 hover:text-brand-green-700 font-bold"
                  >
                    -
                  </button>
                  <span className="px-4 py-1.5 font-mono text-xs font-bold text-brand-green-700">
                    {quantity}
                  </span>
                  <button
                    onClick={() => setQuantity((q) => Math.min(product.stock, q + 1))}
                    className="px-3 py-1.5 text-slate-700 hover:text-brand-green-700 font-bold"
                  >
                    +
                  </button>
                </div>
                <div className="text-xs text-slate-500 font-mono">
                  Subtotal: <span className="text-brand-green-700 font-bold">₹{totalPrice.toLocaleString()}</span>
                </div>
              </div>
            </div>

            {/* Action CTAs */}
            <div className="space-y-2 pt-4 border-t border-stone-200">
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={handleAddToCart}
                  disabled={product.stock <= 0}
                  className={`py-3 rounded-xl font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition ${
                    addedSuccess
                      ? 'bg-emerald-500 text-white'
                      : 'bg-stone-50 border border-brand-green-600/40 hover:border-brand-green-600 text-brand-green-700'
                  }`}
                >
                  <ShoppingBag className="w-4 h-4" />
                  <span>{addedSuccess ? 'Added to Cart!' : 'Add to Cart'}</span>
                </button>

                <button
                  onClick={async () => {
                    if (await handleAddToCart()) onDirectBuy(product, quantity);
                  }}
                  disabled={product.stock <= 0}
                  className="py-3 rounded-xl bg-brand-orange-500 hover:bg-brand-orange-600 text-white  font-bold text-xs uppercase tracking-wider shadow-md hover:scale-105 transition "
                >
                  Buy Now Instant
                </button>
              </div>

              {/* WhatsApp Buttons */}
              <div className="grid grid-cols-2 gap-2 text-xs">
                <button
                  onClick={handleWhatsAppChat}
                  className="py-2 px-3 rounded-lg bg-emerald-600/20 border border-emerald-500/30 text-emerald-600 hover:bg-emerald-600/30 transition flex items-center justify-center gap-1.5 font-semibold text-[11px]"
                >
                  <WhatsAppIcon className="w-3.5 h-3.5" />
                  <span>Chat on WhatsApp</span>
                </button>

                <button
                  onClick={() => onOpenBulkModal(product)}
                  className="py-2 px-3 rounded-lg bg-amber-500/20 border border-amber-500/30 text-amber-600 hover:bg-amber-500/30 transition flex items-center justify-center gap-1.5 font-semibold text-[11px]"
                >
                  <Layers className="w-3.5 h-3.5" />
                  <span>Get Bulk Pricing</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Detailed Tabs: Description, Ingredients, Shipping */}
        <div className="border-t border-stone-200 bg-stone-50 p-6 sm:p-8">
          <div className="flex border-b border-stone-200 space-x-6 text-xs font-bold uppercase tracking-wider">
            <button
              onClick={() => setActiveTab('desc')}
              className={`pb-3 border-b-2 transition ${
                activeTab === 'desc' ? 'border-brand-green-600 text-brand-green-700' : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              Description
            </button>
            <button
              onClick={() => setActiveTab('specs')}
              className={`pb-3 border-b-2 transition ${
                activeTab === 'specs' ? 'border-brand-green-600 text-brand-green-700' : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              Specifications & Tax
            </button>
            <button
              onClick={() => setActiveTab('shipping')}
              className={`pb-3 border-b-2 transition ${
                activeTab === 'shipping' ? 'border-brand-green-600 text-brand-green-700' : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              Shipping & Returns
            </button>
          </div>

          <div className="pt-4 text-xs text-slate-700 leading-relaxed">
            {activeTab === 'desc' && <p>{product.longDescription}</p>}

            {activeTab === 'specs' && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <span className="text-slate-500 block">GST Tax Rate</span>
                  <span className="font-bold text-slate-800">{product.gstRate}% Inclusive</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Weight</span>
                  <span className="font-bold text-slate-800">{product.weightKg} kg</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Dimensions</span>
                  <span className="font-bold text-slate-800">{product.dimensionsCm || 'Standard'}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Category</span>
                  <span className="font-bold text-slate-800 uppercase">{product.category}</span>
                </div>
              </div>
            )}

            {activeTab === 'shipping' && (
              <div className="space-y-2">
                <p>✓ <strong>Free Express Shipping:</strong> Available on orders over ₹999 across India.</p>
                <p>✓ <strong>Dispatch Time:</strong> Orders placed before 2 PM are dispatched on the same business day.</p>
                <p>✓ <strong>Return Policy:</strong> 7-day hassle-free damage replacement guarantee.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
