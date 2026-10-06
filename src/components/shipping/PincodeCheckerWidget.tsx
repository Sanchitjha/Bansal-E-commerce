'use client';

import React, { useState } from 'react';
import { MapPin, Truck, CheckCircle2, XCircle } from 'lucide-react';

interface PincodeResult {
  valid: boolean;
  unverified?: boolean;
  available: boolean;
  cod: boolean;
  city?: string;
  state?: string;
  estimatedDays?: string;
  message?: string;
}

export const PincodeCheckerWidget: React.FC = () => {
  const [pincode, setPincode] = useState('');
  const [result, setResult] = useState<PincodeResult | null>(null);
  const [checked, setChecked] = useState('');
  const [loading, setLoading] = useState(false);
  const [failed, setFailed] = useState(false);

  const handleCheck = async (e: React.FormEvent) => {
    e.preventDefault();
    const code = pincode.trim();
    if (!code) return;

    setLoading(true);
    setFailed(false);
    try {
      const res = await fetch(`/api/pincode/${encodeURIComponent(code)}`);
      if (!res.ok) throw new Error('lookup failed');
      setResult(await res.json());
      setChecked(code);
    } catch {
      setResult(null);
      setFailed(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-5 sm:p-6 rounded-2xl bg-white border border-stone-200 shadow-sm space-y-3 text-slate-900">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-brand-green-50 text-brand-green-700 flex items-center justify-center">
          <Truck className="w-5 h-5" />
        </div>
        <div>
          <h4 className="font-bold text-sm">Check delivery & COD for your pincode</h4>
          <p className="text-xs text-slate-500">We check it against the India Post pincode directory</p>
        </div>
      </div>

      <form onSubmit={handleCheck} className="flex gap-2">
        <div className="relative flex-1">
          <MapPin className="w-4 h-4 text-brand-green-600 absolute left-3 top-3" />
          <input
            type="text"
            inputMode="numeric"
            maxLength={6}
            placeholder="Enter 6-digit pincode (e.g. 400050)"
            value={pincode}
            onChange={(e) => setPincode(e.target.value.replace(/\D/g, ''))}
            className="w-full pl-9 pr-3 py-2.5 text-sm bg-stone-50 border border-stone-200 focus:border-brand-green-600 rounded-xl text-slate-900 placeholder-slate-400 outline-none font-mono"
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="px-5 py-2.5 rounded-xl bg-brand-orange-500 hover:bg-brand-orange-600 text-white font-bold text-sm transition disabled:opacity-60"
        >
          {loading ? 'Checking...' : 'Check'}
        </button>
      </form>

      {failed && <p className="text-sm text-rose-600 font-medium">Could not check right now. Please try again.</p>}

      {result && (
        <div className="p-3.5 rounded-xl bg-stone-50 border border-stone-200 text-sm space-y-1.5">
          {result.valid && result.available ? (
            <>
              <div className="flex items-center gap-2 text-brand-green-700 font-semibold">
                <CheckCircle2 className="w-4 h-4" />
                <span>
                  We deliver to {checked}
                  {result.city ? ` (${result.city}${result.state ? `, ${result.state}` : ''})` : ''}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-3 text-xs text-slate-600 pt-1">
                <div>
                  <span className="block text-[10px] uppercase tracking-wide text-slate-400">Estimated delivery</span>
                  <span className="font-semibold text-slate-900">{result.estimatedDays}</span>
                </div>
                <div>
                  <span className="block text-[10px] uppercase tracking-wide text-slate-400">Cash on delivery</span>
                  <span className={`font-semibold ${result.cod ? 'text-brand-green-700' : 'text-slate-500'}`}>
                    {result.cod ? 'Available' : 'Not available'}
                  </span>
                </div>
              </div>
              {result.unverified && (
                <p className="text-[11px] text-slate-400">The pincode directory is busy, so we only checked the format.</p>
              )}
            </>
          ) : (
            <div className="flex items-center gap-2 text-rose-600 font-semibold">
              <XCircle className="w-4 h-4" />
              <span>{result.message || 'We could not find this pincode.'}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
