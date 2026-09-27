'use client';

import React, { useState } from 'react';
import { X, Star, Send, CheckCircle2, Award } from 'lucide-react';
import { useLuminary } from '@/context/LuminaryContext';

interface SubmitReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SubmitReviewModal: React.FC<SubmitReviewModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const { products, addReview } = useLuminary();
  const [selectedProductId, setSelectedProductId] = useState(products[0]?.id || '');
  const [rating, setRating] = useState(5);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [author, setAuthor] = useState('');
  const [location, setLocation] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !content || !author) return;

    addReview({
      productId: selectedProductId,
      rating,
      title,
      content,
      author,
      location: location || 'India',
    });

    setSubmitted(true);
    setTimeout(() => {
      setSubmitted(false);
      onClose();
    }, 3000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-obsidian-950/85 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-lg bg-white dark:bg-obsidian-900 border border-amber-500/40 rounded-3xl p-6 sm:p-8 shadow-2xl animate-fade-in text-slate-900 dark:text-slate-100 my-8">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-500 transition"
        >
          <X className="w-5 h-5" />
        </button>

        {submitted ? (
          <div className="text-center py-8 space-y-4 animate-fade-in">
            <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-500 border border-emerald-500/40 flex items-center justify-center mx-auto shadow-md">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h3 className="font-serif text-2xl font-bold">Review Submitted!</h3>
            <p className="text-xs text-slate-600 dark:text-slate-300 max-w-sm mx-auto font-medium">
              Thank you for reviewing Luminary products! Use reward coupon code <strong className="text-amber-600 dark:text-gold-300 font-mono">WELCOME10</strong> for 10% OFF your next purchase.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-amber-500/15 text-amber-600 dark:text-gold-400 border border-amber-500/30">
                <Award className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-serif text-xl font-bold">Write a Verified Buyer Review</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Share your experience & earn a 10% discount reward</p>
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold uppercase text-slate-700 dark:text-slate-300 mb-1">
                Select Product *
              </label>
              <select
                value={selectedProductId}
                onChange={(e) => setSelectedProductId(e.target.value)}
                className="w-full p-2.5 text-xs bg-slate-50 dark:bg-obsidian-950 border border-slate-300 dark:border-slate-800 rounded-xl text-slate-900 dark:text-slate-100 outline-none"
              >
                {products.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.sku})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-bold uppercase text-slate-700 dark:text-slate-300 mb-1">
                Star Rating *
              </label>
              <div className="flex items-center gap-2 text-amber-500">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    type="button"
                    key={star}
                    onClick={() => setRating(star)}
                    className="p-1 hover:scale-125 transition"
                  >
                    <Star className={`w-6 h-6 ${star <= rating ? 'fill-current' : 'text-slate-300 dark:text-slate-700'}`} />
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold uppercase text-slate-700 dark:text-slate-300 mb-1">
                  Your Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Kavita Subramaniam"
                  value={author}
                  onChange={(e) => setAuthor(e.target.value)}
                  className="w-full p-2.5 text-xs bg-slate-50 dark:bg-obsidian-950 border border-slate-300 dark:border-slate-800 rounded-xl text-slate-900 dark:text-slate-100 outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase text-slate-700 dark:text-slate-300 mb-1">
                  City / Location
                </label>
                <input
                  type="text"
                  placeholder="Mumbai, MH"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="w-full p-2.5 text-xs bg-slate-50 dark:bg-obsidian-950 border border-slate-300 dark:border-slate-800 rounded-xl text-slate-900 dark:text-slate-100 outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold uppercase text-slate-700 dark:text-slate-300 mb-1">
                Headline Title *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Hypnotic Scent & Unmatched Longevity!"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full p-2.5 text-xs bg-slate-50 dark:bg-obsidian-950 border border-slate-300 dark:border-slate-800 rounded-xl text-slate-900 dark:text-slate-100 outline-none"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold uppercase text-slate-700 dark:text-slate-300 mb-1">
                Detailed Feedback *
              </label>
              <textarea
                rows={3}
                required
                placeholder="Write your review comments here..."
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="w-full p-2.5 text-xs bg-slate-50 dark:bg-obsidian-950 border border-slate-300 dark:border-slate-800 rounded-xl text-slate-900 dark:text-slate-100 outline-none resize-none"
              />
            </div>

            <button
              type="submit"
              className="w-full py-3.5 rounded-xl gold-gradient-bg text-slate-950 font-extrabold text-xs uppercase tracking-wider shadow-lg flex items-center justify-center gap-2 hover:scale-105 transition shimmer-btn"
            >
              <Send className="w-4 h-4" />
              <span>SUBMIT REVIEW & CLAIM DISCOUNT</span>
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
