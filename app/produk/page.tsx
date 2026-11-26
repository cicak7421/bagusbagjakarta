import type { Metadata } from 'next';
import { ChevronRight } from 'lucide-react';
import { getData } from '@/lib/data';
import { siteUrl } from '@/lib/site';
import { waLink } from '@/lib/wa';
import { money } from '@/lib/format';
import { categories } from '@/lib/categories';
import { StoreShell, catalogMoq } from '@/components/site-chrome';
import Catalog from '@/components/catalog';
import { toCard } from '@/lib/catalog';
import { jsonLdScript } from '@/lib/seo';

export const revalidate = 300;

export const metadata: Metadata = {
  title: 'Katalog Goodie Bag: Spunbond, Paperbag, Coolerbag',
  description: 'Katalog lengkap goodie bag ready stock: tas spunbond aneka motif, paper bag premium, dan cooler bag. Lihat ukuran, harga per pcs, dan stok, lalu pesan langsung.',
  alternates: { canonical: '/produk' },
  openGraph: { title: 'Katalog Goodie Bag', url: '/produk' },
};

export default async function CatalogPage() {
  const { settings, products, checkoutEnabled } = await getData();
  const cards = products.map(toCard);
  const priced = cards.filter(p => p.price > 0);
  const fromPrice = priced.length ? Math.min(...priced.map(p => p.price)) : 0;
  const minMoq = cards.length ? Math.min(...cards.map(p => p.moq)) : 0;
  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      { '@type': 'BreadcrumbList', itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Beranda', item: siteUrl },
        { '@type': 'ListItem', position: 2, name: 'Katalog', item: `${siteUrl}/produk` } ] },
      { '@type': 'CollectionPage', name: 'Katalog goodie bag', url: `${siteUrl}/produk`, mainEntity: { '@type': 'ItemList', numberOfItems: cards.length, itemListElement: cards.slice(0, 60).map((p, i) => ({ '@type': 'ListItem', position: i + 1, url: `${siteUrl}/produk/${p.slug}`, name: p.name })) } },
    ],
  };
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={jsonLdScript(jsonLd)} />
      <StoreShell settings={settings} checkout={checkoutEnabled} search={false} active="/produk" moq={catalogMoq(products)}>
        <main id="konten" className="container catpage">
          <nav className="crumbs" aria-label="Breadcrumb"><a href="/">Beranda</a><ChevronRight size={14} aria-hidden="true" /><span aria-current="page">Katalog</span></nav>
          <header className="pagehead">
            <h1>Katalog goodie bag</h1>
            {/* Satu kalimat pendek: di HP muat dua baris utuh. Jenis tas sudah terbaca di tab kategori tepat di bawahnya. */}
            <p className="pagehead-desc">Harga per pcs, minimum order, dan stok tertera di tiap produk.</p>
            <p className="pagefacts">
              <span>{cards.length.toLocaleString('id-ID')} desain</span>
              {fromPrice > 0 && <span>mulai {money(fromPrice)} /pcs</span>}
              {minMoq > 0 && <span>min. {minMoq.toLocaleString('id-ID')} pcs</span>}
            </p>
          </header>
          <nav className="tabs" aria-label="Kategori produk">
            <a href="/produk" aria-current="page">Semua <small>{cards.length.toLocaleString('id-ID')}</small></a>
            {Object.entries(categories).map(([slug, c]) => (
              <a key={slug} href={`/kategori/${slug}`}>{c.name} <small>{cards.filter(p => p.category === c.name).length.toLocaleString('id-ID')}</small></a>
            ))}
          </nav>
          <Catalog products={cards} waHref={waLink(settings)} />
        </main>
      </StoreShell>
    </>
  );
}
