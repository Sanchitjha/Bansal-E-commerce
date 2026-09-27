'use client';

import React, { useState } from 'react';
import {
  MessageCircle,
  Truck,
  ShieldCheck,
  Award,
  RefreshCw,
  Send,
  Lock,
  Phone,
  MapPin,
} from 'lucide-react';
import { useLuminary } from '@/context/LuminaryContext';

interface FooterProps {
  onOpenAdmin: () => void;
  onOpenBulkModal: () => void;
}

export const Footer: React.FC<FooterProps> = ({ onOpenAdmin, onOpenBulkModal }) => {
  const { settings, setActiveCategoryFilter } = useLuminary();
  const [emailInput, setEmailInput] = useState('');
  const [subscribed, setSubscribed] = useState(false);

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (emailInput.trim()) {
      setSubscribed(true);
      setEmailInput('');
      setTimeout(() => setSubscribed(false), 4000);
    }
  };

  const handleWhatsAppClick = () => {
    const text = encodeURIComponent('Hello Luminary Team, I would like to enquire about your luxury products and bulk orders.');
    window.open(`https://wa.me/${settings.whatsAppNumber}?text=${text}`, '_blank');
  };

  return (
    <footer className="relative bg-slate-900 dark:bg-obsidian-950 border-t border-amber-500/20 text-slate-200 dark:text-slate-300 pt-16 pb-12 overflow-hidden transition-colors duration-300">
      {/* Background Subtle Ambient Glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-32 bg-amber-500/10 blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Trust Value Badges Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 pb-12 border-b border-slate-800">
          <div className="flex items-center gap-3.5 p-4 rounded-xl bg-slate-800/80 dark:bg-obsidian-900/60 border border-slate-700/80 dark:border-slate-800/80">
            <div className="p-3 rounded-lg bg-amber-500/15 text-amber-400 border border-amber-500/30">
              <Truck className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-slate-100">Free Express Delivery</h4>
              <p className="text-xs text-slate-400">On all orders above ₹999</p>
            </div>
          </div>

          <div className="flex items-center gap-3.5 p-4 rounded-xl bg-slate-800/80 dark:bg-obsidian-900/60 border border-slate-700/80 dark:border-slate-800/80">
            <div className="p-3 rounded-lg bg-amber-500/15 text-amber-400 border border-amber-500/30">
              <Award className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-slate-100">100% Authentic</h4>
              <p className="text-xs text-slate-400">Artisanal & certified pure</p>
            </div>
          </div>

          <div className="flex items-center gap-3.5 p-4 rounded-xl bg-slate-800/80 dark:bg-obsidian-900/60 border border-slate-700/80 dark:border-slate-800/80">
            <div className="p-3 rounded-lg bg-amber-500/15 text-amber-400 border border-amber-500/30">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-slate-100">Secure Payments</h4>
              <p className="text-xs text-slate-400">Razorpay, UPI & COD support</p>
            </div>
          </div>

          <div className="flex items-center gap-3.5 p-4 rounded-xl bg-slate-800/80 dark:bg-obsidian-900/60 border border-slate-700/80 dark:border-slate-800/80">
            <div className="p-3 rounded-lg bg-amber-500/15 text-amber-400 border border-amber-500/30">
              <RefreshCw className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-slate-100">Easy Returns</h4>
              <p className="text-xs text-slate-400">Hassle-free replacement policy</p>
            </div>
          </div>
        </div>

        {/* Main Footer Links */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-10 py-12 border-b border-slate-800">
          {/* Brand Col */}
          <div className="md:col-span-2 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-amber-500 to-yellow-300 p-[1px]">
                <div className="w-full h-full bg-slate-900 dark:bg-obsidian-950 rounded-full flex items-center justify-center font-serif text-lg font-bold text-amber-400">
                  L
                </div>
              </div>
              <span className="font-serif text-2xl font-bold tracking-widest text-slate-100 uppercase">
                LUMINARY
              </span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed max-w-sm font-medium">
              Luminary is India's premier multi-category luxury marketplace offering artisanal perfumes, authentic Kashmiri Ayurvedic elixirs, and state-of-the-art lifestyle gadgets.
            </p>
            <div className="pt-2 flex items-center gap-3 text-xs text-slate-300">
              <MapPin className="w-4 h-4 text-amber-400 shrink-0" />
              <span>{settings.address}</span>
            </div>
            <div className="flex items-center gap-3 text-xs text-slate-300">
              <Phone className="w-4 h-4 text-amber-400 shrink-0" />
              <span>{settings.contactPhone}</span>
            </div>
          </div>

          {/* Divisions */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-widest text-amber-400">Product Divisions</h4>
            <ul className="space-y-2 text-xs font-medium">
              <li>
                <button onClick={() => setActiveCategoryFilter('fragrance')} className="hover:text-amber-300 transition">
                  Luxury Perfumes & Attars
                </button>
              </li>
              <li>
                <button onClick={() => setActiveCategoryFilter('ayurvedic')} className="hover:text-amber-300 transition">
                  Kashmiri Kumkumadi Oils
                </button>
              </li>
              <li>
                <button onClick={() => setActiveCategoryFilter('gadgets')} className="hover:text-amber-300 transition">
                  Smart Mist Diffusers & Gadgets
                </button>
              </li>
              <li>
                <button onClick={onOpenBulkModal} className="text-amber-400 hover:text-amber-300 font-bold transition">
                  Wholesale & Bulk Orders (B2B)
                </button>
              </li>
            </ul>
          </div>

          {/* Business & Support */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-widest text-amber-400">Customer Support</h4>
            <ul className="space-y-2 text-xs font-medium">
              <li>
                <button onClick={onOpenBulkModal} className="hover:text-amber-300 transition">
                  Request Bulk Quotation
                </button>
              </li>
              <li>
                <a href="#catalog-section" className="hover:text-amber-300 transition">
                  Today's Best Deals
                </a>
              </li>
              <li>
                <button onClick={onOpenAdmin} className="text-slate-400 hover:text-amber-300 transition flex items-center gap-1 font-bold">
                  <Lock className="w-3 h-3 text-amber-400" />
                  <span>Admin Control Center</span>
                </button>
              </li>
            </ul>
          </div>

          {/* Newsletter / WhatsApp */}
          <div className="space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-widest text-amber-400">Concierge & VIP Offers</h4>
            <p className="text-xs text-slate-400 font-medium">
              Subscribe for private festive discounts & new product launches.
            </p>
            <form onSubmit={handleSubscribe} className="space-y-2">
              <div className="relative">
                <input
                  type="email"
                  required
                  placeholder="Enter your email address"
                  value={emailInput}
                  onChange={(e) => setEmailInput(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-800 dark:bg-obsidian-900 border border-slate-700 focus:border-amber-400 rounded text-slate-100 placeholder-slate-400 outline-none"
                />
                <button
                  type="submit"
                  className="absolute right-1 top-1 bottom-1 px-3 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 rounded text-xs font-bold flex items-center gap-1 transition"
                >
                  <Send className="w-3 h-3" />
                </button>
              </div>
              {subscribed && (
                <p className="text-[11px] text-emerald-400 font-bold animate-fade-in">
                  ✓ Thank you! You are now on our VIP Concierge list.
                </p>
              )}
            </form>

            <div className="pt-2">
              <button
                onClick={handleWhatsAppClick}
                className="w-full py-2 px-3 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/40 text-emerald-300 font-bold text-xs flex items-center justify-center gap-2 transition"
              >
                <MessageCircle className="w-4 h-4 text-emerald-400" />
                <span>Chat with us on WhatsApp</span>
              </button>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 flex flex-col md:flex-row items-center justify-between text-xs text-slate-400 gap-4 font-medium">
          <p>© {new Date().getFullYear()} LUMINARY FRAGRANCE • AYURVEDA • LIFESTYLE. All rights reserved.</p>
          <div className="flex items-center space-x-4 text-slate-400">
            <span>GST Registered</span>
            <span>•</span>
            <span>Indian Payment Gateway Integration</span>
            <span>•</span>
            <button onClick={onOpenAdmin} className="text-amber-400 hover:underline font-bold">
              Owner Dashboard
            </button>
          </div>
        </div>
      </div>

      {/* Floating WhatsApp Action Button */}
      <button
        onClick={handleWhatsAppClick}
        className="fixed bottom-6 right-6 z-30 p-3.5 rounded-full bg-emerald-500 text-white shadow-lg hover:bg-emerald-400 transition transform hover:scale-110 flex items-center justify-center border-2 border-emerald-300/40"
        title="Quick WhatsApp Support"
      >
        <MessageCircle className="w-6 h-6 fill-current" />
      </button>
    </footer>
  );
};
