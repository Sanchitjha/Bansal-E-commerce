'use client';

import React, { useEffect, useState } from 'react';
import { CheckCircle2, XCircle } from 'lucide-react';
import { useLuminary } from '@/context/LuminaryContext';
import { INDIAN_STATES } from '@/lib/india';
import { btnGold, card, errText, errorBox, inputCls, labelCls, okBox } from '../ui';

interface Status {
  razorpay: boolean;
  razorpayWebhook: boolean;
  email: boolean;
  emailSandbox?: boolean;
  mediaUpload: boolean;
  siteUrl: string;
}

const Dot: React.FC<{ ok: boolean; label: string; hint: string }> = ({ ok, label, hint }) => (
  <li className="flex items-start gap-2.5 text-xs">
    {ok ? <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" /> : <XCircle className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />}
    <div>
      <div className={`font-semibold ${ok ? 'text-slate-100' : 'text-slate-300'}`}>{label}: {ok ? 'connected' : 'not connected'}</div>
      {!ok && <div className="text-slate-500">{hint}</div>}
    </div>
  </li>
);

export const SettingsTab: React.FC = () => {
  const { settings, updateSettings, changeAdminPassword, showToast } = useLuminary();
  const [f, setF] = useState({ ...settings, blockedPincodes: settings.blockedPincodes.split(',').filter(Boolean).join(', ') });
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<Status | null>(null);

  const [pw, setPw] = useState({ current: '', next: '', confirm: '' });
  const [pwMsg, setPwMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [pwBusy, setPwBusy] = useState(false);

  useEffect(() => {
    fetch('/api/admin/status')
      .then((r) => (r.ok ? r.json() : null))
      .then(setStatus)
      .catch(() => {});
  }, []);

  const set = <K extends keyof typeof f>(key: K, value: (typeof f)[K]) => setF((p) => ({ ...p, [key]: value }));

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSaving(true);
    try {
      await updateSettings({ ...f, blockedPincodes: f.blockedPincodes });
      showToast('Settings saved', 'success');
    } catch (err) {
      setError(errText(err));
    } finally {
      setSaving(false);
    }
  };

  const changePw = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwMsg(null);
    if (pw.next !== pw.confirm) return setPwMsg({ ok: false, text: 'The new passwords do not match.' });
    setPwBusy(true);
    const res = await changeAdminPassword(pw.current, pw.next);
    setPwBusy(false);
    if (res.success) {
      setPw({ current: '', next: '', confirm: '' });
      setPwMsg({ ok: true, text: 'Password changed.' });
    } else {
      setPwMsg({ ok: false, text: res.message ?? 'Could not change the password.' });
    }
  };

  return (
    <div className="space-y-6">
      <form onSubmit={save} className="space-y-6">
        <section className={`${card} p-5 space-y-4`}>
          <h3 className="font-serif text-base font-bold text-gold-400">Store details</h3>
          <div className="grid sm:grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>Store name</label>
              <input className={inputCls} value={f.websiteName} onChange={(e) => set('websiteName', e.target.value)} />
            </div>
            <div>
              <label className={labelCls}>Registered business name (for invoices)</label>
              <input className={inputCls} value={f.legalName} onChange={(e) => set('legalName', e.target.value)} />
            </div>
            <div>
              <label className={labelCls}>Phone</label>
              <input className={inputCls} value={f.contactPhone} onChange={(e) => set('contactPhone', e.target.value)} />
            </div>
            <div>
              <label className={labelCls}>Support email (order alerts are sent here too)</label>
              <input type="email" className={inputCls} value={f.contactEmail} onChange={(e) => set('contactEmail', e.target.value)} />
            </div>
            <div>
              <label className={labelCls}>WhatsApp number (with country code, digits only)</label>
              <input className={`${inputCls} font-mono`} value={f.whatsAppNumber} onChange={(e) => set('whatsAppNumber', e.target.value)} placeholder="919876543210" />
            </div>
            <div className="sm:col-span-2">
              <label className={labelCls}>Business address</label>
              <textarea rows={2} className={inputCls} value={f.address} onChange={(e) => set('address', e.target.value)} />
            </div>
          </div>
        </section>

        <section className={`${card} p-5 space-y-4`}>
          <div>
            <h3 className="font-serif text-base font-bold text-gold-400">Social media</h3>
            <p className="text-xs text-slate-400">Full page links. Icons appear in the website footer only for the links you fill in.</p>
          </div>
          <div className="grid sm:grid-cols-3 gap-3">
            <div>
              <label className={labelCls}>Instagram</label>
              <input className={inputCls} value={f.instagramUrl ?? ''} onChange={(e) => set('instagramUrl', e.target.value)} placeholder="https://instagram.com/…" />
            </div>
            <div>
              <label className={labelCls}>Facebook</label>
              <input className={inputCls} value={f.facebookUrl ?? ''} onChange={(e) => set('facebookUrl', e.target.value)} placeholder="https://facebook.com/…" />
            </div>
            <div>
              <label className={labelCls}>YouTube</label>
              <input className={inputCls} value={f.youtubeUrl ?? ''} onChange={(e) => set('youtubeUrl', e.target.value)} placeholder="https://youtube.com/@…" />
            </div>
          </div>
        </section>

        <section className={`${card} p-5 space-y-4`}>
          <h3 className="font-serif text-base font-bold text-gold-400">Tax & shipping</h3>
          <div className="grid sm:grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>Your business state</label>
              <select className={inputCls} value={f.sellerState} onChange={(e) => set('sellerState', e.target.value)}>
                {INDIAN_STATES.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
              <p className="text-[10px] text-slate-500 mt-1">Same-state orders get CGST + SGST; other states get IGST.</p>
            </div>
            <div>
              <label className={labelCls}>GSTIN</label>
              <input className={`${inputCls} font-mono uppercase`} maxLength={15} value={f.gstin} onChange={(e) => set('gstin', e.target.value.toUpperCase())} placeholder="27ABCDE1234F1Z5" />
              <p className="text-[10px] text-slate-500 mt-1">Printed on invoices. Leave empty if you are not GST registered.</p>
            </div>
            <div>
              <label className={labelCls}>Free delivery above (₹)</label>
              <input type="number" min="0" className={`${inputCls} font-mono`} value={f.freeShippingThreshold} onChange={(e) => set('freeShippingThreshold', Number(e.target.value))} />
            </div>
            <div>
              <label className={labelCls}>Delivery charge below that (₹)</label>
              <input type="number" min="0" className={`${inputCls} font-mono`} value={f.defaultShippingCharge} onChange={(e) => set('defaultShippingCharge', Number(e.target.value))} />
            </div>
            <div>
              <label className={labelCls}>Default low-stock alert level</label>
              <input type="number" min="0" className={`${inputCls} font-mono`} value={f.lowStockAlertThreshold} onChange={(e) => set('lowStockAlertThreshold', Number(e.target.value))} />
            </div>
          </div>
        </section>

        <section className={`${card} p-5 space-y-4`}>
          <h3 className="font-serif text-base font-bold text-gold-400">Delivery rules</h3>
          <label className="flex items-center gap-2 text-xs font-semibold text-slate-200">
            <input type="checkbox" className="accent-gold-400" checked={f.codEnabled} onChange={(e) => set('codEnabled', e.target.checked)} />
            Allow cash on delivery
          </label>
          <div>
            <label className={labelCls}>Pincodes we cannot deliver to (comma separated)</label>
            <textarea rows={2} className={`${inputCls} font-mono`} value={f.blockedPincodes} onChange={(e) => set('blockedPincodes', e.target.value)} placeholder="e.g. 194101, 744101" />
          </div>
        </section>

        {error && <p className={errorBox}>{error}</p>}
        <button type="submit" disabled={saving} className={btnGold}>{saving ? 'Saving…' : 'Save settings'}</button>
      </form>

      <section className={`${card} p-5 space-y-3`}>
        <h3 className="font-serif text-base font-bold text-gold-400">What is connected</h3>
        {status ? (
          <ul className="space-y-3">
            <Dot ok={status.razorpay} label="Online payments (Razorpay)" hint="Add RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET in Vercel, then redeploy. Until then customers can only choose cash on delivery." />
            <Dot ok={status.razorpayWebhook} label="Payment webhook" hint={`Create a Razorpay webhook to ${status.siteUrl}/api/payments/webhook for payment.captured, and add its secret as RAZORPAY_WEBHOOK_SECRET.`} />
            <Dot
              ok={status.email && !status.emailSandbox}
              label="Customer emails (order updates, sign-in codes)"
              hint={
                status.emailSandbox
                  ? 'Resend is connected in test mode: its test sender only reaches the Resend account owner. Verify your domain in Resend, then set EMAIL_FROM to an address on it. Until then customers get no emails and the email-code sign-in stays hidden.'
                  : 'Add RESEND_API_KEY and EMAIL_FROM in Vercel. Until then no emails are sent and the email-code sign-in stays hidden.'
              }
            />
            <Dot ok={status.mediaUpload} label="Image & video upload (Cloudinary)" hint="Add CLOUDINARY_URL (or CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET) in Vercel and redeploy. Until then paste image links." />
          </ul>
        ) : (
          <p className="text-xs text-slate-500">Checking…</p>
        )}
      </section>

      <form onSubmit={changePw} className={`${card} p-5 space-y-3`}>
        <h3 className="font-serif text-base font-bold text-gold-400">Change admin password</h3>
        <div className="grid sm:grid-cols-3 gap-3">
          <div>
            <label className={labelCls}>Current password</label>
            <input type="password" required autoComplete="current-password" className={inputCls} value={pw.current} onChange={(e) => setPw({ ...pw, current: e.target.value })} />
          </div>
          <div>
            <label className={labelCls}>New password (min 10 characters)</label>
            <input type="password" required minLength={10} autoComplete="new-password" className={inputCls} value={pw.next} onChange={(e) => setPw({ ...pw, next: e.target.value })} />
          </div>
          <div>
            <label className={labelCls}>Repeat new password</label>
            <input type="password" required minLength={10} autoComplete="new-password" className={inputCls} value={pw.confirm} onChange={(e) => setPw({ ...pw, confirm: e.target.value })} />
          </div>
        </div>
        {pwMsg && <p className={pwMsg.ok ? okBox : errorBox}>{pwMsg.text}</p>}
        <button type="submit" disabled={pwBusy} className={btnGold}>{pwBusy ? 'Changing…' : 'Change password'}</button>
      </form>
    </div>
  );
};
