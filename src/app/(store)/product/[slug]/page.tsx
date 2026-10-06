import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { ProductPageView } from '@/components/product/ProductPageView';
import { getProductBySlug } from '@/lib/data';
import { siteUrl } from '@/lib/site';

export const revalidate = 300;

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const product = await getProductBySlug(params.slug);
  if (!product) return { title: 'Product not found' };

  const title = product.seoTitle || product.name;
  const description = product.metaDescription || product.shortDescription;
  return {
    title,
    description,
    alternates: { canonical: `/product/${product.urlSlug}` },
    openGraph: { title, description, type: 'website', images: product.images.slice(0, 1) },
  };
}

export default async function ProductPage({ params }: { params: { slug: string } }) {
  const product = await getProductBySlug(params.slug);
  if (!product) notFound();

  const base = siteUrl();
  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    description: product.shortDescription,
    image: product.images,
    sku: product.sku,
    brand: { '@type': 'Brand', name: product.brand },
    ...(product.reviewsCount > 0
      ? { aggregateRating: { '@type': 'AggregateRating', ratingValue: product.rating, reviewCount: product.reviewsCount } }
      : {}),
    offers: {
      '@type': 'Offer',
      url: `${base}/product/${product.urlSlug}`,
      priceCurrency: 'INR',
      price: product.sellingPrice,
      itemCondition: 'https://schema.org/NewCondition',
      availability: product.stock > 0 ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
    },
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }} />
      <ProductPageView product={product} />
    </>
  );
}
