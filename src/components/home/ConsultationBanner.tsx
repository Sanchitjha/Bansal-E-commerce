'use client';

import React from 'react';
import { ArrowRight } from 'lucide-react';
import { useLuminary } from '@/context/LuminaryContext';

export const ConsultationBanner: React.FC = () => {
  const { settings } = useLuminary();

  const book = () => {
    const text = encodeURIComponent('Hello Luminary, I would like to book an expert consultation.');
    window.open(`https://wa.me/${settings.whatsAppNumber}?text=${text}`, '_blank');
  };

  return (
    <section id="consult" className="scroll-mt-24 max-w-[1400px] mx-auto px-4 sm:px-6 pb-12">
      <div className="bg-brand-mint rounded-3xl px-6 sm:px-10 py-8 flex flex-col sm:flex-row sm:items-center justify-between gap-5">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-brand-green-900">Expert Consultation from Our Specialists</h2>
          <p className="text-sm text-slate-500 mt-1">Mon–Sat, 10am to 6pm · Available in Hindi & English</p>
        </div>
        <button
          onClick={book}
          className="inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-full bg-brand-orange-500 hover:bg-brand-orange-600 text-white text-sm font-bold transition shrink-0"
        >
          Book Consultation <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </section>
  );
};
