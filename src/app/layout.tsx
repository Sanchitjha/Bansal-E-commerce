import type { Metadata } from 'next';
import { Playfair_Display, Poppins } from 'next/font/google';
import './globals.css';
import { LuminaryProvider } from '@/context/LuminaryContext';
import { getCatalog } from '@/lib/data';
import { siteUrl } from '@/lib/site';

const playfair = Playfair_Display({
  subsets: ['latin'],
  variable: '--font-playfair',
  display: 'swap',
});

const poppins = Poppins({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700', '800'],
  variable: '--font-plus-jakarta',
  display: 'swap',
});

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl()),
  title: {
    default: 'Luminary | Fragrances, Ayurvedic Care & Lifestyle Gadgets',
    template: '%s | Luminary',
  },
  description:
    'Shop Luminary Fragrance eau de parfum, attars and perfume gift sets, plus Ayurvedic care like Safed Musli and smart diffusers. Free delivery above ₹999, COD available and bulk pricing across India.',
  keywords: [
    'luminary fragrance',
    'eau de parfum india',
    'perfume gift set',
    'attar oils',
    'safed musli',
    'ayurvedic products online',
    'wholesale perfumes',
    'smart aroma diffuser',
  ],
  alternates: { canonical: '/' },
  openGraph: {
    title: 'Luminary | Fragrance, Ayurveda & Lifestyle',
    description: 'Fragrance • Ayurveda • Lifestyle. Premium products with bulk pricing across India.',
    siteName: 'Luminary',
    locale: 'en_IN',
    type: 'website',
  },
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const catalog = await getCatalog();

  return (
    <html lang="en" className={`${playfair.variable} ${poppins.variable}`}>
      <body className="bg-brand-cream text-slate-900 antialiased selection:bg-brand-orange-500 selection:text-white">
        <LuminaryProvider initialData={catalog}>{children}</LuminaryProvider>
      </body>
    </html>
  );
}
