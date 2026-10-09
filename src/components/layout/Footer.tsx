'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Phone, Mail, MapPin, MessageCircle, Instagram, Facebook, Youtube } from 'lucide-react';
import { useLuminary } from '@/context/LuminaryContext';
import { POLICY_LINKS } from '@/lib/policies';
import { CATEGORY_PAGES, collectionHref, resolveCollection } from '@/lib/collections';

interface FooterProps {
  onOpenAdmin: () => void;
  onOpenBulkModal: () => void;
  onOpenTrackOrder: () => void;
  onOpenReviewModal: () => void;
}

export const Footer: React.FC<FooterProps> = ({ onOpenAdmin, onOpenBulkModal, onOpenTrackOrder, onOpenReviewModal }) => {
  const { settings, products } = useLuminary();
  const [email, setEmail] = useState('');
  const [signup, setSignup] = useState<{ state: 'idle' | 'busy' | 'done' | 'error'; message?: string }>({ state: 'idle' });

  const openWhatsApp = () => {
    const text = encodeURIComponent('Hello Luminary Team, I would like to enquire about your products.');
    window.open(`https://wa.me/${settings.whatsAppNumber}?text=${text}`, '_blank');
  };

  const subscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    setSignup({ state: 'busy' });
    try {
      const res = await fetch('/api/newsletter', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email }) });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body.error || 'Could not subscribe. Please try again.');
      setSignup({ state: 'done', message: body.message || 'Thank you for subscribing!' });
      setEmail('');
    } catch (err) {
      setSignup({ state: 'error', message: err instanceof Error ? err.message : 'Could not subscribe.' });
    }
  };

  const has = (slug: string) => (resolveCollection(slug, products)?.products.length ?? 0) > 0;
  const shopLinks = [
    ...CATEGORY_PAGES.filter((c) => has(c.slug)).map((c) => ({ label: c.title, href: collectionHref(c.slug) })),
    ...(has('gift-sets') ? [{ label: 'Gift sets', href: collectionHref('gift-sets') }] : []),
    ...(has('attars') ? [{ label: 'Attars', href: collectionHref('attars') }] : []),
    { label: 'Best sellers', href: collectionHref('best-sellers') },
    ...(has('new-arrivals') ? [{ label: 'New arrivals', href: collectionHref('new-arrivals') }] : []),
  ];

  const socials = [
    { label: 'Instagram', href: settings.instagramUrl, icon: Instagram },
    { label: 'Facebook', href: settings.facebookUrl, icon: Facebook },
    { label: 'YouTube', href: settings.youtubeUrl, icon: Youtube },
  ].filter((s) => !!s.href);

  const heading = 'text-sm font-bold text-slate-900 mb-4';
  const link = 'block text-left text-sm text-slate-600 hover:text-brand-green-700 transition py-1';

  return (
    <footer className="w-full max-w-[1400px] mx-auto px-4 sm:px-6 pb-8">
      <div className="bg-brand-sage rounded-3xl px-6 sm:px-10 pt-10 pb-6">
        <div className="pb-8 mb-8 border-b border-stone-300/70 flex flex-col lg:flex-row lg:items-center justify-between gap-5">
          <div>
            <h3 className="text-xl font-bold text-brand-green-900">Join the Luminary list</h3>
            <p className="text-sm text-slate-600 mt-1">New launches, offers and fragrance tips. No spam, unsubscribe any time.</p>
          </div>
          <form onSubmit={subscribe} className="w-full lg:max-w-md" noValidate>
            <div className="flex">
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Your email address"
                aria-label="Email address"
                className="flex-1 min-w-0 px-4 py-3 text-sm bg-white border border-stone-300 border-r-0 outline-none focus:border-black"
              />
              <button
                type="submit"
                disabled={signup.state === 'busy'}
                className="px-6 py-3 bg-black hover:bg-brand-green-800 text-white text-[12px] font-semibold uppercase tracking-[0.16em] transition disabled:opacity-60"
              >
                {signup.state === 'busy' ? 'Please wait' : 'Subscribe'}
              </button>
            </div>
            {signup.state === 'done' && <p className="text-xs text-brand-green-700 font-medium mt-2">{signup.message}</p>}
            {signup.state === 'error' && <p className="text-xs text-rose-600 font-medium mt-2">{signup.message}</p>}
          </form>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-8">
          <div>
            <h4 className={heading}>Shop</h4>
            {shopLinks.map((l) => (
              <Link key={l.href} href={l.href} className={link}>
                {l.label}
              </Link>
            ))}
          </div>

          <div>
            <h4 className={heading}>Your Account</h4>
            <button className={link} onClick={onOpenTrackOrder}>Track Order</button>
            <button className={link} onClick={onOpenReviewModal}>Write a review</button>
            <button className={link} onClick={onOpenBulkModal}>Bulk Enquiry</button>
            <button className={link} onClick={onOpenAdmin}>Admin Login</button>
          </div>

          <div>
            <h4 className={heading}>Policies</h4>
            {POLICY_LINKS.map((l) => (
              <a key={l.slug} href={`/policies/${l.slug}`} className={link}>
                {l.label}
              </a>
            ))}
          </div>

          <div className="col-span-2 md:col-span-1 lg:col-span-2">
            <h4 className={heading}>Get in Touch</h4>
            <div className="space-y-2.5 text-sm text-slate-600">
              {settings.contactPhone && (
                <a href={`tel:${settings.contactPhone.replace(/\s/g, '')}`} className="flex items-center gap-2.5 hover:text-brand-green-700">
                  <Phone className="w-4 h-4 text-brand-green-700 shrink-0" />
                  {settings.contactPhone}
                </a>
              )}
              {settings.contactEmail && (
                <a href={`mailto:${settings.contactEmail}`} className="flex items-center gap-2.5 hover:text-brand-green-700 break-all">
                  <Mail className="w-4 h-4 text-brand-green-700 shrink-0" />
                  {settings.contactEmail}
                </a>
              )}
              {settings.address && (
                <p className="flex items-start gap-2.5">
                  <MapPin className="w-4 h-4 text-brand-green-700 shrink-0 mt-0.5" />
                  {settings.address}
                </p>
              )}
              <div className="flex flex-wrap items-center gap-3 pt-2">
                <button
                  onClick={openWhatsApp}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-brand-green-700 hover:bg-brand-green-800 text-white text-sm font-semibold transition"
                >
                  <MessageCircle className="w-4 h-4" /> Chat on WhatsApp
                </button>
                {socials.map(({ label, href, icon: Icon }) => (
                  <a
                    key={label}
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={label}
                    className="w-9 h-9 rounded-full border border-stone-400 flex items-center justify-center text-slate-700 hover:bg-black hover:border-black hover:text-white transition"
                  >
                    <Icon className="w-4 h-4" />
                  </a>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="mt-8 pt-5 border-t border-stone-300/70 text-center text-xs text-slate-500">
          © {new Date().getFullYear()} {settings.legalName || 'Luminary'}. All rights reserved.
        </div>
      </div>
    </footer>
  );
};
