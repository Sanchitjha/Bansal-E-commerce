'use client';

import React, { useState } from 'react';
import { X, Star, Send, CheckCircle2, MessageSquareText, BadgeCheck } from 'lucide-react';
import { useLuminary } from '@/context/LuminaryContext';

interface SubmitReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const field =
  'w-full p-2.5 text-sm bg-slate-50 border border-slate-300 rounded-xl text-slate-900 outline-none focus:border-brand-green-600';
const label = 'block text-[11px] font-bold uppercase text-slate-700 mb-1';

export const SubmitReviewModal: React.FC<SubmitReviewModalProps> = ({ isOpen, onClose }) => {
  const { products, addReview } = useLuminary();
  const [selectedProductId, setSelectedProductId] = useState(products[0]?.id || '');
  const [rating, setRating] = useState(5);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [author, setAuthor] = useState('');
  const [location, setLocation] = useState('');
  const [orderId, setOrderId] = useState('');
  const [phone, setPhone] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{ verified: boolean; status: 'approved' | 'pending' } | null>(null);

  if (!isOpen) return null;

  const reset = () => {
    setTitle('');
    setContent('');
    setOrderId('');
    setPhone('');
    setResult(null);
    setError(null);
  };

  const close = () => {
    reset();
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!selectedProductId) return setError('Please choose a product.');
    setBusy(true);
    try {
      const res = await addReview({
        productId: selectedProductId,
        rating,
        title,
        content,
        author,
        location: location || 'India',
        orderId: orderId.trim() || undefined,
        phone: phone.trim() || undefined,
      });
      setResult(res);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not send your review. Please try again.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-lg bg-white border border-stone-200 rounded-3xl p-6 sm:p-8 shadow-2xl animate-fade-in text-slate-900 my-8">
        <button onClick={close} className="absolute top-4 right-4 p-2 rounded-full hover:bg-stone-100 text-slate-500 transition" aria-label="Close">
          <X className="w-5 h-5" />
        </button>

        {result ? (
          <div className="text-center py-8 space-y-4 animate-fade-in">
            <div className="w-16 h-16 rounded-full bg-emerald-500/15 text-emerald-600 border border-emerald-500/30 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h3 className="text-2xl font-bold">Thank you for your review!</h3>
            <p className="text-sm text-slate-600 max-w-sm mx-auto">
              {result.status === 'approved'
                ? 'Your review is now live with a Verified Buyer badge.'
                : 'We will check your review and publish it soon.'}
            </p>
            <button onClick={close} className="px-6 py-2.5 bg-black text-white text-[12px] font-semibold uppercase tracking-[0.16em]">
              Close
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-brand-green-50 text-brand-green-700 border border-brand-green-200">
                <MessageSquareText className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-xl font-bold">Write a review</h3>
                <p className="text-xs text-slate-500">Tell others what you think of the product</p>
              </div>
            </div>

            <div>
              <label className={label}>Product *</label>
              <select value={selectedProductId} onChange={(e) => setSelectedProductId(e.target.value)} className={field}>
                {products.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className={label}>Star rating *</label>
              <div className="flex items-center gap-1 text-amber-500">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button type="button" key={star} onClick={() => setRating(star)} className="p-1 hover:scale-110 transition" aria-label={`${star} star${star > 1 ? 's' : ''}`}>
                    <Star className={`w-6 h-6 ${star <= rating ? 'fill-current' : 'text-stone-300'}`} />
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={label}>Your name *</label>
                <input type="text" required maxLength={80} placeholder="Your name" value={author} onChange={(e) => setAuthor(e.target.value)} className={field} />
              </div>
              <div>
                <label className={label}>City</label>
                <input type="text" maxLength={80} placeholder="e.g. Mohali, PB" value={location} onChange={(e) => setLocation(e.target.value)} className={field} />
              </div>
            </div>

            <div>
              <label className={label}>Headline *</label>
              <input type="text" required maxLength={120} placeholder="e.g. Lovely scent that lasts" value={title} onChange={(e) => setTitle(e.target.value)} className={field} />
            </div>

            <div>
              <label className={label}>Your review *</label>
              <textarea rows={3} required maxLength={2000} placeholder="Write your review here…" value={content} onChange={(e) => setContent(e.target.value)} className={`${field} resize-none`} />
            </div>

            <div className="rounded-2xl bg-brand-green-50 border border-brand-green-200 p-4 space-y-3">
              <div className="flex items-start gap-2 text-xs text-brand-green-900">
                <BadgeCheck className="w-4 h-4 mt-0.5 shrink-0 text-brand-green-700" />
                <p>
                  <strong>Bought this from us?</strong> Add your order details to get a <strong>Verified Buyer</strong> badge and publish right away. Without them, we check your review before it appears.
                </p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={label}>Order ID</label>
                  <input type="text" placeholder="LF-20261007-123456" value={orderId} onChange={(e) => setOrderId(e.target.value)} className={`${field} font-mono`} />
                </div>
                <div>
                  <label className={label}>Phone used for the order</label>
                  <input type="tel" inputMode="numeric" placeholder="10-digit mobile" value={phone} onChange={(e) => setPhone(e.target.value)} className={field} />
                </div>
              </div>
            </div>

            {error && <p className="text-sm text-rose-600 font-medium">{error}</p>}

            <button
              type="submit"
              disabled={busy}
              className="w-full py-3.5 bg-black hover:bg-brand-green-800 text-white text-[12px] font-semibold uppercase tracking-[0.16em] flex items-center justify-center gap-2 transition disabled:opacity-60"
            >
              <Send className="w-4 h-4" />
              {busy ? 'Sending…' : 'Submit review'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
