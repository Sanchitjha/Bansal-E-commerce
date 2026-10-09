'use client';

import React from 'react';
import { HeroBannerSlider } from '@/components/home/HeroBannerSlider';
import { TrustStrip } from '@/components/home/TrustStrip';
import { ProductTabs } from '@/components/home/ProductTabs';
import { CategorySection } from '@/components/home/CategorySection';
import { ShopByCategories } from '@/components/home/ShopByCategories';
import { DealsAndBulkSection } from '@/components/home/DealsAndBulkSection';
import { CustomerReviews } from '@/components/home/CustomerReviews';
import { BlogSection } from '@/components/home/BlogSection';
import { CreatorVideos } from '@/components/home/CreatorVideos';
import { ConsultationBanner } from '@/components/home/ConsultationBanner';
import { PincodeCheckerWidget } from '@/components/shipping/PincodeCheckerWidget';
import { useShell } from '@/components/layout/StoreShell';
import { useLuminary } from '@/context/LuminaryContext';
import { CATEGORY_PAGES } from '@/lib/collections';
import { homeBestSellers } from '@/lib/home-sections';

export const HomeContent: React.FC = () => {
  const { products } = useLuminary();
  const shell = useShell();

  // The division rows skip what the Best Sellers tab already shows, so no product is listed twice.
  const alreadyShown = new Set(homeBestSellers(products).map((p) => p.id));

  return (
    <>
      <HeroBannerSlider onOpenBulkModal={() => shell.openBulk()} />

      <TrustStrip />

      <ProductTabs onQuickView={shell.openProduct} onOpenBulkModal={shell.openBulk} />

      {CATEGORY_PAGES.map((page) => (
        <CategorySection key={page.slug} page={page} exclude={alreadyShown} onQuickView={shell.openProduct} onOpenBulkModal={shell.openBulk} />
      ))}

      <ShopByCategories />

      <DealsAndBulkSection onOpenBulkModal={shell.openBulk} />

      <section className="max-w-3xl mx-auto px-4 pb-6">
        <PincodeCheckerWidget />
      </section>

      <CustomerReviews onWriteReview={shell.openReview} />

      <BlogSection />

      <CreatorVideos />

      <ConsultationBanner />
    </>
  );
};
