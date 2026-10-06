'use client';

import React from 'react';
import { Printer } from 'lucide-react';

export const PrintButton: React.FC = () => (
  <button
    onClick={() => window.print()}
    className="print:hidden inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-brand-green-700 hover:bg-brand-green-800 text-white text-sm font-semibold transition"
  >
    <Printer className="w-4 h-4" /> Print / Save as PDF
  </button>
);
