'use client';

import React, { useState } from 'react';
import { AnnouncementBar } from '@/components/layout/AnnouncementBar';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { HeroBannerSlider } from '@/components/home/HeroBannerSlider';
import { TrustStrip } from '@/components/home/TrustStrip';
import { ShopByDivision } from '@/components/home/ShopByDivision';
import { Bestsellers } from '@/components/home/Bestsellers';
import { ShopByCategories } from '@/components/home/ShopByCategories';
import { DealsAndBulkSection } from '@/components/home/DealsAndBulkSection';
import { CustomerReviews } from '@/components/home/CustomerReviews';
import { BlogSection } from '@/components/home/BlogSection';
import { ConsultationBanner } from '@/components/home/ConsultationBanner';
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
import { CheckCircle2 } from 'lucide-react';

export default function HomePage() {
  const { products, formatPrice } = useLuminary();

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

  const handleOpenBulkForProduct = (product?: Product) => {
    setBulkProductTarget(product ?? null);
    setIsBulkModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-brand-cream text-slate-900 flex flex-col">
      <AnnouncementBar />

      <Header
        onOpenCart={() => setIsCartOpen(true)}
        onOpenBulkModal={() => handleOpenBulkForProduct()}
        onOpenTrackOrder={() => setIsTrackOrderOpen(true)}
        onOpenAdmin={() => setIsAdminOpen(true)}
        onOpenSearch={() => setIsSearchOpen(true)}
        onOpenQuiz={() => setIsQuizOpen(true)}
        onOpenReviewModal={() => setIsReviewOpen(true)}
      />

      <main className="flex-1">
        <HeroBannerSlider
          onSelectProduct={(id) => {
            const p = products.find((item) => item.id === id);
            if (p) setSelectedProduct(p);
          }}
          onOpenBulkModal={() => handleOpenBulkForProduct()}
        />

        <TrustStrip />

        <ShopByDivision onQuickView={(p) => setSelectedProduct(p)} onOpenBulkModal={handleOpenBulkForProduct} />

        <Bestsellers onQuickView={(p) => setSelectedProduct(p)} onOpenBulkModal={handleOpenBulkForProduct} />

        <ShopByCategories />

        <DealsAndBulkSection onOpenBulkModal={handleOpenBulkForProduct} />

        <section className="max-w-3xl mx-auto px-4 pb-6">
          <PincodeCheckerWidget />
        </section>

        <CustomerReviews onWriteReview={() => setIsReviewOpen(true)} />

        <BlogSection />

        <ConsultationBanner />
      </main>

      <Footer
        onOpenAdmin={() => setIsAdminOpen(true)}
        onOpenBulkModal={() => handleOpenBulkForProduct()}
        onOpenTrackOrder={() => setIsTrackOrderOpen(true)}
        onOpenReviewModal={() => setIsReviewOpen(true)}
      />

      {/* All Application Modals */}
      {selectedProduct && (
        <ProductDetailModal
          product={selectedProduct}
          onClose={() => setSelectedProduct(null)}
          onOpenBulkModal={(p) => handleOpenBulkForProduct(p)}
          onDirectBuy={() => {
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

      <OrderTrackingModal isOpen={isTrackOrderOpen} onClose={() => setIsTrackOrderOpen(false)} />

      <SearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        onSelectProduct={(p) => setSelectedProduct(p)}
      />

      <AdminDashboardModal isOpen={isAdminOpen} onClose={() => setIsAdminOpen(false)} />

      <FragranceQuizModal
        isOpen={isQuizOpen}
        onClose={() => setIsQuizOpen(false)}
        onSelectProduct={(p) => setSelectedProduct(p)}
      />

      <SubmitReviewModal isOpen={isReviewOpen} onClose={() => setIsReviewOpen(false)} />

      {/* Order Success Popup Dialog */}
      {successOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="relative w-full max-w-md bg-white rounded-3xl p-7 shadow-2xl text-center space-y-4 animate-fade-in">
            <div className="w-16 h-16 rounded-full bg-brand-green-100 text-brand-green-700 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <h3 className="text-2xl font-bold text-brand-green-800">Order Placed Successfully!</h3>
            <p className="text-sm text-slate-600">
              Thank you for shopping with Luminary. Your order ID is{' '}
              <strong className="font-mono text-brand-orange-600">{successOrder.id}</strong>. Keep it handy to track your order.
            </p>

            <div className="p-4 rounded-xl bg-stone-50 border border-stone-200 text-sm space-y-1 text-slate-600">
              <p>
                Amount: <span className="font-bold text-slate-900">{formatPrice(successOrder.totalAmount)}</span>
              </p>
              <p>
                Payment: <span className="font-semibold text-slate-900">{successOrder.paymentMethod}</span>
              </p>
            </div>

            <button
              onClick={() => setSuccessOrder(null)}
              className="w-full py-3 rounded-full bg-brand-orange-500 hover:bg-brand-orange-600 text-white font-bold text-sm transition"
            >
              Back to Store
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
