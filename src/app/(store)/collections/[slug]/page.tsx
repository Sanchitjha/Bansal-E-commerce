import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { CollectionView } from '@/components/collections/CollectionView';
import { getCatalog } from '@/lib/data';
import { collectionHref, resolveCollection } from '@/lib/collections';
import { absoluteUrl } from '@/lib/site';

interface Props {
  params: { slug: string };
  searchParams: { price?: string; sort?: string };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { products } = await getCatalog();
  const collection = resolveCollection(params.slug, products);
  if (!collection) return { title: 'Page not found' };

  return {
    title: collection.title,
    description: collection.description,
    // Filtered and sorted views are the same page for search engines.
    alternates: { canonical: collectionHref(collection.slug) },
    openGraph: { title: collection.title, description: collection.description, type: 'website' },
  };
}

export default async function CollectionPage({ params, searchParams }: Props) {
  const { products } = await getCatalog();
  const collection = resolveCollection(params.slug, products);
  if (!collection) notFound();

  const structuredData = [
    {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Home', item: absoluteUrl('/') },
        ...(collection.parent
          ? [{ '@type': 'ListItem', position: 2, name: collection.parent.title, item: absoluteUrl(collectionHref(collection.parent.slug)) }]
          : []),
        { '@type': 'ListItem', position: collection.parent ? 3 : 2, name: collection.title, item: absoluteUrl(collectionHref(collection.slug)) },
      ],
    },
    {
      '@context': 'https://schema.org',
      '@type': 'ItemList',
      name: collection.title,
      itemListElement: collection.products.slice(0, 50).map((p, i) => ({
        '@type': 'ListItem',
        position: i + 1,
        url: absoluteUrl(`/product/${p.urlSlug}`),
        name: p.name,
      })),
    },
  ];

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }} />
      <CollectionView slug={params.slug} price={searchParams.price} sort={searchParams.sort} />
    </>
  );
}
