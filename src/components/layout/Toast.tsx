'use client';

import React from 'react';
import { AlertCircle, CheckCircle2, Info, X } from 'lucide-react';
import { useLuminary } from '@/context/LuminaryContext';

export const Toast: React.FC = () => {
  const { toast, dismissToast } = useLuminary();
  if (!toast) return null;

  const styles = {
    error: { box: 'bg-rose-50 border-rose-200 text-rose-800', icon: <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" /> },
    success: { box: 'bg-emerald-50 border-emerald-200 text-emerald-800', icon: <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" /> },
    info: { box: 'bg-white border-stone-200 text-slate-800', icon: <Info className="w-5 h-5 text-brand-green-700 shrink-0" /> },
  }[toast.type];

  return (
    <div className="fixed bottom-5 left-1/2 -translate-x-1/2 z-[70] w-[calc(100%-2rem)] max-w-md animate-fade-in" role="status" aria-live="polite">
      <div className={`flex items-start gap-3 rounded-2xl border px-4 py-3 shadow-xl ${styles.box}`}>
        {styles.icon}
        <p className="text-sm font-medium flex-1">{toast.message}</p>
        <button onClick={dismissToast} aria-label="Dismiss" className="opacity-60 hover:opacity-100">
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
