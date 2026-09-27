'use client';

import React, { useState } from 'react';
import { X, Sparkles, CheckCircle2, ArrowRight, RefreshCw, ShoppingBag } from 'lucide-react';
import { useLuminary } from '@/context/LuminaryContext';
import { Product } from '@/types';

interface FragranceQuizModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectProduct: (product: Product) => void;
}

export const FragranceQuizModal: React.FC<FragranceQuizModalProps> = ({
  isOpen,
  onClose,
  onSelectProduct,
}) => {
  if (!isOpen) return null;

  const { products, addToCart, formatPrice } = useLuminary();
  const [step, setStep] = useState(1);
  const [answers, setAnswers] = useState({
    occasion: '',
    notes: '',
    intensity: '',
  });
  const [recommendedProduct, setRecommendedProduct] = useState<Product | null>(null);

  const handleSelectOption = (key: 'occasion' | 'notes' | 'intensity', value: string) => {
    const updated = { ...answers, [key]: value };
    setAnswers(updated);

    if (step < 3) {
      setStep(step + 1);
    } else {
      // Calculate recommendation
      let match = products[0];
      if (updated.occasion.includes('Ayurveda') || updated.notes.includes('Saffron')) {
        match = products.find((p) => p.category === 'ayurvedic') || products[0];
      } else if (updated.occasion.includes('Gadgets') || updated.notes.includes('Ultrasonic')) {
        match = products.find((p) => p.category === 'gadgets') || products[0];
      } else {
        match = products.find((p) => p.category === 'fragrance') || products[0];
      }
      setRecommendedProduct(match);
      setStep(4);
    }
  };

  const handleReset = () => {
    setStep(1);
    setAnswers({ occasion: '', notes: '', intensity: '' });
    setRecommendedProduct(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-obsidian-950/85 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-xl bg-white dark:bg-obsidian-900 border border-amber-500/40 rounded-3xl p-6 sm:p-8 shadow-2xl animate-fade-in text-slate-900 dark:text-slate-100 my-8">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 transition"
        >
          <X className="w-5 h-5" />
        </button>

        {step <= 3 && (
          <div className="space-y-6">
            <div className="flex items-center gap-2 text-amber-600 dark:text-gold-400 font-extrabold text-xs uppercase tracking-widest">
              <Sparkles className="w-4 h-4" />
              <span>AI Signature Scent & Elixir Finder • Step {step} of 3</span>
            </div>

            <div className="w-full bg-slate-200 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
              <div
                className="h-full gold-gradient-bg transition-all duration-500 rounded-full"
                style={{ width: `${(step / 3) * 100}%` }}
              />
            </div>

            {step === 1 && (
              <div className="space-y-4">
                <h3 className="font-serif text-2xl font-bold">What is your primary occasion or goal?</h3>
                <div className="grid grid-cols-1 gap-3">
                  {[
                    { title: 'Royalty & Evening Formal', sub: 'Long lasting opulence for galas, weddings & dates' },
                    { title: 'Ayurvedic Radiance & Skin Glow', sub: '24k Gold Kashmiri Kesar facial revitalizer' },
                    { title: 'Smart Gadgets & Ambient Living', sub: 'App-controlled cold ultrasonic aromatherapy' },
                  ].map((opt) => (
                    <button
                      key={opt.title}
                      onClick={() => handleSelectOption('occasion', opt.title)}
                      className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 hover:border-amber-500 bg-slate-50 dark:bg-obsidian-950 text-left transition hover:-translate-y-0.5 shadow-sm group"
                    >
                      <h4 className="font-bold text-sm text-slate-900 dark:text-slate-100 group-hover:text-amber-600 dark:group-hover:text-gold-300">
                        {opt.title}
                      </h4>
                      <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 font-medium">{opt.sub}</p>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-4">
                <h3 className="font-serif text-2xl font-bold">Which scent or herbal note appeals to you most?</h3>
                <div className="grid grid-cols-1 gap-3">
                  {[
                    { title: 'Assam Aged Oud Wood & Damascus Rose', sub: 'Warm, spicy, resinous & hypnotic' },
                    { title: 'Kashmiri Organic Saffron & 24K Gold Leaf', sub: 'Pure herbal brightening & botanical soothing' },
                    { title: 'Ultrasonic Cold Aromatherapy Nebulizer', sub: 'Whisper quiet room diffusion gadget' },
                  ].map((opt) => (
                    <button
                      key={opt.title}
                      onClick={() => handleSelectOption('notes', opt.title)}
                      className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 hover:border-amber-500 bg-slate-50 dark:bg-obsidian-950 text-left transition hover:-translate-y-0.5 shadow-sm group"
                    >
                      <h4 className="font-bold text-sm text-slate-900 dark:text-slate-100 group-hover:text-amber-600 dark:group-hover:text-gold-300">
                        {opt.title}
                      </h4>
                      <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 font-medium">{opt.sub}</p>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="space-y-4">
                <h3 className="font-serif text-2xl font-bold">Choose your preferred format:</h3>
                <div className="grid grid-cols-1 gap-3">
                  {[
                    { title: 'Extrait de Parfum Spray / Pure Attar', titleSub: 'Concentrated 24h lasting formula' },
                    { title: 'Overnight Cell Regenerating Facial Serum', titleSub: 'Organic botanical elixir' },
                    { title: 'Smart App Connected Electronic Diffuser', titleSub: 'Utility gadget with RGB mood lighting' },
                  ].map((opt) => (
                    <button
                      key={opt.title}
                      onClick={() => handleSelectOption('intensity', opt.title)}
                      className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 hover:border-amber-500 bg-slate-50 dark:bg-obsidian-950 text-left transition hover:-translate-y-0.5 shadow-sm group"
                    >
                      <h4 className="font-bold text-sm text-slate-900 dark:text-slate-100 group-hover:text-amber-600 dark:group-hover:text-gold-300">
                        {opt.title}
                      </h4>
                      <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 font-medium">{opt.titleSub}</p>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Step 4: Recommended Result */}
        {step === 4 && recommendedProduct && (
          <div className="space-y-6 text-center animate-fade-in">
            <div className="w-16 h-16 rounded-full bg-amber-500/20 text-amber-600 dark:text-gold-400 border border-amber-500/40 flex items-center justify-center mx-auto shadow-md">
              <Sparkles className="w-8 h-8" />
            </div>

            <div>
              <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-extrabold text-xs uppercase tracking-wider border border-emerald-500/30">
                99% Match Recommended For You
              </span>
              <h3 className="font-serif text-2xl font-bold mt-2">{recommendedProduct.name}</h3>
              <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 max-w-sm mx-auto font-medium">
                {recommendedProduct.shortDescription}
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-obsidian-950 border border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <img src={recommendedProduct.images[0]} alt="" className="w-16 h-16 rounded-xl object-cover border border-slate-300 dark:border-slate-800" />
              <div className="text-right">
                <span className="text-xs text-slate-500 block">Retail Price</span>
                <span className="font-mono text-xl font-extrabold text-amber-600 dark:text-gold-300">
                  {formatPrice(recommendedProduct.sellingPrice)}
                </span>
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                onClick={handleReset}
                className="p-3 rounded-xl bg-slate-100 dark:bg-obsidian-950 border border-slate-300 dark:border-slate-800 text-xs font-bold flex items-center justify-center gap-1 hover:text-amber-600"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Retake Quiz</span>
              </button>

              <button
                onClick={() => {
                  addToCart(recommendedProduct, 1);
                  onClose();
                  onSelectProduct(recommendedProduct);
                }}
                className="flex-1 py-3.5 rounded-xl gold-gradient-bg text-slate-950 font-extrabold text-xs uppercase tracking-wider shadow-lg flex items-center justify-center gap-2 hover:scale-105 transition shimmer-btn"
              >
                <ShoppingBag className="w-4 h-4" />
                <span>ADD MATCH TO CART</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
