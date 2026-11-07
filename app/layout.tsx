import './globals.css';
import { siteUrl } from '@/lib/site';
import type { Metadata, Viewport } from 'next';
import { Plus_Jakarta_Sans } from 'next/font/google';

const body = Plus_Jakarta_Sans({ subsets: ['latin'], variable: '--font-body', display: 'swap' });


export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: { default: 'Tre Joy Ease Indonesia — Supplier Goodie Bag Custom & Ready Stock', template: '%s | Tre Joy Ease Indonesia' },
  description: 'Supplier goodie bag spunbond, paperbag, dan coolerbag untuk reseller, event, retail, dan corporate. Ready stock, bisa custom logo & motif, order mudah via WhatsApp.',
  keywords: ['goodie bag', 'goodie bag custom', 'tas spunbond', 'paperbag custom', 'coolerbag', 'supplier goodie bag', 'goodie bag reseller', 'goodie bag Jakarta'],
  alternates: { canonical: '/' },
  openGraph: { type: 'website', locale: 'id_ID', siteName: 'Tre Joy Ease Indonesia', url: '/', title: 'Tre Joy Ease Indonesia — Supplier Goodie Bag Custom & Ready Stock', description: 'Goodie bag spunbond, paperbag, dan coolerbag. Ready stock & custom branding untuk bisnis kamu.' },
  twitter: { card: 'summary_large_image' },
  robots: { index: true, follow: true, googleBot: { index: true, follow: true, 'max-image-preview': 'large' } },
};
export const viewport: Viewport = { themeColor: '#ffffff', width: 'device-width', initialScale: 1, viewportFit: 'cover' };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <html lang="id" className={body.variable}><body>{children}</body></html>;
}
