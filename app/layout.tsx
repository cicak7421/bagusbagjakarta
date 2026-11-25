import './globals.css';
import './shop.css';
import { siteUrl } from '@/lib/site';
import type { Metadata, Viewport } from 'next';
import { Plus_Jakarta_Sans } from 'next/font/google';

const body = Plus_Jakarta_Sans({ subsets: ['latin'], variable: '--font-body', display: 'swap', weight: ['400', '500', '600', '700', '800'] });

const title = 'Tre Joy Ease Indonesia | Supplier Goodie Bag Custom & Ready Stock';
const description = 'Supplier goodie bag spunbond, paperbag, dan coolerbag untuk reseller, event, retail, dan corporate. Ready stock, bisa custom logo dan motif, kirim ke seluruh Indonesia.';

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: { default: title, template: '%s | Tre Joy Ease Indonesia' },
  description,
  applicationName: 'Tre Joy Ease Indonesia',
  keywords: ['goodie bag', 'goodie bag custom', 'tas spunbond', 'paperbag custom', 'coolerbag', 'supplier goodie bag', 'goodie bag reseller', 'goodie bag Jakarta', 'goodie bag Tangerang', 'grosir goodie bag'],
  category: 'shopping',
  formatDetection: { telephone: false, address: false, email: false },
  openGraph: { type: 'website', locale: 'id_ID', siteName: 'Tre Joy Ease Indonesia', title, description },
  twitter: { card: 'summary_large_image', title, description },
  robots: { index: true, follow: true, googleBot: { index: true, follow: true, 'max-image-preview': 'large', 'max-snippet': -1, 'max-video-preview': -1 } },
};
export const viewport: Viewport = { themeColor: '#ffffff', width: 'device-width', initialScale: 1, viewportFit: 'cover' };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <html lang="id" className={body.variable}><body>{children}</body></html>;
}
