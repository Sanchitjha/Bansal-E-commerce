import type { Metadata } from 'next';
import { Playfair_Display, Plus_Jakarta_Sans } from 'next/font/google';
import './globals.css';
import { LuminaryProvider } from '@/context/LuminaryContext';

const playfair = Playfair_Display({
  subsets: ['latin'],
  variable: '--font-playfair',
  display: 'swap',
});

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  variable: '--font-plus-jakarta',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Luminary | Luxury Fragrances, Ayurvedic Elixirs & Lifestyle Gadgets',
  description:
    'Discover artisanal perfumes, pure Kashmiri 24K Gold Kumkumadi serums, and smart cold-mist diffusers. Single & wholesale bulk pricing available across India.',
  keywords: [
    'luminary fragrance',
    'luxury perfume india',
    'attar oils',
    'kumkumadi 24k gold serum',
    'b2b wholesale perfumes',
    'smart aroma diffuser',
  ],
  openGraph: {
    title: 'Luminary | Luxury E-Commerce Marketplace',
    description: 'Fragrance • Ayurveda • Lifestyle. Premium artisanal luxury products with wholesale pricing.',
    url: 'https://luminaryfragrance.com',
    siteName: 'Luminary',
    locale: 'en_IN',
    type: 'website',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${playfair.variable} ${plusJakarta.variable}`}>
      <body className="bg-obsidian-950 text-slate-100 antialiased selection:bg-gold-500 selection:text-obsidian-950">
        <LuminaryProvider>{children}</LuminaryProvider>
      </body>
    </html>
  );
}
