'use client';

import React, { useState } from 'react';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { HeroBannerSlider } from '@/components/home/HeroBannerSlider';
import { CategorySection } from '@/components/home/CategorySection';
import { ProductCard } from '@/components/home/ProductCard';
import { DealsAndBulkSection } from '@/components/home/DealsAndBulkSection';
import { CustomerReviews } from '@/components/home/CustomerReviews';
import { PincodeCheckerWidget } from '@/components/shipping/PincodeCheckerWidget';

// Modals
import { ProductDetailModal } from '@/components/product/ProductDetailModal';
import { CartDrawer } from '@/components/cart/CartDrawer';
import { CheckoutModal } from '@/components/checkout/CheckoutModal';
import { BulkQuoteModal } from '@/components/bulk/BulkQuoteModal';
import { OrderTrackingModal } from '@/components/orders/OrderTrackingModal';
import { SearchModal } from '@/components/search/SearchModal';
import { AdminDashboardModal } from '@/components/admin/AdminDashboardModal';
import { FragranceQuizModal } from '@/components/quiz/FragranceQuizModal';
import { SubmitReviewModal } from '@/components/reviews/SubmitReviewModal';

import { useLuminary } from '@/context/LuminaryContext';
import { Product, Order } from '@/types';
import { CheckCircle2, Sparkles, Award } from 'lucide-react';

export default function HomePage() {
  const { products, activeCategoryFilter, setActiveCategoryFilter, formatPrice } = useLuminary();

  // State for Modals
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
  const [bulkProductTarget, setBulkProductTarget] = useState<Product | null>(null);
  const [isTrackOrderOpen, setIsTrackOrderOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const [isQuizOpen, setIsQuizOpen] = useState(false);
  const [isReviewOpen, setIsReviewOpen] = useState(false);
  const [successOrder, setSuccessOrder] = useState<Order | null>(null);

  // Filter Products based on selected category
  const filteredProducts = products.filter((p) => {
    if (activeCategoryFilter === 'all') return true;
    return p.category === activeCategoryFilter;
  });

  const handleOpenBulkForProduct = (product?: Product) => {
    if (product) setBulkProductTarget(product);
    setIsBulkModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-obsidian-950 text-slate-900 dark:text-slate-100 flex flex-col justify-between transition-colors duration-300">
      {/* Header */}
      <Header
        onOpenCart={() => setIsCartOpen(true)}
        onOpenWishlist={() => setIsCartOpen(true)}
        onOpenBulkModal={() => handleOpenBulkForProduct()}
        onOpenTrackOrder={() => setIsTrackOrderOpen(true)}
        onOpenAdmin={() => setIsAdminOpen(true)}
        onOpenSearch={() => setIsSearchOpen(true)}
        onOpenQuiz={() => setIsQuizOpen(true)}
        onOpenReviewModal={() => setIsReviewOpen(true)}
      />

      <main className="flex-1">
        {/* Dynamic Admin-Managed Hero Banner Slider */}
        <HeroBannerSlider
          onSelectProduct={(id) => {
            const p = products.find((item) => item.id === id);
            if (p) setSelectedProduct(p);
          }}
          onOpenBulkModal={() => handleOpenBulkForProduct()}
        />

        {/* 3 Divisions Category Section */}
        <CategorySection />

        {/* Main Product Catalog Section */}
        <section id="catalog-section" className="py-14 bg-slate-50 dark:bg-obsidian-950 border-b border-slate-200 dark:border-slate-800 transition-colors duration-300">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            {/* Section Title & Filter Tabs */}
            <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
              <div>
                <span className="text-xs font-extrabold uppercase tracking-widest text-amber-600 dark:text-gold-400">
                  CURATED LUXURY SELECTION
                </span>
                <h2 className="font-serif text-3xl font-bold text-slate-900 dark:text-slate-100 mt-1">
                  {activeCategoryFilter === 'all'
                    ? 'All Commercial Offerings'
                    : activeCategoryFilter === 'fragrance'
                    ? 'Luxury Perfumes & Attars'
                    : activeCategoryFilter === 'ayurvedic'
                    ? 'Ayurvedic & Herbal Care'
                    : 'Mini Gadgets & Lifestyle'}
                </h2>
                <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 font-medium">
                  Retail & Wholesale Bulk Quantity Slabs Available for Every Product
                </p>
              </div>

              <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs font-bold">
                <button
                  onClick={() => setIsQuizOpen(true)}
                  className="px-3.5 py-2 rounded-full uppercase tracking-wider bg-purple-500/20 text-purple-700 dark:text-purple-300 border border-purple-500/40 font-extrabold flex items-center gap-1 shadow-sm hover:scale-105 transition shrink-0"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Find My Scent</span>
                </button>

                {(['all', 'fragrance', 'ayurvedic', 'gadgets'] as const).map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setActiveCategoryFilter(cat)}
                    className={`px-4 py-2 rounded-full uppercase tracking-wider transition shadow-sm shrink-0 ${
                      activeCategoryFilter === cat
                        ? 'gold-gradient-bg text-slate-950 shadow-md font-extrabold'
                        : 'bg-white dark:bg-obsidian-900 text-slate-700 dark:text-slate-400 border border-slate-200 dark:border-slate-800 hover:text-amber-600 dark:hover:text-gold-300'
                    }`}
                  >
                    {cat === 'all' ? 'All Divisions' : cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Product Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {filteredProducts.map((prod) => (
                <ProductCard
                  key={prod.id}
                  product={prod}
                  onQuickView={(p) => setSelectedProduct(p)}
                  onOpenBulkModal={(p) => handleOpenBulkForProduct(p)}
                />
              ))}
            </div>
          </div>
        </section>

        {/* Pincode & Express Delivery Checker Section */}
        <section className="py-10 bg-slate-100 dark:bg-obsidian-950 border-b border-slate-200 dark:border-slate-800">
          <div className="max-w-3xl mx-auto px-4">
            <PincodeCheckerWidget />
          </div>
        </section>

        {/* Wholesale & B2B Deals Banner */}
        <DealsAndBulkSection onOpenBulkModal={() => handleOpenBulkForProduct()} />

        {/* Verified Customer Reviews */}
        <div className="relative">
          <CustomerReviews />
          <div className="text-center py-4 bg-slate-50 dark:bg-obsidian-950 border-b border-slate-200 dark:border-slate-800">
            <button
              onClick={() => setIsReviewOpen(true)}
              className="px-5 py-2.5 rounded-xl bg-amber-500/15 border border-amber-500/40 text-amber-800 dark:text-gold-300 font-extrabold text-xs uppercase tracking-wider hover:scale-105 transition shadow-sm inline-flex items-center gap-2"
            >
              <Award className="w-4 h-4 text-amber-500" />
              <span>+ Write a Product Review & Earn 10% OFF</span>
            </button>
          </div>
        </div>
      </main>

      {/* Footer */}
      <Footer
        onOpenAdmin={() => setIsAdminOpen(true)}
        onOpenBulkModal={() => handleOpenBulkForProduct()}
      />

      {/* All Application Modals */}
      {selectedProduct && (
        <ProductDetailModal
          product={selectedProduct}
          onClose={() => setSelectedProduct(null)}
          onOpenBulkModal={(p) => handleOpenBulkForProduct(p)}
          onDirectBuy={(p, qty) => {
            setSelectedProduct(null);
            setIsCheckoutOpen(true);
          }}
        />
      )}

      <CartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        onProceedToCheckout={() => setIsCheckoutOpen(true)}
        onOpenBulkModal={() => handleOpenBulkForProduct()}
      />

      <CheckoutModal
        isOpen={isCheckoutOpen}
        onClose={() => setIsCheckoutOpen(false)}
        onOrderSuccess={(order) => {
          setIsCheckoutOpen(false);
          setSuccessOrder(order);
        }}
      />

      <BulkQuoteModal
        isOpen={isBulkModalOpen}
        onClose={() => {
          setIsBulkModalOpen(false);
          setBulkProductTarget(null);
        }}
        preSelectedProduct={bulkProductTarget}
      />

      <OrderTrackingModal
        isOpen={isTrackOrderOpen}
        onClose={() => setIsTrackOrderOpen(false)}
      />

      <SearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        onSelectProduct={(p) => setSelectedProduct(p)}
      />

      <AdminDashboardModal
        isOpen={isAdminOpen}
        onClose={() => setIsAdminOpen(false)}
      />

      <FragranceQuizModal
        isOpen={isQuizOpen}
        onClose={() => setIsQuizOpen(false)}
        onSelectProduct={(p) => setSelectedProduct(p)}
      />

      <SubmitReviewModal
        isOpen={isReviewOpen}
        onClose={() => setIsReviewOpen(false)}
      />

      {/* Order Success Popup Dialog */}
      {successOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="relative w-full max-w-md bg-white dark:bg-obsidian-900 border border-amber-500/40 rounded-3xl p-6 shadow-2xl text-center space-y-4 text-slate-900 dark:text-slate-100 animate-fade-in">
            <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-500 border border-emerald-500/40 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <h3 className="font-serif text-2xl font-bold text-slate-900 dark:text-slate-100">Order Placed Successfully!</h3>
            <p className="text-xs text-slate-600 dark:text-slate-300 font-medium">
              Thank you for choosing Luminary. Your order ID is{' '}
              <strong className="font-mono text-amber-600 dark:text-gold-300 font-extrabold">{successOrder.id}</strong>.
            </p>

            <div className="p-3 rounded-xl bg-slate-100 dark:bg-obsidian-950 border border-slate-200 dark:border-slate-800 text-xs space-y-1 text-slate-600 dark:text-slate-400">
              <p>Amount Paid: <span className="font-mono text-amber-600 dark:text-gold-300 font-bold">{formatPrice(successOrder.totalAmount)}</span></p>
              <p>Payment Method: <span className="text-slate-900 dark:text-slate-200 font-semibold">{successOrder.paymentMethod}</span></p>
              <p className="text-[10px] text-emerald-600 dark:text-emerald-400 pt-1 font-bold">✓ Order details synchronized to Google Sheets Sales Register.</p>
            </div>

            <button
              onClick={() => setSuccessOrder(null)}
              className="w-full py-3 rounded-xl gold-gradient-bg text-slate-950 font-bold text-xs uppercase shadow-md"
            >
              Back to Store
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
