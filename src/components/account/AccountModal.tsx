'use client';

import React, { useState } from 'react';
import { X, User, LogOut, FileText, Package } from 'lucide-react';
import { useLuminary } from '@/context/LuminaryContext';

interface AccountModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const input =
  'w-full px-3.5 py-2.5 text-sm bg-stone-50 border border-stone-200 focus:border-brand-green-600 rounded-xl text-slate-900 placeholder-slate-400 outline-none';
const label = 'block text-xs font-semibold text-slate-600 mb-1';

const STATUS_STYLE: Record<string, string> = {
  Delivered: 'bg-emerald-100 text-emerald-700',
  Cancelled: 'bg-rose-100 text-rose-700',
  Refunded: 'bg-rose-100 text-rose-700',
  Returned: 'bg-rose-100 text-rose-700',
};

export const AccountModal: React.FC<AccountModalProps> = ({ isOpen, onClose }) => {
  const { customer, customerOrders, customerLogin, customerRegister, customerLogout, formatPrice } = useLuminary();
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '' });
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  if (!isOpen) return null;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setBusy(true);
    const res =
      mode === 'login'
        ? await customerLogin(form.email, form.password)
        : await customerRegister({ name: form.name, email: form.email, phone: form.phone, password: form.password });
    setBusy(false);
    if (!res.success) setError(res.message ?? 'Something went wrong');
    else setForm({ name: '', email: '', phone: '', password: '' });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl my-8 animate-fade-in">
        <div className="p-6 border-b border-stone-200 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-brand-green-50 text-brand-green-700 flex items-center justify-center">
              <User className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900">{customer ? `Hi, ${customer.name.split(' ')[0]}` : 'My Account'}</h3>
              <p className="text-xs text-slate-500">{customer ? customer.email : 'Sign in to see your orders'}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-stone-100 text-slate-500" aria-label="Close">
            <X className="w-5 h-5" />
          </button>
        </div>

        {customer ? (
          <div className="p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Package className="w-4 h-4 text-brand-green-700" /> Your orders
              </h4>
              <button
                onClick={() => customerLogout()}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-rose-600"
              >
                <LogOut className="w-3.5 h-3.5" /> Sign out
              </button>
            </div>

            {customerOrders.length === 0 ? (
              <p className="text-sm text-slate-500 py-8 text-center">You have not placed any orders while signed in yet.</p>
            ) : (
              <ul className="space-y-3 max-h-[50vh] overflow-y-auto pr-1">
                {customerOrders.map((o) => (
                  <li key={o.id} className="border border-stone-200 rounded-2xl p-4 text-sm space-y-2">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="font-mono font-semibold text-slate-900">{o.id}</div>
                        <div className="text-xs text-slate-500">{new Date(o.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</div>
                      </div>
                      <span className={`px-2.5 py-1 rounded-full text-[11px] font-semibold ${STATUS_STYLE[o.orderStatus] ?? 'bg-amber-100 text-amber-700'}`}>
                        {o.orderStatus}
                      </span>
                    </div>
                    <div className="text-xs text-slate-600">
                      {o.items.map((i) => `${i.productName} × ${i.quantity}`).join(', ')}
                    </div>
                    <div className="flex items-center justify-between pt-1">
                      <span className="font-bold text-slate-900">{formatPrice(o.totalAmount)}</span>
                      <div className="flex items-center gap-3 text-xs font-semibold">
                        {o.courier || o.trackingNumber ? (
                          <span className="text-slate-500">
                            {o.courier} {o.trackingNumber}
                          </span>
                        ) : null}
                        {o.accessToken && (
                          <a
                            href={`/invoice/${encodeURIComponent(o.id)}?t=${o.accessToken}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-brand-green-700 hover:underline"
                          >
                            <FileText className="w-3.5 h-3.5" /> Invoice
                          </a>
                        )}
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        ) : (
          <form onSubmit={submit} className="p-6 space-y-4">
            <div className="grid grid-cols-2 gap-2 p-1 bg-stone-100 rounded-full text-sm font-semibold">
              {(['login', 'register'] as const).map((m) => (
                <button
                  type="button"
                  key={m}
                  onClick={() => {
                    setMode(m);
                    setError(null);
                  }}
                  className={`py-2 rounded-full transition ${mode === m ? 'bg-white shadow text-brand-green-800' : 'text-slate-500'}`}
                >
                  {m === 'login' ? 'Sign in' : 'Create account'}
                </button>
              ))}
            </div>

            {mode === 'register' && (
              <>
                <div>
                  <label className={label}>Full name</label>
                  <input required className={input} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} autoComplete="name" />
                </div>
                <div>
                  <label className={label}>Mobile number</label>
                  <input
                    required
                    type="tel"
                    inputMode="numeric"
                    placeholder="10-digit mobile"
                    className={input}
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    autoComplete="tel"
                  />
                </div>
              </>
            )}

            <div>
              <label className={label}>Email</label>
              <input required type="email" className={input} value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} autoComplete="email" />
            </div>
            <div>
              <label className={label}>Password {mode === 'register' && <span className="font-normal text-slate-400">(min 8 characters)</span>}</label>
              <input
                required
                type="password"
                minLength={mode === 'register' ? 8 : undefined}
                className={input}
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
              />
            </div>

            {error && <p className="text-sm text-rose-600 font-medium">{error}</p>}

            <button
              type="submit"
              disabled={busy}
              className="w-full py-3 rounded-full bg-brand-orange-500 hover:bg-brand-orange-600 text-white font-bold text-sm transition disabled:opacity-60"
            >
              {busy ? 'Please wait...' : mode === 'login' ? 'Sign in' : 'Create account'}
            </button>
            <p className="text-xs text-slate-500 text-center">You can also check out as a guest, without an account.</p>
          </form>
        )}
      </div>
    </div>
  );
};
