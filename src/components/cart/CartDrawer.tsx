'use client';

import React, { useState } from 'react';
import { X, Trash2, Tag, ShoppingBag, ArrowRight, Truck, Check, Layers, MessageCircle } from 'lucide-react';
import { useLuminary } from '@/context/LuminaryContext';
import { optimizeImage } from '@/lib/media';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onProceedToCheckout: () => void;
  onOpenBulkModal: () => void;
}

export const CartDrawer: React.FC<CartDrawerProps> = ({
  isOpen,
  onClose,
  onProceedToCheckout,
  onOpenBulkModal,
}) => {
  if (!isOpen) return null;

  const {
    cart,
    removeFromCart,
    updateCartQuantity,
    applyCoupon,
    removeCoupon,
    getCartTotals,
    settings,
  } = useLuminary();

  const [couponInput, setCouponInput] = useState('');
  const [couponMsg, setCouponMsg] = useState<{ success: boolean; message: string } | null>(null);

  const totals = getCartTotals();
  const freeShippingNeeded = Math.max(0, settings.freeShippingThreshold - totals.subtotal);
  const freeShippingProgress = Math.min(100, (totals.subtotal / settings.freeShippingThreshold) * 100);

  const handleApply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (couponInput.trim()) {
      const res = await applyCoupon(couponInput);
      setCouponMsg(res);
      if (res.success) setCouponInput('');
    }
  };

  const handleWhatsAppCheckout = () => {
    const itemsText = cart
      .map((i) => `• ${i.product.name} (x${i.quantity}) @ ₹${i.unitPrice}/ea`)
      .join('\n');
    const text = encodeURIComponent(
      `Hello Luminary, I want to place an order via WhatsApp:\n\n${itemsText}\n\nTotal Amount: ₹${totals.grandTotal}`
    );
    window.open(`https://wa.me/${settings.whatsAppNumber}?text=${text}`, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/50 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-md bg-white border-l border-stone-200 text-slate-900 flex flex-col justify-between shadow-2xl h-full">
        {/* Header */}
        <div className="p-4 sm:p-6 border-b border-stone-200 flex items-center justify-between bg-stone-50">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-brand-green-50 text-brand-green-700 border border-stone-200">
              <ShoppingBag className="w-5 h-5" />
            </div>
            <div>
              <h3 className=" text-lg font-bold text-slate-900">Your Shopping Cart</h3>
              <p className="text-[11px] text-slate-500 font-mono">{totals.itemCount} items</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-stone-100 text-slate-500 hover:text-brand-green-700 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Free Shipping Progress */}
        <div className="px-6 py-3 bg-brand-green-50 border-b border-stone-200 text-xs">
          <div className="flex items-center justify-between text-[11px] mb-1.5 font-medium">
            <span className="flex items-center gap-1.5 text-slate-700">
              <Truck className="w-4 h-4 text-brand-green-700" />
              {freeShippingNeeded === 0 ? (
                <span className="text-emerald-600 font-bold">You unlocked FREE Express Shipping!</span>
              ) : (
                <span>Add <strong className="text-brand-green-700">₹{freeShippingNeeded.toLocaleString()}</strong> for Free Shipping</span>
              )}
            </span>
            <span className="font-mono text-brand-green-700 font-bold">{Math.round(freeShippingProgress)}%</span>
          </div>
          <div className="w-full h-1.5 bg-stone-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-brand-green-600 to-emerald-400 transition-all duration-500 rounded-full"
              style={{ width: `${freeShippingProgress}%` }}
            />
          </div>
        </div>

        {/* Cart Item List */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
          {cart.length === 0 ? (
            <div className="text-center py-16 space-y-3">
              <div className="w-16 h-16 rounded-full bg-stone-50 border border-stone-200 flex items-center justify-center mx-auto text-slate-600">
                <ShoppingBag className="w-8 h-8" />
              </div>
              <p className="text-sm font-semibold text-slate-500">Your cart is currently empty.</p>
              <button
                onClick={onClose}
                className="px-4 py-2 rounded-lg bg-brand-green-50 text-brand-green-700 border border-brand-green-600/40 font-bold text-xs"
              >
                Browse Collections
              </button>
            </div>
          ) : (
            cart.map((item) => (
              <div
                key={item.product.id}
                className="p-3.5 rounded-xl bg-stone-50 border border-stone-200 flex gap-3 relative group hover:border-stone-200 transition"
              >
                <div className="w-16 h-16 rounded-lg overflow-hidden bg-white border border-stone-200 shrink-0">
                  <img src={optimizeImage(item.product.images[0], 160)} alt="" className="w-full h-full object-cover" />
                </div>

                <div className="flex-1 min-w-0 flex flex-col justify-between">
                  <div className="flex items-start justify-between gap-2">
                    <h5 className="font-semibold text-xs text-slate-800 line-clamp-1">
                      {item.product.name}
                    </h5>
                    <button
                      onClick={() => removeFromCart(item.product.id)}
                      className="text-slate-500 hover:text-rose-600 transition p-1"
                      title="Remove"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="text-[11px] text-slate-500 font-mono">
                    SKU: {item.product.sku}
                  </div>

                  <div className="flex items-center justify-between mt-2 pt-2 border-t border-stone-200">
                    <div className="flex items-center rounded bg-white border border-stone-200">
                      <button
                        onClick={() => updateCartQuantity(item.product.id, item.quantity - 1)}
                        className="px-2 py-0.5 text-slate-500 hover:text-brand-green-700 font-bold"
                      >
                        -
                      </button>
                      <span className="px-2 font-mono text-xs font-bold text-brand-green-700">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => updateCartQuantity(item.product.id, item.quantity + 1)}
                        className="px-2 py-0.5 text-slate-500 hover:text-brand-green-700 font-bold"
                      >
                        +
                      </button>
                    </div>

                    <div className="text-right">
                      <span className="font-mono text-xs font-bold text-brand-green-700">
                        ₹{item.totalPrice.toLocaleString()}
                      </span>
                      {item.quantity > 1 && item.unitPrice < item.product.sellingPrice && (
                        <span className="block text-[9px] text-emerald-600 font-semibold">
                          Bulk Tier Applied
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer Summary & Checkout */}
        {cart.length > 0 && (
          <div className="p-4 sm:p-6 bg-stone-50 border-t border-stone-200 space-y-4">
            {/* Coupon Code Section */}
            <div>
              {totals.appliedCoupon ? (
                <div className="flex items-center justify-between p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-xs text-emerald-700">
                  <span className="flex items-center gap-1 font-bold">
                    <Tag className="w-3.5 h-3.5" />
                    Coupon '{totals.appliedCoupon.code}' Applied
                  </span>
                  <button onClick={removeCoupon} className="text-[10px] underline text-emerald-600">
                    Remove
                  </button>
                </div>
              ) : (
                <form onSubmit={handleApply} className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Enter Coupon (e.g. FESTIVE20)"
                    value={couponInput}
                    onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                    className="flex-1 px-3 py-1.5 text-xs bg-white border border-stone-200 focus:border-brand-green-600 rounded text-slate-900 placeholder-slate-500 outline-none uppercase font-mono"
                  />
                  <button
                    type="submit"
                    className="px-4 py-1.5 rounded bg-brand-green-50 hover:bg-brand-green-50 text-brand-green-700 text-xs font-bold border border-brand-green-600/40 transition"
                  >
                    Apply
                  </button>
                </form>
              )}
              {couponMsg && (
                <p className={`text-[10px] mt-1 ${couponMsg.success ? 'text-emerald-600' : 'text-rose-600'}`}>
                  {couponMsg.message}
                </p>
              )}
            </div>

            {/* Calculations Breakdown */}
            <div className="space-y-1.5 text-xs text-slate-700 pt-2 border-t border-stone-200 font-medium">
              <div className="flex justify-between">
                <span className="text-slate-500">Subtotal</span>
                <span className="font-mono font-bold">₹{totals.subtotal.toLocaleString()}</span>
              </div>

              {totals.couponDiscount > 0 && (
                <div className="flex justify-between text-emerald-600">
                  <span>Coupon Discount</span>
                  <span className="font-mono font-bold">-₹{totals.couponDiscount.toLocaleString()}</span>
                </div>
              )}

              <div className="flex justify-between text-slate-500">
                <span>Estimated GST Tax</span>
                <span className="font-mono">₹{totals.gstAmount.toLocaleString()}</span>
              </div>

              <div className="flex justify-between">
                <span className="text-slate-500">Delivery Fee</span>
                <span className="font-mono font-bold text-brand-green-700">
                  {totals.shippingFee === 0 ? 'FREE' : `₹${totals.shippingFee}`}
                </span>
              </div>

              <div className="flex justify-between text-sm font-bold text-slate-900 pt-2 border-t border-stone-200">
                <span>Grand Total</span>
                <span className="font-mono text-base text-brand-green-700">
                  ₹{totals.grandTotal.toLocaleString()}
                </span>
              </div>
            </div>

            {/* Checkout Buttons */}
            <div className="space-y-2 pt-2">
              <button
                onClick={() => {
                  onClose();
                  onProceedToCheckout();
                }}
                className="w-full py-3 rounded-xl bg-brand-orange-500 hover:bg-brand-orange-600 text-white  font-bold text-xs uppercase tracking-wider shadow-md hover:scale-105 transition flex items-center justify-center gap-2 "
              >
                <span>PROCEED TO SECURE CHECKOUT</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                onClick={handleWhatsAppCheckout}
                className="w-full py-2.5 rounded-xl bg-emerald-600/20 border border-emerald-500/30 text-emerald-700 hover:bg-emerald-600/30 font-semibold text-xs flex items-center justify-center gap-2 transition"
              >
                <MessageCircle className="w-4 h-4 text-emerald-600" />
                <span>Quick Checkout on WhatsApp</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
