'use client';

import React, { createContext, useContext, useMemo, useState } from 'react';
import { CheckCircle2, FileText } from 'lucide-react';
import { AnnouncementBar } from '@/components/layout/AnnouncementBar';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { Toast } from '@/components/layout/Toast';
import { ProductDetailModal } from '@/components/product/ProductDetailModal';
import { CartDrawer } from '@/components/cart/CartDrawer';
import { CheckoutModal } from '@/components/checkout/CheckoutModal';
import { BulkQuoteModal } from '@/components/bulk/BulkQuoteModal';
import { OrderTrackingModal } from '@/components/orders/OrderTrackingModal';
import { SearchModal } from '@/components/search/SearchModal';
import { AdminDashboardModal } from '@/components/admin/AdminDashboardModal';
import { FragranceQuizModal } from '@/components/quiz/FragranceQuizModal';
import { SubmitReviewModal } from '@/components/reviews/SubmitReviewModal';
import { AccountModal } from '@/components/account/AccountModal';
import { useLuminary } from '@/context/LuminaryContext';
import { Product, Order } from '@/types';

interface ShellActions {
  openProduct: (product: Product) => void;
  openBulk: (product?: Product) => void;
  openQuiz: () => void;
  openReview: () => void;
  openCart: () => void;
  openCheckout: () => void;
  openTrack: () => void;
  openSearch: () => void;
  openAccount: () => void;
  openAdmin: () => void;
}

const ShellContext = createContext<ShellActions | null>(null);

export const useShell = (): ShellActions => {
  const ctx = useContext(ShellContext);
  if (!ctx) throw new Error('useShell must be used inside StoreShell');
  return ctx;
};

/** Header, footer and every popup, shared by the home page, product pages and policy pages. */
export const StoreShell: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { formatPrice } = useLuminary();

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
  const [isAccountOpen, setIsAccountOpen] = useState(false);
  const [successOrder, setSuccessOrder] = useState<Order | null>(null);

  const actions = useMemo<ShellActions>(
    () => ({
      openProduct: (p) => setSelectedProduct(p),
      openBulk: (p) => {
        setBulkProductTarget(p ?? null);
        setIsBulkModalOpen(true);
      },
      openQuiz: () => setIsQuizOpen(true),
      openReview: () => setIsReviewOpen(true),
      openCart: () => setIsCartOpen(true),
      openCheckout: () => setIsCheckoutOpen(true),
      openTrack: () => setIsTrackOrderOpen(true),
      openSearch: () => setIsSearchOpen(true),
      openAccount: () => setIsAccountOpen(true),
      openAdmin: () => setIsAdminOpen(true),
    }),
    []
  );

  return (
    <ShellContext.Provider value={actions}>
      <div className="min-h-screen bg-brand-cream text-slate-900 flex flex-col">
        <AnnouncementBar />

        <Header
          onOpenCart={actions.openCart}
          onOpenBulkModal={() => actions.openBulk()}
          onOpenTrackOrder={actions.openTrack}
          onOpenAccount={actions.openAccount}
          onOpenSearch={actions.openSearch}
          onOpenQuiz={actions.openQuiz}
          onOpenReviewModal={actions.openReview}
        />

        <main className="flex-1">{children}</main>

        <Footer
          onOpenAdmin={actions.openAdmin}
          onOpenBulkModal={() => actions.openBulk()}
          onOpenTrackOrder={actions.openTrack}
          onOpenReviewModal={actions.openReview}
        />

        {selectedProduct && (
          <ProductDetailModal
            product={selectedProduct}
            onClose={() => setSelectedProduct(null)}
            onOpenBulkModal={(p) => actions.openBulk(p)}
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
          onOpenBulkModal={() => actions.openBulk()}
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

        <SearchModal isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} onSelectProduct={(p) => setSelectedProduct(p)} />

        <AccountModal isOpen={isAccountOpen} onClose={() => setIsAccountOpen(false)} />

        <AdminDashboardModal isOpen={isAdminOpen} onClose={() => setIsAdminOpen(false)} />

        <FragranceQuizModal isOpen={isQuizOpen} onClose={() => setIsQuizOpen(false)} onSelectProduct={(p) => setSelectedProduct(p)} />

        <SubmitReviewModal isOpen={isReviewOpen} onClose={() => setIsReviewOpen(false)} />

        {successOrder && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
            <div className="relative w-full max-w-md bg-white rounded-3xl p-7 shadow-2xl text-center space-y-4 animate-fade-in">
              <div className="w-16 h-16 rounded-full bg-brand-green-100 text-brand-green-700 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-8 h-8" />
              </div>

              <h3 className="text-2xl font-bold text-brand-green-800">Order Placed Successfully!</h3>
              <p className="text-sm text-slate-600">
                Thank you for shopping with Luminary. Your order ID is{' '}
                <strong className="font-mono text-brand-orange-600">{successOrder.id}</strong>. Save it to track your order with the mobile number you
                used. A confirmation has been emailed to {successOrder.email}.
              </p>

              <div className="p-4 rounded-xl bg-stone-50 border border-stone-200 text-sm space-y-1 text-slate-600">
                <p>
                  Amount: <span className="font-bold text-slate-900">{formatPrice(successOrder.totalAmount)}</span>
                </p>
                <p>
                  Payment:{' '}
                  <span className="font-semibold text-slate-900">
                    {successOrder.paymentMethod === 'COD' ? 'Cash on Delivery' : `${successOrder.paymentMethod} (${successOrder.paymentStatus})`}
                  </span>
                </p>
              </div>

              {successOrder.accessToken && (
                <a
                  href={`/invoice/${encodeURIComponent(successOrder.id)}?t=${successOrder.accessToken}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-sm font-semibold text-brand-green-700 hover:underline"
                >
                  <FileText className="w-4 h-4" /> View invoice
                </a>
              )}

              <button
                onClick={() => setSuccessOrder(null)}
                className="w-full py-3 rounded-full bg-brand-orange-500 hover:bg-brand-orange-600 text-white font-bold text-sm transition"
              >
                Back to Store
              </button>
            </div>
          </div>
        )}

        <Toast />
      </div>
    </ShellContext.Provider>
  );
};
