import type { Metadata } from 'next';
import { MessageCircle } from 'lucide-react';
import { getData } from '@/lib/data';
import { EmptyArt, ShipNote, StoreShell, catalogMoq } from '@/components/site-chrome';
import CartView from '@/components/cart-view';
import { waLink } from '@/lib/wa';

export const revalidate = 300;
export const metadata: Metadata = { title: 'Keranjang', robots: { index: false, follow: false } };

export default async function CartPage() {
  const { settings, products, checkoutEnabled } = await getData();
  return (
    <StoreShell settings={settings} checkout={checkoutEnabled} bar={checkoutEnabled} moq={catalogMoq(products)}>
      <main id="konten" className="container container--form flowpage">
        {checkoutEnabled ? <CartView shipNote={<ShipNote settings={settings} compact />} art={<EmptyArt />} /> : (
          <>
            <header className="shophead"><div><h1>Keranjang</h1></div></header>
            <div className="emptystate">
              <EmptyArt />
              <h2>Checkout online belum aktif</h2>
              <p>Pesan langsung lewat WhatsApp, tim kami siap membantu.</p>
              <a className="btn btn-wa" href={waLink(settings)} target="_blank" rel="noopener noreferrer"><MessageCircle size={18} aria-hidden="true" /> Chat WhatsApp</a>
            </div>
          </>
        )}
      </main>
    </StoreShell>
  );
}
