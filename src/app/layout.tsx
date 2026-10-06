import type { Metadata } from 'next';
import { Playfair_Display, Poppins } from 'next/font/google';
import './globals.css';
import { LuminaryProvider } from '@/context/LuminaryContext';

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
  title: 'Luminary | Fragrances, Ayurvedic Care & Lifestyle Gadgets',
  description:
    'Shop artisanal perfumes, authentic Ayurvedic care like Kumkumadi serum, and smart diffusers. Free delivery above ₹999, COD available and bulk pricing across India.',
  keywords: [
    'luminary fragrance',
    'perfume india',
    'attar oils',
    'kumkumadi serum',
    'ayurvedic products online',
    'wholesale perfumes',
    'smart aroma diffuser',
  ],
  openGraph: {
    title: 'Luminary | Fragrance, Ayurveda & Lifestyle',
    description: 'Fragrance • Ayurveda • Lifestyle. Premium products with bulk pricing across India.',
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
    <html lang="en" className={`${playfair.variable} ${poppins.variable}`}>
      <body className="bg-brand-cream text-slate-900 antialiased selection:bg-brand-orange-500 selection:text-white">
        <LuminaryProvider>{children}</LuminaryProvider>
      </body>
    </html>
  );
}
