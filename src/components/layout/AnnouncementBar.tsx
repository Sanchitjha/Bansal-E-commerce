'use client';

import React, { useEffect, useState } from 'react';
import { useLuminary } from '@/context/LuminaryContext';

export const AnnouncementBar: React.FC = () => {
  const { settings } = useLuminary();
  const [current, setCurrent] = useState(0);

  const messages = [
    <>Free delivery on orders above ₹{settings.freeShippingThreshold.toLocaleString('en-IN')}</>,
    <>Cash on delivery available</>,
    <>
      Use code <span className="font-bold text-amber-300">FESTIVE20</span> for 20% off
    </>,
    <>Bulk orders: special pricing and GST invoice</>,
  ];

  // On a phone only one message fits, so they take turns.
  useEffect(() => {
    const timer = setInterval(() => setCurrent((c) => (c + 1) % 4), 3500);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="bg-brand-green-800 text-white text-[11px] sm:text-xs font-medium tracking-wide py-2 px-4">
      <div className="hidden sm:flex items-center justify-center gap-6 lg:gap-10">
        {messages.map((message, i) => (
          <React.Fragment key={i}>
            {i > 0 && <span className="w-1 h-1 rounded-full bg-white/40" aria-hidden />}
            <span>{message}</span>
          </React.Fragment>
        ))}
      </div>
      <div className="sm:hidden text-center" aria-live="polite">
        {messages[current]}
      </div>
    </div>
  );
};
