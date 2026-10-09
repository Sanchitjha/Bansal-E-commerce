'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useLuminary } from '@/context/LuminaryContext';
import { useShell } from '@/components/layout/StoreShell';
import { ProductCard } from '@/components/home/ProductCard';
import { PRICE_BANDS, SORT_OPTIONS, collectionHref, filterAndSort, resolveCollection } from '@/lib/collections';

interface CollectionViewProps {
  slug: string;
  price?: string;
  sort?: string;
}

const chip = 'shrink-0 px-4 py-2 border text-xs font-semibold uppercase tracking-wider transition';
const chipOn = 'bg-black border-black text-white';
const chipOff = 'bg-white border-stone-300 text-slate-700 hover:border-black';

export const CollectionView: React.FC<CollectionViewProps> = ({ slug, price, sort }) => {
  const { products } = useLuminary();
  const shell = useShell();
  const router = useRouter();

  const collection = resolveCollection(slug, products);
  if (!collection) return <p className="max-w-[1400px] mx-auto px-4 py-20 text-center text-slate-500">This page is not available.</p>;

  const shown = filterAndSort(collection.products, price, sort);
  const base = collectionHref(slug);
  const href = (next: { price?: string; sort?: string }) => {
    const query = new URLSearchParams();
    const p = 'price' in next ? next.price : price;
    const s = 'sort' in next ? next.sort : sort;
    if (p) query.set('price', p);
    if (s && s !== 'featured') query.set('sort', s);
    const text = query.toString();
    return text ? `${base}?${text}` : base;
  };

  return (
    <div className="max-w-[1400px] mx-auto px-4 sm:px-6 py-8">
      <nav className="text-xs text-slate-500 mb-5" aria-label="Breadcrumb">
        <Link href="/" className="hover:text-black">Home</Link>
        {collection.parent && (
          <>
            <span className="mx-2">/</span>
            <Link href={collectionHref(collection.parent.slug)} className="hover:text-black">{collection.parent.title}</Link>
          </>
        )}
        <span className="mx-2">/</span>
        <span className="text-slate-800">{collection.title}</span>
      </nav>

      <header className="mb-6">
        <h1 className="text-3xl sm:text-4xl font-bold text-brand-green-800">{collection.title}</h1>
        <p className="text-sm text-slate-600 mt-2 max-w-2xl">{collection.description}</p>
      </header>

      {collection.children.length > 0 && (
        <div className="flex gap-2 overflow-x-auto scrollbar-none pb-3" aria-label="Browse by type">
          <Link href={base} className={`${chip} ${chipOff}`}>All ({collection.products.length})</Link>
          {collection.children.map((child) => (
            <Link key={child.slug} href={collectionHref(child.slug)} className={`${chip} ${chipOff}`}>
              {child.title} ({child.count})
            </Link>
          ))}
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-3 py-3 border-y border-stone-200 mb-6">
        <div className="flex gap-2 overflow-x-auto scrollbar-none">
          <Link href={href({ price: undefined })} className={`${chip} ${!price ? chipOn : chipOff}`}>Any price</Link>
          {PRICE_BANDS.map((band) => (
            <Link key={band.id} href={href({ price: band.id })} className={`${chip} ${price === band.id ? chipOn : chipOff}`}>
              {band.label}
            </Link>
          ))}
        </div>
        <div className="flex items-center gap-3 text-xs text-slate-500">
          <span>{shown.length} {shown.length === 1 ? 'product' : 'products'}</span>
          <label className="flex items-center gap-2">
            <span className="sr-only">Sort by</span>
            <select
              value={sort ?? 'featured'}
              onChange={(e) => router.push(href({ sort: e.target.value }))}
              className="border border-stone-300 bg-white px-3 py-2 text-xs font-semibold text-slate-800 outline-none focus:border-black"
            >
              {SORT_OPTIONS.map((option) => (
                <option key={option.id} value={option.id}>{option.label}</option>
              ))}
            </select>
          </label>
        </div>
      </div>

      {shown.length === 0 ? (
        <div className="text-center py-20 text-slate-500">
          <p>No products match these filters.</p>
          <Link href={base} className="inline-block mt-4 text-sm font-semibold text-brand-green-700 underline">Clear filters</Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-5">
          {shown.map((product) => (
            <ProductCard key={product.id} product={product} onQuickView={shell.openProduct} onOpenBulkModal={shell.openBulk} />
          ))}
        </div>
      )}
    </div>
  );
};
