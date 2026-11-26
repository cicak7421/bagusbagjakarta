import type { Metadata } from 'next';
import { ChevronRight } from 'lucide-react';
import { getData } from '@/lib/data';
import { siteUrl } from '@/lib/site';
import { SiteFooter, SiteHeader } from '@/components/site-chrome';
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
      <SiteHeader settings={settings} checkout={checkoutEnabled} />
      <main className="container shop">
        <nav className="crumbs" aria-label="Breadcrumb"><a href="/">Beranda</a><ChevronRight size={14} /><span aria-current="page">Katalog</span></nav>
        <header className="pagehead"><h1>Katalog goodie bag</h1><p>{cards.length} desain spunbond, paperbag, dan coolerbag. Harga per pcs, minimum order tertera di tiap produk.</p></header>
        <Catalog products={cards} />
      </main>
      <SiteFooter settings={settings} checkout={checkoutEnabled} />
    </>
  );
}
