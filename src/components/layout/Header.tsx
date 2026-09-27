'use client';

import React, { useState } from 'react';
import {
  Search,
  ShoppingBag,
  Heart,
  ShieldCheck,
  Menu,
  X,
  PhoneCall,
  Sparkles,
  Package,
  Sun,
  Moon,
  Globe,
  Award,
} from 'lucide-react';
import { useLuminary } from '@/context/LuminaryContext';
import { CategoryType, CurrencyCode } from '@/types';

interface HeaderProps {
  onOpenCart: () => void;
  onOpenWishlist: () => void;
  onOpenBulkModal: () => void;
  onOpenTrackOrder: () => void;
  onOpenAdmin: () => void;
  onOpenSearch: () => void;
  onOpenQuiz: () => void;
  onOpenReviewModal: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenCart,
  onOpenWishlist,
  onOpenBulkModal,
  onOpenTrackOrder,
  onOpenAdmin,
  onOpenSearch,
  onOpenQuiz,
  onOpenReviewModal,
}) => {
  const {
    theme,
    toggleTheme,
    currency,
    setCurrency,
    formatPrice,
    cart,
    wishlist,
    activeCategoryFilter,
    setActiveCategoryFilter,
    getCartTotals,
  } = useLuminary();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const totals = getCartTotals();

  const handleCategoryClick = (cat: CategoryType | 'all') => {
    setActiveCategoryFilter(cat);
    setMobileMenuOpen(false);
    const elem = document.getElementById('catalog-section');
    if (elem) {
      elem.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-amber-500/20 bg-white/80 dark:bg-obsidian-950/90 backdrop-blur-md transition-colors duration-300">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-amber-500 via-amber-400 to-amber-600 dark:from-obsidian-950 dark:via-gold-900/40 dark:to-obsidian-950 border-b border-amber-500/20 px-4 py-1.5 text-center text-xs tracking-wider text-obsidian-950 dark:text-amber-200 font-medium">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="hidden md:flex items-center gap-2 text-obsidian-950 dark:text-gold-300/90 font-bold">
            <Sparkles className="w-3.5 h-3.5 text-obsidian-950 dark:text-gold-400 animate-pulse" />
            <span>LUXURY MULTI-CATEGORY MARKETPLACE</span>
          </div>
          <div className="mx-auto md:mx-0 flex items-center gap-1.5">
            <span className="font-bold text-obsidian-950 dark:text-gold-400">FESTIVE SALE:</span> Use code{' '}
            <span className="bg-obsidian-950 text-amber-300 dark:bg-gold-500/20 dark:text-gold-300 px-2 py-0.5 rounded border border-amber-400/40 font-mono font-bold">
              FESTIVE20
            </span>{' '}
            for 20% OFF! Free Express Delivery over ₹999.
          </div>
          <div className="hidden md:flex items-center gap-4 text-xs font-semibold">
            {/* Currency Selector */}
            <div className="flex items-center gap-1 bg-obsidian-950/10 dark:bg-gold-500/10 px-2 py-0.5 rounded border border-amber-500/30">
              <Globe className="w-3 h-3 text-obsidian-950 dark:text-gold-400" />
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value as CurrencyCode)}
                className="bg-transparent font-bold text-[11px] outline-none text-obsidian-950 dark:text-gold-300 cursor-pointer"
              >
                <option value="INR" className="text-slate-900">₹ INR</option>
                <option value="USD" className="text-slate-900">$ USD</option>
                <option value="EUR" className="text-slate-900">€ EUR</option>
                <option value="AED" className="text-slate-900">د.إ AED</option>
              </select>
            </div>

            <button
              onClick={onOpenTrackOrder}
              className="flex items-center gap-1 hover:underline transition"
            >
              <Package className="w-3.5 h-3.5" />
              <span>Track Order</span>
            </button>
            <button
              onClick={onOpenBulkModal}
              className="flex items-center gap-1 font-bold underline transition"
            >
              <PhoneCall className="w-3.5 h-3.5" />
              <span>Bulk Enquiry</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Header */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex items-center justify-between gap-4">
        {/* Mobile Menu Button */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="lg:hidden p-2 text-slate-700 dark:text-slate-300 hover:text-amber-600 dark:hover:text-gold-400"
          aria-label="Toggle Navigation Menu"
        >
          {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>

        {/* Brand Logo */}
        <div className="flex items-center gap-3 cursor-pointer" onClick={() => handleCategoryClick('all')}>
          <div className="relative w-10 h-10 rounded-full bg-gradient-to-tr from-amber-500 via-amber-400 to-yellow-300 p-[1.5px] shadow-md">
            <div className="w-full h-full bg-white dark:bg-obsidian-950 rounded-full flex items-center justify-center font-serif text-xl font-bold text-amber-600 dark:text-gold-400">
              L
            </div>
          </div>
          <div className="flex flex-col">
            <span className="font-serif text-2xl font-bold tracking-widest text-slate-900 dark:text-slate-100 uppercase">
              LUMINARY
            </span>
            <span className="text-[10px] tracking-widest uppercase font-bold text-amber-600 dark:text-gold-400 -mt-1">
              Fragrance • Ayurveda • Lifestyle
            </span>
          </div>
        </div>

        {/* Desktop Navigation Links */}
        <nav className="hidden lg:flex items-center space-x-6 text-xs font-bold uppercase tracking-wider">
          <button
            onClick={() => handleCategoryClick('all')}
            className={`transition py-1 border-b-2 ${
              activeCategoryFilter === 'all'
                ? 'border-amber-500 text-amber-600 dark:border-gold-400 dark:text-gold-400 font-extrabold'
                : 'border-transparent text-slate-700 dark:text-slate-300 hover:text-amber-600 dark:hover:text-gold-300'
            }`}
          >
            Home
          </button>
          <button
            onClick={() => handleCategoryClick('fragrance')}
            className={`transition py-1 border-b-2 ${
              activeCategoryFilter === 'fragrance'
                ? 'border-amber-500 text-amber-600 dark:border-gold-400 dark:text-gold-400 font-extrabold'
                : 'border-transparent text-slate-700 dark:text-slate-300 hover:text-amber-600 dark:hover:text-gold-300'
            }`}
          >
            Fragrances
          </button>
          <button
            onClick={() => handleCategoryClick('ayurvedic')}
            className={`transition py-1 border-b-2 ${
              activeCategoryFilter === 'ayurvedic'
                ? 'border-amber-500 text-amber-600 dark:border-gold-400 dark:text-gold-400 font-extrabold'
                : 'border-transparent text-slate-700 dark:text-slate-300 hover:text-amber-600 dark:hover:text-gold-300'
            }`}
          >
            Ayurvedic
          </button>
          <button
            onClick={() => handleCategoryClick('gadgets')}
            className={`transition py-1 border-b-2 ${
              activeCategoryFilter === 'gadgets'
                ? 'border-amber-500 text-amber-600 dark:border-gold-400 dark:text-gold-400 font-extrabold'
                : 'border-transparent text-slate-700 dark:text-slate-300 hover:text-amber-600 dark:hover:text-gold-300'
            }`}
          >
            Mini Gadgets
          </button>

          {/* AI Fragrance Quiz Button */}
          <button
            onClick={onOpenQuiz}
            className="px-2.5 py-1 rounded-full bg-gradient-to-r from-amber-500/20 to-purple-500/20 border border-amber-500/40 text-amber-700 dark:text-gold-300 font-extrabold text-[11px] flex items-center gap-1 shadow-sm hover:scale-105 transition"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            <span>AI Scent Quiz</span>
          </button>

          <button
            onClick={onOpenBulkModal}
            className="text-amber-600 dark:text-amber-400 hover:text-amber-700 transition py-1 border-b-2 border-transparent font-extrabold flex items-center gap-1"
          >
            <span>Bulk Orders</span>
            <span className="text-[9px] bg-amber-500/20 text-amber-700 dark:text-amber-300 px-1.5 py-0.5 rounded border border-amber-500/40">
              B2B
            </span>
          </button>
        </nav>

        {/* Action Controls & Light/Dark Theme Switcher */}
        <div className="flex items-center space-x-2 sm:space-x-3">
          {/* Light / Dark Mode Toggle Switch */}
          <button
            onClick={toggleTheme}
            className="p-2 rounded-full bg-slate-100 dark:bg-obsidian-900 border border-slate-300 dark:border-slate-800 text-slate-700 dark:text-gold-400 hover:scale-105 transition shadow-sm"
            title={`Switch to ${theme === 'dark' ? 'Bright Light' : 'Dark'} Mode`}
          >
            {theme === 'dark' ? <Sun className="w-4 h-4 sm:w-5 sm:h-5 text-amber-400" /> : <Moon className="w-4 h-4 sm:w-5 sm:h-5 text-slate-800" />}
          </button>

          {/* Quick Search */}
          <button
            onClick={onOpenSearch}
            className="p-2 text-slate-700 dark:text-slate-300 hover:text-amber-600 dark:hover:text-gold-400 bg-slate-100 dark:bg-obsidian-900 border border-slate-300 dark:border-slate-800 rounded-full transition shadow-sm"
            title="Search Store"
          >
            <Search className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>

          {/* Wishlist Icon */}
          <button
            onClick={onOpenWishlist}
            className="relative p-2 text-slate-700 dark:text-slate-300 hover:text-pink-500 bg-slate-100 dark:bg-obsidian-900 border border-slate-300 dark:border-slate-800 rounded-full transition shadow-sm"
            title="Wishlist"
          >
            <Heart className="w-4 h-4 sm:w-5 sm:h-5" />
            {wishlist.length > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-pink-500 text-white rounded-full text-[10px] font-bold flex items-center justify-center animate-pulse">
                {wishlist.length}
              </span>
            )}
          </button>

          {/* Cart Icon & Total Summary */}
          <button
            onClick={onOpenCart}
            className="relative flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-500/10 dark:bg-gold-600/30 border border-amber-500/40 text-slate-900 dark:text-slate-100 font-bold shadow-sm hover:border-amber-500 transition"
            title="Cart Drawer"
          >
            <div className="relative">
              <ShoppingBag className="w-4 h-4 sm:w-5 sm:h-5 text-amber-600 dark:text-gold-400" />
              {totals.itemCount > 0 && (
                <span className="absolute -top-2 -right-2 w-4 h-4 bg-amber-500 text-slate-950 font-bold rounded-full text-[10px] flex items-center justify-center">
                  {totals.itemCount}
                </span>
              )}
            </div>
            <span className="hidden sm:inline font-mono font-extrabold text-xs text-amber-700 dark:text-gold-300">
              {formatPrice(totals.grandTotal)}
            </span>
          </button>

          {/* Admin Panel Button */}
          <button
            onClick={onOpenAdmin}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 text-white dark:bg-obsidian-850 dark:text-gold-400 border border-slate-700 dark:border-gold-500/30 font-bold text-xs hover:bg-amber-600 dark:hover:bg-obsidian-800 transition shadow-sm"
            title="Open Admin Control Center"
          >
            <ShieldCheck className="w-4 h-4 text-amber-400 dark:text-gold-400" />
            <span className="hidden md:inline">Admin Panel</span>
          </button>
        </div>
      </div>

      {/* Mobile Navigation Drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-slate-200 dark:border-gold-500/20 bg-white dark:bg-obsidian-950 px-4 py-4 space-y-3">
          <div className="grid grid-cols-2 gap-2 text-xs uppercase font-bold">
            <button
              onClick={() => handleCategoryClick('all')}
              className={`p-2.5 text-left rounded border ${
                activeCategoryFilter === 'all'
                  ? 'bg-amber-500/20 border-amber-500 text-amber-700 dark:text-gold-300'
                  : 'bg-slate-100 dark:bg-obsidian-900 border-slate-300 dark:border-slate-800 text-slate-700 dark:text-slate-300'
              }`}
            >
              All Products
            </button>
            <button
              onClick={() => handleCategoryClick('fragrance')}
              className={`p-2.5 text-left rounded border ${
                activeCategoryFilter === 'fragrance'
                  ? 'bg-amber-500/20 border-amber-500 text-amber-700 dark:text-gold-300'
                  : 'bg-slate-100 dark:bg-obsidian-900 border-slate-300 dark:border-slate-800 text-slate-700 dark:text-slate-300'
              }`}
            >
              Fragrances
            </button>
            <button
              onClick={() => handleCategoryClick('ayurvedic')}
              className={`p-2.5 text-left rounded border ${
                activeCategoryFilter === 'ayurvedic'
                  ? 'bg-amber-500/20 border-amber-500 text-amber-700 dark:text-gold-300'
                  : 'bg-slate-100 dark:bg-obsidian-900 border-slate-300 dark:border-slate-800 text-slate-700 dark:text-slate-300'
              }`}
            >
              Ayurvedic
            </button>
            <button
              onClick={() => handleCategoryClick('gadgets')}
              className={`p-2.5 text-left rounded border ${
                activeCategoryFilter === 'gadgets'
                  ? 'bg-amber-500/20 border-amber-500 text-amber-700 dark:text-gold-300'
                  : 'bg-slate-100 dark:bg-obsidian-900 border-slate-300 dark:border-slate-800 text-slate-700 dark:text-slate-300'
              }`}
            >
              Mini Gadgets
            </button>
          </div>
          <div className="pt-2 border-t border-slate-200 dark:border-slate-800 flex flex-col gap-2 text-xs">
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                onOpenQuiz();
              }}
              className="w-full text-center py-2.5 rounded bg-purple-500/20 border border-purple-500/40 text-purple-700 dark:text-purple-300 font-extrabold flex items-center justify-center gap-2"
            >
              <Sparkles className="w-4 h-4 text-purple-500" />
              <span>Take AI Signature Scent Quiz</span>
            </button>

            <button
              onClick={() => {
                setMobileMenuOpen(false);
                onOpenBulkModal();
              }}
              className="w-full text-center py-2.5 rounded bg-amber-500/20 border border-amber-500/40 text-amber-800 dark:text-amber-300 font-bold"
            >
              Request Bulk Wholesale Pricing (B2B)
            </button>

            <button
              onClick={() => {
                setMobileMenuOpen(false);
                onOpenAdmin();
              }}
              className="w-full text-center py-2.5 rounded bg-slate-900 text-white dark:bg-gold-600/30 dark:text-gold-300 font-bold flex items-center justify-center gap-1.5"
            >
              <ShieldCheck className="w-4 h-4 text-amber-400" />
              <span>Admin Panel Control</span>
            </button>
          </div>
        </div>
      )}
    </header>
  );
};
