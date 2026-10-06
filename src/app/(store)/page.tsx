import { HomeContent } from '@/components/home/HomeContent';
import { getCatalog } from '@/lib/data';
import { siteUrl } from '@/lib/site';

export default async function HomePage() {
  const { settings } = await getCatalog();
  const base = siteUrl();

  const structuredData = [
    {
      '@context': 'https://schema.org',
      '@type': 'Organization',
      name: settings?.websiteName ?? 'Luminary',
      url: base,
      ...(settings?.contactPhone
        ? { contactPoint: { '@type': 'ContactPoint', telephone: settings.contactPhone, contactType: 'customer service', areaServed: 'IN' } }
        : {}),
    },
    {
      '@context': 'https://schema.org',
      '@type': 'WebSite',
      name: settings?.websiteName ?? 'Luminary',
      url: base,
    },
  ];

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }} />
      <HomeContent />
    </>
  );
}
