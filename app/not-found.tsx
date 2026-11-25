import type { Metadata } from 'next';
import { getData } from '@/lib/data';
import { SiteFooter, SiteHeader } from '@/components/site-chrome';

export const metadata: Metadata = { title: 'Halaman tidak ditemukan', robots: { index: false } };

export default async function NotFound() {
  const { settings, checkoutEnabled } = await getData();
  return (
    <>
      <SiteHeader settings={settings} checkout={checkoutEnabled} />
      <main className="container shop">
        <div className="empty">
          <h1>Halaman tidak ditemukan</h1>
          <p>Halaman yang kamu cari sudah dipindahkan atau tidak tersedia.</p>
          <a className="primary" href="/#produk">Lihat katalog</a>
        </div>
      </main>
      <SiteFooter settings={settings} checkout={checkoutEnabled} />
    </>
  );
}
