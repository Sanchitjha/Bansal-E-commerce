import type { MetadataRoute } from 'next';
import { getCatalog } from '@/lib/data';
import { POLICY_SLUGS } from '@/lib/policies';
import { siteUrl } from '@/lib/site';

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = siteUrl();
  const { products } = await getCatalog();

  return [
    { url: base, changeFrequency: 'daily', priority: 1 },
    ...products.map((p) => ({
      url: `${base}/product/${p.urlSlug}`,
      lastModified: new Date(p.updatedAt),
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    })),
    ...POLICY_SLUGS.map((slug) => ({ url: `${base}/policies/${slug}`, changeFrequency: 'yearly' as const, priority: 0.2 })),
  ];
}
