'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { Search, ShoppingBag, Truck, User, Menu, X } from 'lucide-react';
import { useLuminary } from '@/context/LuminaryContext';
import { optimizeImage } from '@/lib/media';
import { CATEGORY_PAGES, PRICE_BANDS, collectionHref, resolveCollection, slugify } from '@/lib/collections';
import type { Product } from '@/types';

interface HeaderProps {
  onOpenCart: () => void;
  onOpenBulkModal: () => void;
  onOpenTrackOrder: () => void;
  onOpenAccount: () => void;
  onOpenSearch: () => void;
  onOpenQuiz: () => void;
  onOpenReviewModal: () => void;
}

interface MegaMenu {
  columns: { heading: string; links: { label: string; href: string; note?: string }[] }[];
  picks: Product[];
}

interface NavItem {
  key: string;
  label: string;
  /** Hidden on laptop-width screens where the row is full; still in the mobile menu and the footer. */
  extra?: boolean;
  href?: string;
  onClick?: () => void;
  mega?: MegaMenu;
}

const CLOSE_DELAY_MS = 160;

export const Header: React.FC<HeaderProps> = ({
  onOpenCart,
  onOpenBulkModal,
  onOpenTrackOrder,
  onOpenAccount,
  onOpenSearch,
  onOpenQuiz,
  onOpenReviewModal,
}) => {
  const { getCartTotals, settings, products } = useLuminary();
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const totals = getCartTotals();

  const open = (key: string) => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    setOpenMenu(key);
  };
  // A short delay stops the menu flickering shut while the cursor crosses the gap between label and panel.
  const scheduleClose = () => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    closeTimer.current = setTimeout(() => setOpenMenu(null), CLOSE_DELAY_MS);
  };
  const closeNow = () => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    setOpenMenu(null);
    setMobileOpen(false);
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && closeNow();
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('keydown', onKey);
      if (closeTimer.current) clearTimeout(closeTimer.current);
    };
  }, []);

  const openConsult = () => {
    closeNow();
    const text = encodeURIComponent('Hello Luminary, I would like an expert consultation.');
    window.open(`https://wa.me/${settings.whatsAppNumber}?text=${text}`, '_blank');
  };

  const nav = useMemo<NavItem[]>(() => {
    const has = (slug: string) => (resolveCollection(slug, products)?.products.length ?? 0) > 0;

    const division = (slug: string): NavItem | null => {
      const page = CATEGORY_PAGES.find((c) => c.slug === slug)!;
      const inDivision = products.filter((p) => p.category === page.category);
      if (inDivision.length === 0) return null;

      const types = new Map<string, number>();
      inDivision.forEach((p) => p.subcategory && types.set(p.subcategory, (types.get(p.subcategory) ?? 0) + 1));

      return {
        key: slug,
        label: page.title,
        href: collectionHref(slug),
        mega: {
          columns: [
            {
              heading: 'Shop by type',
              links: [
                ...[...types].map(([name, count]) => ({ label: name, href: collectionHref(slugify(name)), note: String(count) })),
                { label: `All ${page.title}`, href: collectionHref(slug) },
              ],
            },
            {
              heading: 'Shop by price',
              links: PRICE_BANDS.filter((band) => inDivision.some(band.test)).map((band) => ({
                label: band.label,
                href: `${collectionHref(slug)}?price=${band.id}`,
              })),
            },
            {
              heading: 'Explore',
              links: [
                { label: 'Best sellers', href: collectionHref('best-sellers') },
                { label: 'New arrivals', href: collectionHref('new-arrivals') },
              ],
            },
          ],
          picks: [...inDivision].sort((a, b) => Number(b.isBestSeller) - Number(a.isBestSeller) || b.reviewsCount - a.reviewsCount).slice(0, 3),
        },
      };
    };

    const list: (NavItem | null)[] = [
      division('fragrances'),
      has('gift-sets') ? { key: 'gift-sets', label: 'Gift sets', href: collectionHref('gift-sets') } : null,
      has('attars') ? { key: 'attars', label: 'Attars', href: collectionHref('attars') } : null,
      division('ayurvedic-care'),
      division('mini-gadgets'),
      has('new-arrivals') ? { key: 'new', label: 'New arrivals', href: collectionHref('new-arrivals') } : null,
      has('best-sellers') ? { key: 'best', label: 'Best sellers', href: collectionHref('best-sellers') } : null,
      { key: 'bulk', label: 'Bulk deals', href: '/#deals', extra: true },
      { key: 'quiz', label: 'Find my scent', onClick: () => onOpenQuiz(), extra: true },
      { key: 'blog', label: 'Blog', href: '/#blog', extra: true },
    ];
    return list.filter((item): item is NavItem => item !== null);
  }, [products, onOpenQuiz]);

  const navLink =
    'relative block px-1 py-3.5 text-[11.5px] font-semibold uppercase tracking-[0.1em] text-slate-800 hover:text-brand-green-700 transition whitespace-nowrap after:absolute after:left-0 after:right-0 after:bottom-2 after:h-px after:bg-brand-green-700 after:scale-x-0 hover:after:scale-x-100 after:transition-transform';
  const iconButton =
    'w-9 h-9 sm:w-10 sm:h-10 rounded-full border border-stone-200 flex items-center justify-center text-slate-700 hover:border-black hover:text-black transition';
  const mobileLink = 'block w-full text-left px-2 py-2.5 text-sm font-medium text-slate-800 hover:text-brand-green-700 border-b border-stone-100';

  const activeMega = nav.find((item) => item.key === openMenu && item.mega);

  return (
    <header className="sticky top-0 z-40 w-full bg-white border-b border-stone-200" onMouseLeave={scheduleClose}>
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-4">
        <div className="flex items-center gap-1.5 sm:gap-2 lg:w-[220px]">
          <button onClick={() => setMobileOpen(!mobileOpen)} className="lg:hidden p-2 -ml-2 text-slate-800" aria-label="Toggle navigation menu">
            {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
          <Link href="/" onClick={closeNow} className="flex items-center" aria-label="Luminary home">
            <img src="/logo.png" alt="Luminary Fragrance" className="h-12 sm:h-14 w-auto" />
          </Link>
        </div>

        <button
          onClick={onOpenSearch}
          className="hidden lg:flex flex-1 max-w-xl items-center gap-3 px-5 py-3 rounded-full border border-stone-200 bg-stone-50 text-left text-sm text-slate-400 hover:border-black transition"
          aria-label="Search products"
        >
          <Search className="w-4 h-4 text-slate-500" />
          Search perfumes, attars, gift sets…
        </button>

        <div className="flex items-center justify-end gap-1.5 sm:gap-2 lg:w-[220px]">
          <button onClick={onOpenTrackOrder} className={iconButton} title="Track order" aria-label="Track order">
            <Truck className="w-[18px] h-[18px]" />
          </button>
          <button onClick={onOpenSearch} className={`${iconButton} lg:hidden`} title="Search" aria-label="Search">
            <Search className="w-[18px] h-[18px]" />
          </button>
          <button onClick={onOpenAccount} className={iconButton} title="My account" aria-label="My account">
            <User className="w-[18px] h-[18px]" />
          </button>
          <button onClick={onOpenCart} className={`${iconButton} relative`} title="Cart" aria-label="Open cart">
            <ShoppingBag className="w-[18px] h-[18px]" />
            <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-black text-white text-[10px] font-bold flex items-center justify-center">
              {totals.itemCount}
            </span>
          </button>
        </div>
      </div>

      <nav className="hidden lg:block border-t border-stone-200" aria-label="Main">
        <ul className="max-w-[1400px] mx-auto px-6 flex items-center justify-center gap-5 xl:gap-6">
          {nav.map((item) => (
            <li key={item.key} className={item.extra ? 'hidden xl:block' : undefined} onMouseEnter={() => (item.mega ? open(item.key) : scheduleClose())}>
              {item.href ? (
                <Link
                  href={item.href}
                  className={navLink}
                  onClick={closeNow}
                  onFocus={() => (item.mega ? open(item.key) : undefined)}
                  aria-haspopup={item.mega ? 'true' : undefined}
                  aria-expanded={item.mega ? openMenu === item.key : undefined}
                >
                  {item.label}
                </Link>
              ) : (
                <button
                  className={navLink}
                  onClick={() => {
                    closeNow();
                    item.onClick?.();
                  }}
                >
                  {item.label}
                </button>
              )}
            </li>
          ))}
        </ul>
      </nav>

      {activeMega?.mega && (
        <div className="hidden lg:block absolute inset-x-0 top-full bg-white border-t border-stone-200 shadow-2xl" onMouseEnter={() => open(activeMega.key)}>
          <div className="max-w-[1400px] mx-auto px-6 py-8 grid grid-cols-[repeat(3,minmax(160px,1fr))_minmax(380px,1.8fr)] gap-10">
            {activeMega.mega.columns.map((column) => (
              <div key={column.heading}>
                <h3 className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-400 mb-3">{column.heading}</h3>
                <ul className="space-y-2">
                  {column.links.map((link) => (
                    <li key={link.href}>
                      <Link href={link.href} onClick={closeNow} className="flex items-baseline justify-between gap-3 text-sm text-slate-800 hover:text-brand-green-700">
                        <span>{link.label}</span>
                        {link.note && <span className="text-xs text-slate-400">{link.note}</span>}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
            <div>
              <h3 className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-400 mb-3">Popular picks</h3>
              <ul className="space-y-3">
                {activeMega.mega.picks.map((product) => (
                  <li key={product.id}>
                    <Link href={`/product/${product.urlSlug}`} onClick={closeNow} className="flex items-center gap-3 group">
                      <img src={optimizeImage(product.images[0], 120)} alt="" className="w-14 h-14 object-cover bg-stone-100 shrink-0" />
                      <span className="min-w-0">
                        <span className="block text-sm font-medium text-slate-900 leading-snug line-clamp-2 group-hover:text-brand-green-700">{product.name}</span>
                        <span className="block text-xs text-slate-500 mt-0.5">₹{product.sellingPrice.toLocaleString('en-IN')}</span>
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {mobileOpen && (
        <div className="lg:hidden border-t border-stone-200 bg-white px-4 py-3 max-h-[75vh] overflow-y-auto">
          <p className="px-2 pt-1 pb-1 text-[11px] font-bold uppercase tracking-wider text-slate-400">Shop</p>
          <Link href={collectionHref('all')} onClick={closeNow} className={mobileLink}>All products</Link>
          {nav.map((item) =>
            item.href ? (
              <Link key={item.key} href={item.href} onClick={closeNow} className={mobileLink}>{item.label}</Link>
            ) : (
              <button
                key={item.key}
                className={mobileLink}
                onClick={() => {
                  closeNow();
                  item.onClick?.();
                }}
              >
                {item.label}
              </button>
            )
          )}
          <p className="px-2 pt-4 pb-1 text-[11px] font-bold uppercase tracking-wider text-slate-400">Help</p>
          <button className={mobileLink} onClick={() => { closeNow(); onOpenBulkModal(); }}>Request bulk quote</button>
          <button className={mobileLink} onClick={openConsult}>Consult an expert</button>
          <button className={mobileLink} onClick={() => { closeNow(); onOpenReviewModal(); }}>Write a review</button>
        </div>
      )}
    </header>
  );
};
