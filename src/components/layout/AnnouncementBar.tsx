'use client';

import React from 'react';
import { useLuminary } from '@/context/LuminaryContext';

export const AnnouncementBar: React.FC = () => {
  const { settings } = useLuminary();

  return (
    <div className="bg-brand-green-800 text-white text-center text-[11px] sm:text-xs font-medium tracking-wide py-2 px-4">
      Free delivery on orders above ₹{settings.freeShippingThreshold.toLocaleString('en-IN')} · Cash on delivery available · Use code{' '}
      <span className="font-bold text-amber-300">FESTIVE20</span> for 20% off
    </div>
  );
};
