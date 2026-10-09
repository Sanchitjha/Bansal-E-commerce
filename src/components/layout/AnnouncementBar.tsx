'use client';

import React from 'react';
import { useLuminary } from '@/context/LuminaryContext';

/** A strip of offers that scrolls across the top of every page. It pauses while the mouse is over it. */
export const AnnouncementBar: React.FC = () => {
  const { settings } = useLuminary();

  const messages = [
    <>Free delivery on orders above ₹{settings.freeShippingThreshold.toLocaleString('en-IN')}</>,
    <>Cash on delivery available</>,
    <>
      Use code <span className="font-bold text-amber-300">FESTIVE20</span> for 20% off
    </>,
    <>Bulk orders: special pricing and GST invoice</>,
  ];

  // Each half repeats the messages a few times so it is always wider than the screen, which keeps the loop seamless.
  const half = (copy: number) => (
    <div className="flex items-center shrink-0" aria-hidden={copy === 1}>
      {[0, 1, 2].flatMap((round) =>
        messages.map((message, i) => (
          <React.Fragment key={`${round}-${i}`}>
            <span className="whitespace-nowrap px-6 sm:px-10">{message}</span>
            <span className="w-1 h-1 rounded-full bg-white/40 shrink-0" aria-hidden />
          </React.Fragment>
        ))
      )}
    </div>
  );

  return (
    <div className="group bg-brand-green-800 text-white text-[11px] sm:text-xs font-medium tracking-wide py-2 overflow-hidden" role="region" aria-label="Offers">
      <div className="flex w-max animate-marquee group-hover:[animation-play-state:paused] motion-reduce:animate-none" style={{ animationDuration: '55s' }}>
        {half(0)}
        {half(1)}
      </div>
    </div>
  );
};
