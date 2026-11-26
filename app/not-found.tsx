import type { Metadata } from 'next';
import { ArrowRight } from 'lucide-react';
import { getData } from '@/lib/data';
import { categories } from '@/lib/categories';
import { EmptyArt, StoreShell, catalogMoq } from '@/components/site-chrome';

export const metadata: Metadata = { title: 'Halaman tidak ditemukan', robots: { index: false } };

export default async function NotFound() {
  const { settings, products, checkoutEnabled } = await getData();
  return (
    <StoreShell settings={settings} checkout={checkoutEnabled} moq={catalogMoq(products)}>
      <main id="konten" className="container notfound">
        <div className="emptystate">
          <EmptyArt />
          <h1>Halaman tidak ditemukan</h1>
          <p>Halaman yang kamu cari sudah dipindahkan atau tidak tersedia.</p>
          <a className="btn btn-primary" href="/produk">Lihat katalog <ArrowRight size={18} aria-hidden="true" /></a>
          <nav className="chips" aria-label="Kategori produk">
            {Object.entries(categories).map(([slug, c]) => <a key={slug} className="chip" href={`/kategori/${slug}`}>{c.name}</a>)}
          </nav>
        </div>
      </main>
    </StoreShell>
  );
}
