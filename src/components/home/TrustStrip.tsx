'use client';

import React from 'react';
import { Leaf, Truck, Lock, FileText } from 'lucide-react';
import { useLuminary } from '@/context/LuminaryContext';

/** One calm row of reasons to buy, shown once under the banner. */
export const TrustStrip: React.FC = () => {
  const { settings } = useLuminary();

  const items = [
    { icon: Leaf, title: 'Authentic & pure', sub: 'Quality-checked products' },
    { icon: Truck, title: 'Free delivery', sub: `On orders above ₹${settings.freeShippingThreshold.toLocaleString('en-IN')}` },
    { icon: Lock, title: 'Secure payments', sub: 'UPI, cards and cash on delivery' },
    { icon: FileText, title: 'GST invoice', sub: 'With every order' },
  ];

  return (
    <div className="bg-white border-b border-stone-200">
      <ul className="max-w-[1400px] mx-auto px-4 sm:px-6 py-5 grid grid-cols-2 lg:grid-cols-4 gap-x-6 gap-y-4">
        {items.map(({ icon: Icon, title, sub }) => (
          <li key={title} className="flex items-center gap-3 lg:justify-center">
            <Icon className="w-6 h-6 text-brand-green-700 shrink-0" />
            <div className="leading-tight">
              <div className="text-sm font-semibold text-slate-900">{title}</div>
              <div className="text-[11px] text-slate-500">{sub}</div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
};
