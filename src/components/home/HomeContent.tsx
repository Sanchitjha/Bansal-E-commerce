'use client';

import React from 'react';
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
import { useShell } from '@/components/layout/StoreShell';
import { useLuminary } from '@/context/LuminaryContext';

export const HomeContent: React.FC = () => {
  const { products } = useLuminary();
  const shell = useShell();

  return (
    <>
      <HeroBannerSlider
        onSelectProduct={(id) => {
          const p = products.find((item) => item.id === id);
          if (p) shell.openProduct(p);
        }}
        onOpenBulkModal={() => shell.openBulk()}
      />

      <TrustStrip />

      <ShopByDivision onQuickView={shell.openProduct} onOpenBulkModal={shell.openBulk} />

      <Bestsellers onQuickView={shell.openProduct} onOpenBulkModal={shell.openBulk} />

      <ShopByCategories />

      <DealsAndBulkSection onOpenBulkModal={shell.openBulk} />

      <section className="max-w-3xl mx-auto px-4 pb-6">
        <PincodeCheckerWidget />
      </section>

      <CustomerReviews onWriteReview={shell.openReview} />

      <BlogSection />

      <ConsultationBanner />
    </>
  );
};
