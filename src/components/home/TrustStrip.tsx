'use client';

import React from 'react';
import { Leaf, Truck, Lock } from 'lucide-react';
import { useLuminary } from '@/context/LuminaryContext';

export const TrustStrip: React.FC = () => {
  const { settings } = useLuminary();

  const items = [
    { icon: Leaf, title: 'Authentic & Pure', sub: 'Quality-checked ingredients' },
    { icon: Truck, title: 'Free Delivery', sub: `On all orders above ₹${settings.freeShippingThreshold.toLocaleString('en-IN')}` },
    { icon: Lock, title: 'Secure Payments', sub: 'UPI, cards & COD available' },
  ];

  return (
    <div className="bg-brand-green-800 text-white overflow-hidden">
      <div className="flex w-max animate-marquee py-4">
        {[0, 1].map((dup) => (
          <div key={dup} className="flex items-center shrink-0" aria-hidden={dup === 1}>
            {[...items, ...items, ...items].map((item, i) => {
              const Icon = item.icon;
              return (
                <div key={i} className="flex items-center gap-3 px-8 border-r border-white/20">
                  <Icon className="w-6 h-6 text-amber-300 shrink-0" />
                  <div className="leading-tight">
                    <div className="text-sm font-semibold whitespace-nowrap">{item.title}</div>
                    <div className="text-[11px] text-white/70 whitespace-nowrap">{item.sub}</div>
                  </div>
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
};
