'use client';

import React from 'react';
import { PhoneCall, ArrowRight, Users } from 'lucide-react';

interface DealsAndBulkSectionProps {
  onOpenBulkModal: () => void;
}

export const DealsAndBulkSection: React.FC<DealsAndBulkSectionProps> = ({ onOpenBulkModal }) => {
  return (
    <section className="py-12 bg-slate-100 dark:bg-obsidian-950 border-b border-slate-200 dark:border-slate-800 transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="relative rounded-3xl overflow-hidden border border-amber-500/40 bg-white dark:bg-gradient-to-r dark:from-obsidian-900 dark:via-gold-950/40 dark:to-obsidian-900 p-8 md:p-12 shadow-xl">
          {/* Background Ambient Glow */}
          <div className="absolute top-0 right-0 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center relative z-10">
            {/* Left Info */}
            <div className="lg:col-span-7 space-y-4">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/15 border border-amber-500/40 text-amber-800 dark:text-gold-300 text-xs font-extrabold uppercase tracking-wider">
                <Users className="w-3.5 h-3.5 text-amber-600 dark:text-gold-400" />
                <span>LUMINARY B2B WHOLESALE & CORPORATE PORTAL</span>
              </div>

              <h2 className="font-serif text-3xl sm:text-4xl font-bold text-slate-900 dark:text-slate-100 leading-tight">
                Buying in Bulk? <br />
                <span className="gold-gradient-text">Get Tiered Wholesale Pricing</span>
              </h2>

              <p className="text-slate-600 dark:text-slate-300 text-xs sm:text-sm leading-relaxed max-w-xl font-medium">
                We supply luxury hotels, corporate gift programs, spa resorts, and boutique retailers. Enjoy custom quantity slabs, GST invoice tax credit, and dedicated account manager support.
              </p>

              {/* Sample Slabs Visual */}
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 pt-2 max-w-lg">
                <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-obsidian-950/80 border border-slate-200 dark:border-slate-800 text-center shadow-sm">
                  <p className="text-[10px] text-slate-500 font-extrabold uppercase">Retail</p>
                  <p className="text-xs font-bold text-slate-800 dark:text-slate-200">1 Piece</p>
                  <p className="text-[10px] text-amber-600 dark:text-gold-400 font-mono font-bold">Standard MRP</p>
                </div>
                <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-obsidian-950/80 border border-amber-500/40 text-center shadow-sm">
                  <p className="text-[10px] text-amber-600 dark:text-gold-400 font-extrabold uppercase">Tier 1</p>
                  <p className="text-xs font-bold text-amber-700 dark:text-gold-300">5+ Pieces</p>
                  <p className="text-[10px] text-amber-600 dark:text-gold-400 font-mono font-bold">Save 10%</p>
                </div>
                <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-obsidian-950/80 border border-amber-500/40 text-center shadow-sm">
                  <p className="text-[10px] text-amber-600 dark:text-gold-400 font-extrabold uppercase">Tier 2</p>
                  <p className="text-xs font-bold text-amber-700 dark:text-gold-300">25+ Pieces</p>
                  <p className="text-[10px] text-amber-600 dark:text-gold-400 font-mono font-bold">Save 20%</p>
                </div>
                <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-obsidian-950/80 border border-amber-500/50 text-center hidden sm:block shadow-sm">
                  <p className="text-[10px] text-amber-700 dark:text-amber-400 font-extrabold uppercase">Custom</p>
                  <p className="text-xs font-bold text-amber-800 dark:text-amber-300">100+ Pieces</p>
                  <p className="text-[10px] text-amber-600 dark:text-amber-400 font-mono font-bold">Custom Quote</p>
                </div>
              </div>
            </div>

            {/* Right Action Box */}
            <div className="lg:col-span-5 flex flex-col items-center lg:items-end space-y-4">
              <div className="p-6 rounded-2xl bg-slate-50 dark:bg-obsidian-950/90 border border-amber-500/30 w-full max-w-md space-y-4 shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-xl bg-amber-500/20 text-amber-600 dark:text-gold-400 border border-amber-500/30">
                    <PhoneCall className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">Need 50+ Units or Co-Branding?</h4>
                    <p className="text-xs text-slate-600 dark:text-slate-400 font-medium">Instant quotation within 2 business hours.</p>
                  </div>
                </div>

                <button
                  onClick={onOpenBulkModal}
                  className="w-full py-3.5 rounded-xl gold-gradient-bg text-slate-950 font-extrabold text-xs uppercase tracking-wider shadow-lg hover:scale-105 transition flex items-center justify-center gap-2 shimmer-btn"
                >
                  <span>[ REQUEST BULK QUOTE ]</span>
                  <ArrowRight className="w-4 h-4" />
                </button>

                <p className="text-[10px] text-center text-slate-500 font-medium">
                  GST Credit Invoice Available • Custom Velvet Packaging Options
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
