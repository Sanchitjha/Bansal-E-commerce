import type { CategoryType, Product } from '@/types';

/** "Gift sets" -> "gift-sets" */
export const slugify = (value: string) =>
  value
    .toLowerCase()
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

export const collectionHref = (slug: string) => `/collections/${slug}`;

export interface CategoryPage {
  slug: string;
  category: CategoryType;
  title: string;
  description: string;
}

/** The three main divisions of the store, each with its own landing page. */
export const CATEGORY_PAGES: CategoryPage[] = [
  {
    slug: 'fragrances',
    category: 'fragrance',
    title: 'Fragrances',
    description: 'Eau de parfum, attars and perfume gift sets from Luminary Fragrance, in signature gift packaging.',
  },
  {
    slug: 'ayurvedic-care',
    category: 'ayurvedic',
    title: 'Ayurvedic Care',
    description: 'Pure Ayurvedic herbs and personal-care products, made with traditional ingredients.',
  },
  {
    slug: 'mini-gadgets',
    category: 'gadgets',
    title: 'Mini Gadgets',
    description: 'Aroma diffusers and fragrance gadgets for your home and daily routine.',
  },
];

export const PRICE_BANDS = [
  { id: 'under-1000', label: 'Under ₹1,000', test: (p: Product) => p.sellingPrice < 1000 },
  { id: '1000-2000', label: '₹1,000 – ₹2,000', test: (p: Product) => p.sellingPrice >= 1000 && p.sellingPrice <= 2000 },
  { id: 'above-2000', label: 'Above ₹2,000', test: (p: Product) => p.sellingPrice > 2000 },
] as const;

export const SORT_OPTIONS = [
  { id: 'featured', label: 'Featured' },
  { id: 'price-asc', label: 'Price: low to high' },
  { id: 'price-desc', label: 'Price: high to low' },
  { id: 'new', label: 'Newest first' },
  { id: 'rating', label: 'Top rated' },
] as const;

export interface Collection {
  slug: string;
  title: string;
  description: string;
  products: Product[];
  /** Narrower pages inside this one (for a division: its product types). */
  children: { slug: string; title: string; count: number }[];
  parent?: { slug: string; title: string };
}

const byBestseller = (a: Product, b: Product) => b.reviewsCount - a.reviewsCount;
const byNewest = (a: Product, b: Product) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();

function childrenOf(products: Product[]): Collection['children'] {
  const counts = new Map<string, number>();
  products.forEach((p) => {
    if (p.subcategory) counts.set(p.subcategory, (counts.get(p.subcategory) ?? 0) + 1);
  });
  return [...counts].map(([title, count]) => ({ slug: slugify(title), title, count }));
}

/** Works out what a /collections/<slug> page should show, or null when there is no such page. */
export function resolveCollection(slug: string, products: Product[]): Collection | null {
  if (slug === 'all') {
    return {
      slug,
      title: 'All Products',
      description: 'Everything from Luminary: perfumes, attars, gift sets, Ayurvedic care and lifestyle gadgets.',
      products,
      children: CATEGORY_PAGES.filter((c) => products.some((p) => p.category === c.category)).map((c) => ({
        slug: c.slug,
        title: c.title,
        count: products.filter((p) => p.category === c.category).length,
      })),
    };
  }
  if (slug === 'best-sellers') {
    return {
      slug,
      title: 'Best Sellers',
      description: 'The products our customers love the most.',
      products: products.filter((p) => p.isBestSeller).sort(byBestseller),
      children: [],
    };
  }
  if (slug === 'new-arrivals') {
    return {
      slug,
      title: 'New Arrivals',
      description: 'The latest additions to the Luminary collection.',
      products: products.filter((p) => p.isNewArrival).sort(byNewest),
      children: [],
    };
  }

  const division = CATEGORY_PAGES.find((c) => c.slug === slug);
  if (division) {
    const inDivision = products.filter((p) => p.category === division.category);
    return { slug, title: division.title, description: division.description, products: inDivision, children: childrenOf(inDivision) };
  }

  const matching = products.filter((p) => p.subcategory && slugify(p.subcategory) === slug);
  if (matching.length > 0) {
    const parent = CATEGORY_PAGES.find((c) => c.category === matching[0].category);
    return {
      slug,
      title: matching[0].subcategory!,
      description: `Shop ${matching[0].subcategory!.toLowerCase()} from Luminary.`,
      products: matching,
      children: [],
      parent: parent ? { slug: parent.slug, title: parent.title } : undefined,
    };
  }
  return null;
}

/** Applies the price band and sort order chosen on a collection page. */
export function filterAndSort(products: Product[], price: string | undefined, sort: string | undefined): Product[] {
  const band = PRICE_BANDS.find((b) => b.id === price);
  const filtered = band ? products.filter(band.test) : [...products];
  switch (sort) {
    case 'price-asc':
      return filtered.sort((a, b) => a.sellingPrice - b.sellingPrice);
    case 'price-desc':
      return filtered.sort((a, b) => b.sellingPrice - a.sellingPrice);
    case 'new':
      return filtered.sort(byNewest);
    case 'rating':
      return filtered.sort((a, b) => b.rating - a.rating || b.reviewsCount - a.reviewsCount);
    default:
      return filtered;
  }
}
