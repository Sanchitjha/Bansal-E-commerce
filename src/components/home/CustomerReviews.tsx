'use client';

import React, { useEffect, useState } from 'react';
import { Star, BadgeCheck, Quote } from 'lucide-react';
import { useLuminary } from '@/context/LuminaryContext';
import { ReviewItem } from '@/types';

interface CustomerReviewsProps {
  onWriteReview: () => void;
}

export const CustomerReviews: React.FC<CustomerReviewsProps> = ({ onWriteReview }) => {
  const { products, reviews: newReviews } = useLuminary();
  const [fetched, setFetched] = useState<ReviewItem[]>([]);

  useEffect(() => {
    fetch('/api/reviews')
      .then((res) => (res.ok ? res.json() : []))
      .then((data: ReviewItem[]) => setFetched(Array.isArray(data) ? data : []))
      .catch(() => setFetched([]));
  }, []);

  // Reviews submitted in this session show up immediately, de-duplicated against the fetched list.
  const seen = new Set<string>();
  const reviews = [...newReviews, ...fetched]
    .filter((r) => (seen.has(r.id) ? false : (seen.add(r.id), true)))
    .slice(0, 6);

  const totalReviews = products.reduce((sum, p) => sum + p.reviewsCount, 0);

  return (
    <section id="reviews" className="scroll-mt-24 max-w-[1400px] mx-auto px-4 sm:px-6 py-12">
      <div className="text-center max-w-2xl mx-auto mb-8">
        <h2 className="text-3xl sm:text-4xl font-bold text-brand-green-800">
          {totalReviews > 0 ? `Over ${totalReviews.toLocaleString('en-IN')}+ People Trust Luminary` : 'What Our Customers Say'}
        </h2>
        <p className="text-sm text-slate-600 mt-2">
          Authentic fragrances, Ayurvedic care and smart lifestyle products, chosen by customers across India.
        </p>
      </div>

      {reviews.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {reviews.map((rev) => {
            const product = products.find((p) => p.id === rev.productId);
            return (
              <figure key={rev.id} className="bg-white rounded-2xl border border-stone-200 p-6 flex flex-col gap-4">
                <Quote className="w-7 h-7 text-brand-orange-500/60" />
                <div className="flex text-amber-500">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <Star key={s} className={`w-4 h-4 ${s <= rev.rating ? 'fill-current' : 'text-stone-300'}`} />
                  ))}
                </div>
                <div>
                  <h3 className="font-semibold text-slate-900 text-[15px]">{rev.title}</h3>
                  <blockquote className="text-sm text-slate-600 leading-relaxed mt-1 line-clamp-5">“{rev.content}”</blockquote>
                </div>
                <figcaption className="mt-auto pt-3 border-t border-stone-100 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <div className="text-sm font-semibold text-slate-900 truncate">{rev.author}</div>
                    <div className="text-xs text-slate-500 truncate">
                      {rev.location}
                      {product ? ` · ${product.name}` : ''}
                    </div>
                  </div>
                  {rev.verified && (
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-brand-green-700 shrink-0">
                      <BadgeCheck className="w-4 h-4" /> Verified
                    </span>
                  )}
                </figcaption>
              </figure>
            );
          })}
        </div>
      )}

      <div className="text-center mt-8">
        <button
          onClick={onWriteReview}
          className="px-6 py-3 rounded-full bg-brand-green-700 hover:bg-brand-green-800 text-white text-sm font-semibold transition"
        >
          Write a review
        </button>
      </div>
    </section>
  );
};
