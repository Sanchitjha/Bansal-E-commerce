'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Search, ShoppingBag, Truck, User, Menu, X, ChevronDown, Leaf } from 'lucide-react';
import { useLuminary } from '@/context/LuminaryContext';
import { CategoryType } from '@/types';

interface HeaderProps {
  onOpenCart: () => void;
  onOpenBulkModal: () => void;
  onOpenTrackOrder: () => void;
  onOpenAdmin: () => void;
  onOpenSearch: () => void;
  onOpenQuiz: () => void;
  onOpenReviewModal: () => void;
}

const scrollToId = (id: string) => {
  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
};

export const Header: React.FC<HeaderProps> = ({
  onOpenCart,
  onOpenBulkModal,
  onOpenTrackOrder,
  onOpenAdmin,
  onOpenSearch,
  onOpenQuiz,
  onOpenReviewModal,
}) => {
  const { getCartTotals, setActiveCategoryFilter, settings } = useLuminary();
  const [openMenu, setOpenMenu] = useState<'category' | 'products' | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const navRef = useRef<HTMLElement>(null);
  const totals = getCartTotals();

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (navRef.current && !navRef.current.contains(e.target as Node)) setOpenMenu(null);
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  const goToCategory = (cat: CategoryType | 'all') => {
    setActiveCategoryFilter(cat);
    setOpenMenu(null);
    setMobileOpen(false);
    scrollToId('shop');
  };

  const goTo = (id: string) => {
    setOpenMenu(null);
    setMobileOpen(false);
    scrollToId(id);
  };

  const openConsult = () => {
    setMobileOpen(false);
    const text = encodeURIComponent('Hello Luminary, I would like an expert consultation.');
    window.open(`https://wa.me/${settings.whatsAppNumber}?text=${text}`, '_blank');
  };

  const navLink = 'text-sm font-medium text-slate-800 hover:text-brand-green-700 transition';
  const dropdown =
    'absolute left-0 top-full mt-3 min-w-[210px] rounded-2xl bg-white border border-stone-200 shadow-xl py-2 z-50';
  const dropdownItem =
    'block w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-brand-green-50 hover:text-brand-green-700 transition';

  return (
    <header className="sticky top-0 z-40 w-full bg-white border-b border-stone-200">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="lg:hidden p-2 -ml-2 text-slate-800"
            aria-label="Toggle navigation menu"
          >
            {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>

          <button onClick={() => goToCategory('all')} className="flex items-center gap-2.5" aria-label="Luminary home">
            <span className="w-10 h-10 rounded-lg bg-brand-orange-500 flex items-center justify-center text-white shadow-sm">
              <Leaf className="w-5 h-5" />
            </span>
            <span className="flex flex-col text-left leading-none">
              <span className="text-2xl font-bold tracking-tight text-brand-green-800">Luminary</span>
              <span className="text-[9px] font-semibold tracking-[0.18em] uppercase text-brand-orange-500 mt-1">
                Fragrance · Ayurveda · Lifestyle
              </span>
            </span>
          </button>
        </div>

        <nav ref={navRef} className="hidden lg:flex items-center gap-8">
          <div className="relative">
            <button
              onClick={() => setOpenMenu(openMenu === 'category' ? null : 'category')}
              className={`${navLink} flex items-center gap-1`}
            >
              Category <ChevronDown className="w-4 h-4" />
            </button>
            {openMenu === 'category' && (
              <div className={dropdown}>
                <button className={dropdownItem} onClick={() => goToCategory('all')}>All Products</button>
                <button className={dropdownItem} onClick={() => goToCategory('fragrance')}>Fragrances</button>
                <button className={dropdownItem} onClick={() => goToCategory('ayurvedic')}>Ayurvedic Care</button>
                <button className={dropdownItem} onClick={() => goToCategory('gadgets')}>Mini Gadgets</button>
              </div>
            )}
          </div>

          <div className="relative">
            <button
              onClick={() => setOpenMenu(openMenu === 'products' ? null : 'products')}
              className={`${navLink} flex items-center gap-1`}
            >
              Products <ChevronDown className="w-4 h-4" />
            </button>
            {openMenu === 'products' && (
              <div className={dropdown}>
                <button className={dropdownItem} onClick={() => goTo('bestsellers')}>Best Sellers</button>
                <button className={dropdownItem} onClick={() => goTo('categories')}>Shop by Categories</button>
                <button
                  className={dropdownItem}
                  onClick={() => {
                    setOpenMenu(null);
                    onOpenQuiz();
                  }}
                >
                  Find My Scent Quiz
                </button>
              </div>
            )}
          </div>

          <button className={navLink} onClick={() => goTo('deals')}>Bulk Deals</button>
          <button className={navLink} onClick={openConsult}>Consult an Expert</button>
          <button className={navLink} onClick={onOpenReviewModal}>Rewards</button>
          <button className={navLink} onClick={() => goTo('blog')}>Blog</button>
        </nav>

        <div className="flex items-center gap-2">
          <button
            onClick={onOpenTrackOrder}
            className="w-10 h-10 rounded-full border border-stone-200 flex items-center justify-center text-slate-700 hover:border-brand-green-600 hover:text-brand-green-700 transition"
            title="Track order"
            aria-label="Track order"
          >
            <Truck className="w-[18px] h-[18px]" />
          </button>
          <button
            onClick={onOpenSearch}
            className="w-10 h-10 rounded-full border border-stone-200 flex items-center justify-center text-slate-700 hover:border-brand-green-600 hover:text-brand-green-700 transition"
            title="Search"
            aria-label="Search"
          >
            <Search className="w-[18px] h-[18px]" />
          </button>
          <button
            onClick={onOpenAdmin}
            className="w-10 h-10 rounded-full border border-stone-200 flex items-center justify-center text-slate-700 hover:border-brand-green-600 hover:text-brand-green-700 transition"
            title="Admin sign in"
            aria-label="Admin sign in"
          >
            <User className="w-[18px] h-[18px]" />
          </button>
          <button
            onClick={onOpenCart}
            className="relative w-10 h-10 rounded-full border border-stone-200 flex items-center justify-center text-slate-700 hover:border-brand-green-600 hover:text-brand-green-700 transition"
            title="Cart"
            aria-label="Open cart"
          >
            <ShoppingBag className="w-[18px] h-[18px]" />
            <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-brand-orange-500 text-white text-[10px] font-bold flex items-center justify-center">
              {totals.itemCount}
            </span>
          </button>
        </div>
      </div>

      {mobileOpen && (
        <div className="lg:hidden border-t border-stone-200 bg-white px-4 py-4 space-y-1 max-h-[75vh] overflow-y-auto">
          <p className="px-2 pt-1 pb-1 text-[11px] font-bold uppercase tracking-wider text-slate-400">Categories</p>
          <button className={dropdownItem} onClick={() => goToCategory('all')}>All Products</button>
          <button className={dropdownItem} onClick={() => goToCategory('fragrance')}>Fragrances</button>
          <button className={dropdownItem} onClick={() => goToCategory('ayurvedic')}>Ayurvedic Care</button>
          <button className={dropdownItem} onClick={() => goToCategory('gadgets')}>Mini Gadgets</button>
          <div className="h-px bg-stone-200 my-2" />
          <button className={dropdownItem} onClick={() => goTo('bestsellers')}>Best Sellers</button>
          <button
            className={dropdownItem}
            onClick={() => {
              setMobileOpen(false);
              onOpenQuiz();
            }}
          >
            Find My Scent Quiz
          </button>
          <button className={dropdownItem} onClick={() => goTo('deals')}>Bulk Deals</button>
          <button
            className={dropdownItem}
            onClick={() => {
              setMobileOpen(false);
              onOpenBulkModal();
            }}
          >
            Request Bulk Quote
          </button>
          <button className={dropdownItem} onClick={openConsult}>Consult an Expert</button>
          <button
            className={dropdownItem}
            onClick={() => {
              setMobileOpen(false);
              onOpenReviewModal();
            }}
          >
            Rewards
          </button>
          <button className={dropdownItem} onClick={() => goTo('blog')}>Blog</button>
        </div>
      )}
    </header>
  );
};
