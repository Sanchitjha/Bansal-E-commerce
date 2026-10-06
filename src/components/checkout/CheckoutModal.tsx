'use client';

import React, { useState } from 'react';
import { X, ShieldCheck, CreditCard, CheckCircle2, Lock, Truck, Sparkles, Building, MapPin } from 'lucide-react';
import { useLuminary } from '@/context/LuminaryContext';
import confetti from 'canvas-confetti';
import { Order } from '@/types';

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOrderSuccess: (order: Order) => void;
}

export const CheckoutModal: React.FC<CheckoutModalProps> = ({
  isOpen,
  onClose,
  onOrderSuccess,
}) => {
  if (!isOpen) return null;

  const { getCartTotals, cart, placeOrder } = useLuminary();
  const totals = getCartTotals();

  const [formData, setFormData] = useState({
    customerName: '',
    phone: '',
    email: '',
    shippingAddress: '',
    city: 'Mumbai',
    state: 'Maharashtra',
    pincode: '400050',
    paymentMethod: 'Razorpay' as 'Razorpay' | 'Cashfree' | 'UPI' | 'Credit Card' | 'COD',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (cart.length === 0) return;

    setIsSubmitting(true);
    setError(null);

    try {
      const newOrder = await placeOrder({
        customerName: formData.customerName,
        phone: formData.phone,
        email: formData.email,
        shippingAddress: formData.shippingAddress,
        city: formData.city,
        state: formData.state,
        pincode: formData.pincode,
        paymentMethod: formData.paymentMethod,
      });

      // Launch celebration confetti!
      try {
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 },
        });
      } catch (e) {}

      onOrderSuccess(newOrder);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not place order. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-3xl bg-white border border-stone-200 rounded-3xl shadow-2xl overflow-hidden my-8 animate-fade-in text-slate-900">
        {/* Modal Header */}
        <div className="p-6 bg-stone-50 border-b border-stone-200 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-brand-green-50 text-brand-green-700 border border-stone-200">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <h3 className=" text-xl font-bold text-slate-900">Luminary Express Checkout</h3>
              <p className="text-xs text-slate-500">256-Bit SSL Encrypted Payment Gateway</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-stone-100 text-slate-500 hover:text-brand-green-700 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
            {/* Customer Details Form */}
            <div className="md:col-span-7 space-y-4">
              <h4 className="text-xs font-bold uppercase tracking-widest text-brand-green-700 flex items-center gap-1.5">
                <MapPin className="w-4 h-4" />
                1. Delivery & Contact Details
              </h4>

              <div className="space-y-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Vikramaditya Roy"
                    value={formData.customerName}
                    onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
                    className="w-full px-3.5 py-2.5 text-xs bg-stone-50 border border-stone-200 focus:border-brand-green-600 rounded-xl text-slate-900 placeholder-slate-500 outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                      Phone Number *
                    </label>
                    <input
                      type="tel"
                      required
                      placeholder="+91 98765 43210"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="w-full px-3.5 py-2.5 text-xs bg-stone-50 border border-stone-200 focus:border-brand-green-600 rounded-xl text-slate-900 placeholder-slate-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                      Email Address *
                    </label>
                    <input
                      type="email"
                      required
                      placeholder="v.roy@example.com"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full px-3.5 py-2.5 text-xs bg-stone-50 border border-stone-200 focus:border-brand-green-600 rounded-xl text-slate-900 placeholder-slate-500 outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                    Shipping Street Address *
                  </label>
                  <textarea
                    required
                    rows={2}
                    placeholder="Flat/House No, Building Name, Street, Landmark"
                    value={formData.shippingAddress}
                    onChange={(e) => setFormData({ ...formData, shippingAddress: e.target.value })}
                    className="w-full px-3.5 py-2.5 text-xs bg-stone-50 border border-stone-200 focus:border-brand-green-600 rounded-xl text-slate-900 placeholder-slate-500 outline-none resize-none"
                  />
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                      City
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.city}
                      onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                      className="w-full px-3 py-2 text-xs bg-stone-50 border border-stone-200 focus:border-brand-green-600 rounded-xl text-slate-900 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                      State
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.state}
                      onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                      className="w-full px-3 py-2 text-xs bg-stone-50 border border-stone-200 focus:border-brand-green-600 rounded-xl text-slate-900 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                      Pincode
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.pincode}
                      onChange={(e) => setFormData({ ...formData, pincode: e.target.value })}
                      className="w-full px-3 py-2 text-xs bg-stone-50 border border-stone-200 focus:border-brand-green-600 rounded-xl text-slate-900 outline-none font-mono"
                    />
                  </div>
                </div>
              </div>

              {/* Payment Method Selector */}
              <div className="pt-3">
                <h4 className="text-xs font-bold uppercase tracking-widest text-brand-green-700 flex items-center gap-1.5 mb-3">
                  <CreditCard className="w-4 h-4" />
                  2. Select Payment Method
                </h4>

                <div className="grid grid-cols-2 gap-2 text-xs font-semibold">
                  {[
                    { id: 'Razorpay', label: 'Razorpay Gateway', sub: 'Cards, UPI, Netbanking' },
                    { id: 'UPI', label: 'Instant UPI Direct', sub: 'GPay, PhonePe, Paytm' },
                    { id: 'Cashfree', label: 'Cashfree Payments', sub: 'BNPL & EMI Available' },
                    { id: 'COD', label: 'Cash on Delivery', sub: 'Pay upon delivery' },
                  ].map((method) => (
                    <label
                      key={method.id}
                      className={`p-3 rounded-xl border cursor-pointer transition flex flex-col justify-between ${
                        formData.paymentMethod === method.id
                          ? 'bg-brand-green-50 border-brand-green-600 text-brand-green-700 shadow'
                          : 'bg-stone-50 border-stone-200 text-slate-700 hover:border-stone-300'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold">{method.label}</span>
                        <input
                          type="radio"
                          name="paymentMethod"
                          checked={formData.paymentMethod === method.id}
                          onChange={() => setFormData({ ...formData, paymentMethod: method.id as any })}
                          className="accent-brand-green-700"
                        />
                      </div>
                      <span className="text-[10px] text-slate-500 font-normal mt-1">{method.sub}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            {/* Order Summary Column */}
            <div className="md:col-span-5 flex flex-col justify-between p-5 rounded-2xl bg-stone-50 border border-stone-200 space-y-4">
              <div>
                <h4 className="text-xs font-bold uppercase tracking-widest text-brand-green-700 border-b border-stone-200 pb-2 mb-3">
                  Order Items Summary ({cart.length})
                </h4>

                <div className="max-h-48 overflow-y-auto space-y-2 pr-1">
                  {cart.map((item) => (
                    <div key={item.product.id} className="flex items-center justify-between text-xs">
                      <div className="min-w-0 pr-2">
                        <p className="font-medium text-slate-800 truncate">{item.product.name}</p>
                        <p className="text-[10px] text-slate-500">Qty: {item.quantity} x ₹{item.unitPrice}</p>
                      </div>
                      <span className="font-mono font-bold text-brand-green-700 shrink-0">
                        ₹{item.totalPrice.toLocaleString()}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="mt-4 pt-3 border-t border-stone-200 space-y-2 text-xs">
                  <div className="flex justify-between text-slate-500">
                    <span>Item Subtotal</span>
                    <span className="font-mono">₹{totals.subtotal.toLocaleString()}</span>
                  </div>

                  {totals.couponDiscount > 0 && (
                    <div className="flex justify-between text-emerald-600 font-semibold">
                      <span>Coupon Discount</span>
                      <span className="font-mono">-₹{totals.couponDiscount.toLocaleString()}</span>
                    </div>
                  )}

                  <div className="flex justify-between text-slate-500 text-[11px]">
                    <span>GST Tax Breakdown</span>
                    <span className="font-mono">₹{totals.gstAmount.toLocaleString()}</span>
                  </div>

                  <div className="flex justify-between text-slate-500">
                    <span>Express Shipping</span>
                    <span className="font-mono text-brand-green-700 font-bold">
                      {totals.shippingFee === 0 ? 'FREE' : `₹${totals.shippingFee}`}
                    </span>
                  </div>

                  <div className="flex justify-between text-sm font-bold text-slate-900 pt-3 border-t border-stone-200">
                    <span>Total Amount Payable</span>
                    <span className="font-mono text-base text-brand-green-700">
                      ₹{totals.grandTotal.toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                {error && (
                  <p className="text-[11px] text-rose-600 font-semibold text-center bg-rose-500/10 border border-rose-500/30 rounded-lg py-2 px-3">
                    {error}
                  </p>
                )}
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-3.5 rounded-xl bg-brand-orange-500 hover:bg-brand-orange-600 text-white  font-bold text-xs uppercase tracking-wider shadow-md hover:scale-105 transition flex items-center justify-center gap-2 "
                >
                  {isSubmitting ? (
                    <span>Processing Payment...</span>
                  ) : (
                    <>
                      <ShieldCheck className="w-4 h-4" />
                      <span>PLACE ORDER (₹{totals.grandTotal.toLocaleString()})</span>
                    </>
                  )}
                </button>

                <p className="text-[10px] text-center text-slate-500">
                  By clicking Place Order, you agree to Luminary Terms of Service & Privacy Policy.
                </p>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
