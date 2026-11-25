import type { Metadata } from 'next';
import { getData } from '@/lib/data';
import { SiteFooter, SiteHeader } from '@/components/site-chrome';
import CartView from '@/components/cart-view';
import { waLink } from '@/lib/wa';

export const revalidate = 300;
export const metadata: Metadata = { title: 'Keranjang', robots: { index: false, follow: false } };

export default async function CartPage() {
  const { settings, checkoutEnabled } = await getData();
  return (
    <>
      <SiteHeader settings={settings} checkout={checkoutEnabled} />
      <main className="container shop">
        <header className="shophead"><div><h1>Keranjang</h1><p>Periksa barang dan jumlahnya sebelum checkout.</p></div></header>
        {checkoutEnabled ? <CartView /> : (
          <div className="empty"><p>Checkout online belum aktif. Pesan langsung lewat WhatsApp, tim kami siap membantu.</p><a className="primary" href={waLink(settings)} target="_blank" rel="noopener noreferrer">Chat WhatsApp</a></div>
        )}
      </main>
      <SiteFooter settings={settings} checkout={checkoutEnabled} />
    </>
  );
}
