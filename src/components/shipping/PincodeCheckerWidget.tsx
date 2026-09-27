'use client';

import React, { useState } from 'react';
import { MapPin, Truck, CheckCircle2, ShieldCheck, ArrowRight } from 'lucide-react';
import { useLuminary } from '@/context/LuminaryContext';

export const PincodeCheckerWidget: React.FC = () => {
  const { checkPincodeDelivery } = useLuminary();
  const [pincode, setPincode] = useState('');
  const [result, setResult] = useState<{ available: boolean; estimatedDays: string; courier: string; cod: boolean } | null>(null);

  const handleCheck = (e: React.FormEvent) => {
    e.preventDefault();
    if (pincode.trim()) {
      const res = checkPincodeDelivery(pincode);
      setResult(res);
    }
  };

  return (
    <div className="p-4 sm:p-6 rounded-2xl bg-white dark:bg-obsidian-900 border border-amber-500/30 shadow-md space-y-3 text-slate-900 dark:text-slate-100">
      <div className="flex items-center gap-2">
        <div className="p-2 rounded-lg bg-amber-500/15 text-amber-600 dark:text-gold-400 border border-amber-500/30">
          <Truck className="w-5 h-5" />
        </div>
        <div>
          <h4 className="font-serif font-bold text-sm">Check Pincode Express Delivery & COD</h4>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">Verify courier serviceability across 27,000+ Indian pincodes</p>
        </div>
      </div>

      <form onSubmit={handleCheck} className="flex gap-2">
        <div className="relative flex-1">
          <MapPin className="w-4 h-4 text-amber-500 absolute left-3 top-2.5" />
          <input
            type="text"
            maxLength={6}
            placeholder="Enter 6-digit Pincode (e.g. 400050)"
            value={pincode}
            onChange={(e) => setPincode(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 dark:bg-obsidian-950 border border-slate-300 dark:border-slate-800 focus:border-amber-500 rounded-xl text-slate-900 dark:text-slate-100 placeholder-slate-400 outline-none font-mono"
          />
        </div>
        <button
          type="submit"
          className="px-4 py-2 rounded-xl gold-gradient-bg text-slate-950 font-extrabold text-xs uppercase tracking-wider shadow-md hover:scale-105 transition"
        >
          Verify
        </button>
      </form>

      {result && (
        <div className="p-3 rounded-xl bg-slate-50 dark:bg-obsidian-950 border border-slate-200 dark:border-slate-800 text-xs space-y-1.5 animate-fade-in">
          {result.available ? (
            <div className="space-y-1">
              <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-bold">
                <CheckCircle2 className="w-4 h-4" />
                <span>Express Shipping Available for Pincode {pincode}!</span>
              </div>
              <div className="grid grid-cols-3 gap-2 text-[11px] text-slate-600 dark:text-slate-300 pt-1 font-medium">
                <div>
                  <span className="text-slate-400 block text-[9px]">Courier Partner</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">{result.courier}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[9px]">Est. Time</span>
                  <span className="font-bold text-amber-600 dark:text-gold-300">{result.estimatedDays}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[9px]">COD Option</span>
                  <span className="font-bold text-emerald-600 dark:text-emerald-400">✓ Available</span>
                </div>
              </div>
            </div>
          ) : (
            <p className="text-rose-500 font-bold">Invalid Pincode. Please enter a valid 6-digit Indian pincode.</p>
          )}
        </div>
      )}
    </div>
  );
};
