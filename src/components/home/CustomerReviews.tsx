'use client';

import React from 'react';
import { Star, ShieldCheck, Quote } from 'lucide-react';

export const CustomerReviews: React.FC = () => {
  const reviews = [
    {
      id: 1,
      name: 'Princess Ananya Singh',
      location: 'Udaipur, Rajasthan',
      rating: 5,
      title: 'Hypnotic Oud & Unmatched Longevity',
      review:
        'The Royal Imperial Oud EDP is beyond divine. The richness of Assam Oud blended with velvet rose lasts for over 24 hours. The luxury glass packaging is fit for royalty.',
      verified: true,
      product: 'Royal Imperial Oud EDP',
    },
    {
      id: 2,
      name: 'Dr. Siddharth Vardhan',
      location: 'Bengaluru, Karnataka',
      rating: 5,
      title: 'Transformed My Night Skin Routine',
      review:
        'The 24K Gold Kumkumadi Night Elixir is the only authentic Ayurvedic serum that actually works without feeling greasy. Real gold flakes melt into skin seamlessly.',
      verified: true,
      product: 'Kumkumadi 24K Gold Elixir',
    },
    {
      id: 3,
      name: 'Kavita Subramaniam',
      location: 'Chennai, Tamil Nadu',
      rating: 5,
      title: 'Perfect Corporate & Bulk Gift Sets',
      review:
        'We ordered 150 custom boxed Velvet Rose gift sets for our corporate gala. Luminary concierge delivered on time with exquisite gold foil branding.',
      verified: true,
      product: 'Velvet Rose Gift Box',
    },
  ];

  return (
    <section className="py-16 bg-slate-50 dark:bg-obsidian-950 border-b border-slate-200 dark:border-slate-800 transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <span className="text-xs font-extrabold uppercase tracking-widest text-amber-600 dark:text-gold-400">
            VERIFIED BUYER TESTIMONIALS
          </span>
          <h2 className="font-serif text-3xl font-bold text-slate-900 dark:text-slate-100 mt-2">
            Loved By Luxury Connoisseurs
          </h2>
          <p className="text-xs text-slate-600 dark:text-slate-400 mt-2 font-medium">
            Over 12,000+ satisfied customers across India trust Luminary for artisanal elegance.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {reviews.map((rev) => (
            <div
              key={rev.id}
              className="p-6 rounded-2xl bg-white dark:bg-obsidian-900 border border-slate-200 dark:border-slate-800 hover:border-amber-500/40 transition shadow-md hover:shadow-xl flex flex-col justify-between space-y-4"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex text-amber-500">
                    {[...Array(rev.rating)].map((_, i) => (
                      <Star key={i} className="w-4 h-4 fill-current" />
                    ))}
                  </div>
                  <Quote className="w-6 h-6 text-amber-500/30" />
                </div>

                <h4 className="font-serif text-sm font-bold text-slate-900 dark:text-slate-100">"{rev.title}"</h4>
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed font-normal">{rev.review}</p>
              </div>

              <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs">
                <div>
                  <span className="font-bold text-slate-900 dark:text-slate-200 block">{rev.name}</span>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">{rev.location}</span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-extrabold flex items-center gap-1 justify-end">
                    <ShieldCheck className="w-3 h-3" /> Verified Buyer
                  </span>
                  <span className="text-[10px] text-amber-600 dark:text-gold-400 font-mono font-bold block">{rev.product}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
