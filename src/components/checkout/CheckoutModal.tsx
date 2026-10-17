'use client';

import React, { useEffect, useRef, useState } from 'react';
import { X, ShieldCheck, CreditCard, Lock, MapPin, Banknote, Smartphone, ArrowLeft } from 'lucide-react';
import confetti from 'canvas-confetti';
import { CartItem, Order } from '@/types';
import { useLuminary } from '@/context/LuminaryContext';
import { INDIAN_STATES, canonicalState } from '@/lib/india';
import { trackInitiateCheckout, trackPurchase } from '@/lib/metaPixel';
import { WhatsAppIcon } from '@/components/ui/WhatsAppIcon';
import { useModalHistory } from '@/hooks/useModalHistory';

declare global {
  interface Window {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    Razorpay?: any;
  }
}

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOrderSuccess: (order: Order) => void;
}

interface PincodeResult {
  valid: boolean;
  available: boolean;
  cod: boolean;
  city?: string;
  state?: string;
  estimatedDays?: string;
  message?: string;
}

const input =
  'w-full px-3.5 py-2.5 text-sm bg-stone-50 border border-stone-200 focus:border-brand-green-600 rounded-xl text-slate-900 placeholder-slate-400 outline-none';
const label = 'block text-xs font-semibold text-slate-600 mb-1';

function loadRazorpay(): Promise<boolean> {
  if (typeof window === 'undefined') return Promise.resolve(false);
  if (window.Razorpay) return Promise.resolve(true);
  return new Promise((resolve) => {
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

export const CheckoutModal: React.FC<CheckoutModalProps> = ({ isOpen, onClose, onOrderSuccess }) => {
  useModalHistory(isOpen, onClose, 'checkout');
  const { getCartTotals, cart, placeOrder, verifyPayment, cancelPayment, paymentOptions, customer, showToast, settings } = useLuminary();

  const [formData, setFormData] = useState({
    customerName: '',
    phone: '',
    email: '',
    shippingAddress: '',
    city: '',
    state: '',
    pincode: '',
  });
  const [paymentMethod, setPaymentMethod] = useState<'Razorpay' | 'COD'>('Razorpay');
  const [pin, setPin] = useState<PincodeResult | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [frozen, setFrozen] = useState<{ cart: CartItem[]; totals: ReturnType<typeof getCartTotals> } | null>(null);
  const paidRef = useRef(false);
  const pinRequest = useRef(0);

  const handleWhatsAppOrder = () => {
    const currentTotals = frozen?.totals ?? getCartTotals();
    const currentCart = frozen?.cart ?? cart;
    const itemsText = currentCart
      .map((i) => `• ${i.product.name} (Qty: ${i.quantity}) - ₹${i.totalPrice.toLocaleString('en-IN')}`)
      .join('\n');
    const address = [formData.shippingAddress, formData.city, formData.state, formData.pincode].filter(Boolean).join(', ');
    const msg = encodeURIComponent(
      `Hello Luminary, I want to confirm my order via WhatsApp:\n\n` +
      `*Customer:* ${formData.customerName || 'Customer'}\n` +
      `*Phone:* ${formData.phone}\n` +
      `*Email:* ${formData.email}\n` +
      `*Address:* ${address || 'Pending'}\n\n` +
      `*Items:*\n${itemsText}\n\n` +
      `*Total Payable:* ₹${currentTotals.grandTotal.toLocaleString('en-IN')}`
    );
    window.open(`https://wa.me/${settings.whatsAppNumber}?text=${msg}`, '_blank');
  };

  useEffect(() => {
    if (!isOpen || !customer) return;
    setFormData((f) => ({ ...f, customerName: f.customerName || customer.name, email: f.email || customer.email, phone: f.phone || customer.phone }));
  }, [isOpen, customer]);

  useEffect(() => {
    if (!isOpen || cart.length === 0) return;
    const totals = getCartTotals();
    trackInitiateCheckout(
      cart.map((item) => ({
        id: item.product.sku || item.product.id,
        name: item.product.name,
        price: item.unitPrice,
        quantity: item.quantity,
      })),
      totals.grandTotal
    );
  }, [isOpen]);

  const online = paymentOptions.online;
  const codAllowed = paymentOptions.cod && pin?.cod !== false;

  // Prefer paying online when it is available; fall back to whatever is actually allowed.
  useEffect(() => {
    if (online) setPaymentMethod('Razorpay');
  }, [online]);

  useEffect(() => {
    setPaymentMethod((current) => {
      if (current === 'Razorpay' && !online) return 'COD';
      if (current === 'COD' && !codAllowed && online) return 'Razorpay';
      return current;
    });
  }, [online, codAllowed]);

  const onPincode = (value: string) => {
    const digits = value.replace(/\D/g, '').slice(0, 6);
    setFormData((f) => ({ ...f, pincode: digits }));
    setPin(null);
    if (digits.length !== 6) return;

    const requestId = ++pinRequest.current;
    fetch(`/api/pincode/${digits}`)
      .then((r) => r.json())
      .then((data: PincodeResult) => {
        if (requestId !== pinRequest.current) return;
        setPin(data);
        if (data.valid) {
          setFormData((f) => ({
            ...f,
            city: data.city || f.city,
            state: (data.state && canonicalState(data.state)) || f.state,
          }));
        }
      })
      .catch(() => {});
  };

  if (!isOpen) return null;

  const live = getCartTotals();
  const shownCart = frozen?.cart ?? cart;
  const totals = frozen?.totals ?? live;

  const blocked = pin !== null && (!pin.valid || !pin.available);
  const noPaymentOption = !online && !codAllowed;

  const finish = (order: Order) => {
    try {
      confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
    } catch {}
    trackPurchase(order);
    onOrderSuccess(order);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (cart.length === 0 || blocked || noPaymentOption) return;

    setIsSubmitting(true);
    setError(null);
    paidRef.current = false;
    setFrozen({ cart, totals: live });

    try {
      const { order, razorpay } = await placeOrder({ ...formData, paymentMethod });

      if (!razorpay) {
        finish(order);
        return;
      }

      const loaded = await loadRazorpay();
      if (!loaded || !window.Razorpay) {
        await cancelPayment(order.id, order.accessToken ?? '');
        throw new Error('Could not load the payment window. Please check your connection and try again.');
      }

      const rzp = new window.Razorpay({
        key: razorpay.keyId,
        amount: razorpay.amount,
        currency: 'INR',
        name: razorpay.name,
        description: `Order ${order.id}`,
        order_id: razorpay.gatewayOrderId,
        prefill: razorpay.prefill,
        theme: { color: '#2f5d27' },
        handler: async (response: { razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string }) => {
          paidRef.current = true;
          try {
            const paidOrder = await verifyPayment({ orderId: order.id, ...response });
            setFrozen(null);
            setIsSubmitting(false);
            finish(paidOrder);
          } catch {
            // Money may have been taken: the server also hears about it directly from Razorpay.
            setFrozen(null);
            setIsSubmitting(false);
            setError(`We received your payment but could not confirm it on screen. Your order ID is ${order.id}. You will get an email shortly; if not, contact us with this ID.`);
          }
        },
        modal: {
          ondismiss: async () => {
            if (paidRef.current) return;
            await cancelPayment(order.id, order.accessToken ?? '');
            setFrozen(null);
            setIsSubmitting(false);
            setError('Payment was not completed, so no order was placed. Your items are still in your cart.');
          },
        },
      });
      rzp.on('payment.failed', (resp: { error?: { description?: string } }) => {
        showToast(resp?.error?.description || 'Payment failed. You can try again in the payment window.', 'error');
      });
      rzp.open();
    } catch (err) {
      setFrozen(null);
      setIsSubmitting(false);
      setError(err instanceof Error ? err.message : 'Could not place your order. Please try again.');
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm -webkit-overflow-scrolling-touch"
      onClick={(e) => {
        if (e.target === e.currentTarget && !isSubmitting) onClose();
      }}
    >
      <div className="min-h-full flex items-start sm:items-center justify-center p-0 sm:p-4 text-left">
        <div
          className="relative w-full max-w-3xl bg-white sm:rounded-3xl shadow-2xl overflow-hidden my-0 sm:my-8 min-h-screen sm:min-h-0 animate-fade-in"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Sticky Header Bar */}
          <div className="sticky top-0 z-30 p-4 sm:p-6 border-b border-stone-200 bg-white/95 backdrop-blur-md flex items-center justify-between shadow-xs">
            <div className="flex items-center gap-2 sm:gap-3">
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                className="sm:hidden p-1.5 -ml-1 rounded-lg text-slate-700 active:bg-stone-100 flex items-center gap-1 text-xs font-semibold"
                aria-label="Back"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-brand-green-50 text-brand-green-700 flex items-center justify-center shrink-0">
                <Lock className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
              <div>
                <h3 className="text-base sm:text-lg font-bold text-slate-900">Secure Checkout</h3>
                <p className="text-[11px] sm:text-xs text-slate-500 hidden sm:block">Your details are sent over an encrypted connection</p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="p-2 rounded-full hover:bg-stone-100 text-slate-500 disabled:opacity-40 transition"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

        <form onSubmit={handleSubmit} className="p-6 sm:p-8">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
            <div className="md:col-span-7 space-y-4">
              <h4 className="text-xs font-bold uppercase tracking-widest text-brand-green-700 flex items-center gap-1.5">
                <MapPin className="w-4 h-4" /> 1. Delivery & contact
              </h4>

              <div>
                <label className={label}>Full name *</label>
                <input required className={input} placeholder="e.g. Vikram Roy" value={formData.customerName} onChange={(e) => setFormData({ ...formData, customerName: e.target.value })} autoComplete="name" />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={label}>Mobile number *</label>
                  <input required type="tel" inputMode="numeric" className={input} placeholder="10-digit mobile" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} autoComplete="tel" />
                </div>
                <div>
                  <label className={label}>Email *</label>
                  <input required type="email" className={input} placeholder="you@example.com" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} autoComplete="email" />
                </div>
              </div>

              <div>
                <label className={label}>Street address *</label>
                <textarea required rows={2} className={`${input} resize-none`} placeholder="House / flat no, building, street, landmark" value={formData.shippingAddress} onChange={(e) => setFormData({ ...formData, shippingAddress: e.target.value })} autoComplete="street-address" />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className={label}>Pincode *</label>
                  <input required inputMode="numeric" maxLength={6} className={`${input} font-mono`} placeholder="400050" value={formData.pincode} onChange={(e) => onPincode(e.target.value)} autoComplete="postal-code" />
                </div>
                <div>
                  <label className={label}>City *</label>
                  <input required className={input} value={formData.city} onChange={(e) => setFormData({ ...formData, city: e.target.value })} autoComplete="address-level2" />
                </div>
                <div>
                  <label className={label}>State *</label>
                  <select required className={input} value={formData.state} onChange={(e) => setFormData({ ...formData, state: e.target.value })}>
                    <option value="">Select</option>
                    {INDIAN_STATES.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {pin && (
                <p className={`text-xs font-medium ${blocked ? 'text-rose-600' : 'text-brand-green-700'}`}>
                  {blocked
                    ? pin.message || 'We cannot deliver to this pincode.'
                    : `Delivery in about ${pin.estimatedDays}${pin.cod && codAllowed ? ' · Cash on delivery available' : ' · Online payment only'}`}
                </p>
              )}

              <div className="pt-2">
                <h4 className="text-xs font-bold uppercase tracking-widest text-brand-green-700 flex items-center gap-1.5 mb-3">
                  <CreditCard className="w-4 h-4" /> 2. Payment method
                </h4>

                {noPaymentOption ? (
                  <p className="text-sm text-rose-600 font-medium">No payment method is available for this order right now. Please contact us.</p>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {online && (
                      <label
                        className={`p-3 rounded-xl border cursor-pointer transition ${paymentMethod === 'Razorpay' ? 'bg-brand-green-50 border-brand-green-600' : 'bg-white border-stone-200 hover:border-stone-300'}`}
                      >
                        <div className="flex items-center justify-between text-sm font-semibold text-slate-900">
                          <span className="flex items-center gap-2"><Smartphone className="w-4 h-4 text-brand-green-700" /> Pay online</span>
                          <input type="radio" name="pm" checked={paymentMethod === 'Razorpay'} onChange={() => setPaymentMethod('Razorpay')} className="accent-brand-green-700" />
                        </div>
                        <p className="text-[11px] text-slate-500 mt-1">UPI, cards, netbanking, wallets</p>
                      </label>
                    )}
                    {codAllowed && (
                      <label
                        className={`p-3 rounded-xl border cursor-pointer transition ${paymentMethod === 'COD' ? 'bg-brand-green-50 border-brand-green-600' : 'bg-white border-stone-200 hover:border-stone-300'}`}
                      >
                        <div className="flex items-center justify-between text-sm font-semibold text-slate-900">
                          <span className="flex items-center gap-2"><Banknote className="w-4 h-4 text-brand-green-700" /> Cash on delivery</span>
                          <input type="radio" name="pm" checked={paymentMethod === 'COD'} onChange={() => setPaymentMethod('COD')} className="accent-brand-green-700" />
                        </div>
                        <p className="text-[11px] text-slate-500 mt-1">Pay when your order arrives</p>
                      </label>
                    )}
                  </div>
                )}
                {!online && (
                  <p className="text-[11px] text-slate-400 mt-2">Online payment is not enabled for this store yet.</p>
                )}
              </div>
            </div>

            <div className="md:col-span-5 flex flex-col justify-between p-5 rounded-2xl bg-stone-50 border border-stone-200 space-y-4">
              <div>
                <h4 className="text-xs font-bold uppercase tracking-widest text-brand-green-700 border-b border-stone-200 pb-2 mb-3">
                  Order summary ({shownCart.length})
                </h4>

                <div className="mb-3 px-3 py-2 rounded-xl bg-amber-50 border border-amber-200 text-amber-950 text-xs flex items-center justify-between">
                  <span className="flex items-center gap-1.5 font-medium text-[11px]">
                    <span className="text-sm">🪔</span>
                    <span><strong>Navratri Offer:</strong> 2 ml Attar @ ₹1 • ₹98 Flat Delivery</span>
                  </span>
                  <span className="shrink-0 px-2 py-0.5 rounded-full bg-amber-200/80 text-amber-900 font-bold text-[10px] border border-amber-300">
                    APPLIED
                  </span>
                </div>

                <div className="max-h-48 overflow-y-auto space-y-2 pr-1">
                  {shownCart.map((item) => (
                    <div key={item.product.id} className="flex items-center justify-between text-sm">
                      <div className="min-w-0 pr-2">
                        <p className="font-medium text-slate-900 truncate">{item.product.name}</p>
                        <p className="text-[11px] text-slate-500">Qty {item.quantity} × ₹{item.unitPrice.toLocaleString('en-IN')}</p>
                      </div>
                      <span className="font-semibold text-slate-900 shrink-0">₹{item.totalPrice.toLocaleString('en-IN')}</span>
                    </div>
                  ))}
                </div>

                <div className="mt-4 pt-3 border-t border-stone-200 space-y-2 text-sm">
                  <div className="flex justify-between text-slate-600">
                    <span>Subtotal</span>
                    <span>₹{totals.subtotal.toLocaleString('en-IN')}</span>
                  </div>
                  {totals.couponDiscount > 0 && (
                    <div className="flex justify-between text-emerald-700 font-medium">
                      <span>Coupon discount</span>
                      <span>-₹{totals.couponDiscount.toLocaleString('en-IN')}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-slate-600">
                    <span>Shipping</span>
                    <span className="font-semibold">{totals.shippingFee === 0 ? 'FREE' : `₹${totals.shippingFee}`}</span>
                  </div>
                  <div className="flex justify-between text-[11px] text-slate-400">
                    <span>Includes GST</span>
                    <span>₹{totals.gstAmount.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between text-base font-bold text-slate-900 pt-3 border-t border-stone-200">
                    <span>Total payable</span>
                    <span>₹{totals.grandTotal.toLocaleString('en-IN')}</span>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                {error && (
                  <div className="space-y-2 p-3 bg-rose-50 border border-rose-200 rounded-xl">
                    <p className="text-xs text-rose-700 font-medium leading-relaxed">{error}</p>
                    {codAllowed && paymentMethod === 'Razorpay' && (
                      <button
                        type="button"
                        onClick={() => {
                          setPaymentMethod('COD');
                          setError(null);
                        }}
                        className="w-full py-2 px-3 rounded-lg bg-amber-100/80 hover:bg-amber-100 border border-amber-300 text-amber-950 text-xs font-semibold transition flex items-center justify-center gap-1.5"
                      >
                        <Banknote className="w-4 h-4 text-amber-800" />
                        <span>Switch to Cash on Delivery</span>
                      </button>
                    )}
                    {settings?.whatsAppNumber && (
                      <button
                        type="button"
                        onClick={handleWhatsAppOrder}
                        className="w-full py-2 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-sm transition flex items-center justify-center gap-1.5"
                      >
                        <WhatsAppIcon className="w-4 h-4 fill-current" />
                        <span>Order via WhatsApp (Instant Support)</span>
                      </button>
                    )}
                  </div>
                )}
                <button
                  type="submit"
                  disabled={isSubmitting || blocked || noPaymentOption || cart.length === 0}
                  className="w-full py-3.5 rounded-full bg-brand-orange-500 hover:bg-brand-orange-600 text-white font-bold text-sm transition flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? (
                    <span>{paymentMethod === 'Razorpay' ? 'Opening payment...' : 'Placing order...'}</span>
                  ) : (
                    <>
                      <ShieldCheck className="w-4 h-4" />
                      <span>{paymentMethod === 'Razorpay' ? 'PAY' : 'PLACE ORDER'} · ₹{totals.grandTotal.toLocaleString('en-IN')}</span>
                    </>
                  )}
                </button>
                <p className="text-[11px] text-center text-slate-500">
                  By placing your order you agree to our{' '}
                  <a href="/policies/terms" target="_blank" className="underline">Terms</a> and{' '}
                  <a href="/policies/privacy" target="_blank" className="underline">Privacy Policy</a>.
                </p>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
