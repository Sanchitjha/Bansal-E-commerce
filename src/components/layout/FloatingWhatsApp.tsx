'use client';

import React from 'react';
import { useLuminary } from '@/context/LuminaryContext';
import { WhatsAppIcon } from '@/components/ui/WhatsAppIcon';

/** The green WhatsApp button that stays in the bottom-right corner of every store page. */
export const FloatingWhatsApp: React.FC = () => {
  const { settings } = useLuminary();
  const number = settings.whatsAppNumber.replace(/\D/g, '');
  if (!number) return null;

  const text = encodeURIComponent('Hello Luminary, I would like to know more about your products.');

  return (
    <a
      href={`https://wa.me/${number}?text=${text}`}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Chat with us on WhatsApp"
      title="Chat with us on WhatsApp"
      className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-40 w-14 h-14 rounded-full bg-[#25D366] hover:bg-[#1ebe5a] text-white flex items-center justify-center shadow-lg shadow-black/25 hover:scale-105 transition"
    >
      <WhatsAppIcon className="w-8 h-8" />
    </a>
  );
};
