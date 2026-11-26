import './globals.css';
import './shop.css';
import './store.css';
// Urutan import menentukan siapa yang menang saat spesifisitas sama, jangan diacak:
// gaya lama (globals, shop, store) -> theme.css (token desain + dasar dan chrome toko di bawah .toko) -> CSS per halaman.
import './theme.css';
import './home.css';
import './catalog.css';
import './pdp.css';
import './account.css';
import { siteUrl } from '@/lib/site';
import type { Metadata, Viewport } from 'next';
import { Fraunces, Plus_Jakarta_Sans } from 'next/font/google';

// Font variabel (tanpa daftar weight): toko memakai 400-700, panel admin tetap mendapat 800.
const body = Plus_Jakarta_Sans({ subsets: ['latin'], variable: '--font-body', display: 'swap' });
// Serif untuk judul toko (h1, h2, wordmark). Jalur mundur: ganti dengan Bricolage_Grotesque di baris ini saja.
const display = Fraunces({ subsets: ['latin'], variable: '--font-display', display: 'swap', axes: ['opsz'] });

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
export const viewport: Viewport = { themeColor: '#FCFAF6', width: 'device-width', initialScale: 1, viewportFit: 'cover' };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <html lang="id" className={`${body.variable} ${display.variable}`}><body>{children}</body></html>;
}
