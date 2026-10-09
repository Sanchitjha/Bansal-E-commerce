'use client';

import React, { useEffect, useState } from 'react';
import { BadgeCheck, Star } from 'lucide-react';
import { useShell } from '@/components/layout/StoreShell';
import type { ReviewItem } from '@/types';

/** The reviews for one product, with a Verified Buyer badge on the ones matched to a real order. */
export const ProductReviews: React.FC<{ productId: string }> = ({ productId }) => {
  const shell = useShell();
  const [reviews, setReviews] = useState<ReviewItem[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/reviews?productId=${encodeURIComponent(productId)}`)
      .then((res) => (res.ok ? res.json() : []))
      .then((data: ReviewItem[]) => !cancelled && setReviews(Array.isArray(data) ? data : []))
      .catch(() => !cancelled && setReviews([]));
    return () => {
      cancelled = true;
    };
  }, [productId]);

  if (reviews === null) return null;

  return (
    <section className="mt-8 bg-white rounded-3xl border border-stone-200 p-5 sm:p-8" aria-labelledby="reviews-heading">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
        <h2 id="reviews-heading" className="text-xl font-bold text-slate-900">Customer reviews</h2>
        <button
          onClick={shell.openReview}
          className="px-5 py-2.5 border border-black text-[12px] font-semibold uppercase tracking-[0.16em] hover:bg-black hover:text-white transition"
        >
          Write a review
        </button>
      </div>

      {reviews.length === 0 ? (
        <p className="text-sm text-slate-500">No reviews yet. Be the first to share your experience.</p>
      ) : (
        <ul className="divide-y divide-stone-100">
          {reviews.slice(0, 10).map((review) => (
            <li key={review.id} className="py-4 first:pt-0">
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                <span className="flex text-amber-500" aria-label={`${review.rating} out of 5 stars`}>
                  {[1, 2, 3, 4, 5].map((s) => (
                    <Star key={s} className={`w-4 h-4 ${s <= review.rating ? 'fill-current' : 'text-stone-300'}`} />
                  ))}
                </span>
                <span className="text-sm font-semibold text-slate-900">{review.title}</span>
              </div>
              <p className="text-sm text-slate-600 mt-1.5 leading-relaxed">{review.content}</p>
              <div className="flex flex-wrap items-center gap-x-3 mt-2 text-xs text-slate-500">
                <span className="font-semibold text-slate-700">{review.author}</span>
                {review.location && <span>{review.location}</span>}
                <span>{new Date(review.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                {review.verified && (
                  <span className="inline-flex items-center gap-1 font-semibold text-brand-green-700">
                    <BadgeCheck className="w-4 h-4" /> Verified Buyer
                  </span>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
};
