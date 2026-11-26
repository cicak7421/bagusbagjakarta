import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { ChevronRight, MessageCircle } from 'lucide-react';
import { getData } from '@/lib/data';
import { waLink } from '@/lib/wa';
import { siteUrl } from '@/lib/site';
import { categories, type CategorySlug } from '@/lib/categories';
import { SiteFooter, SiteHeader } from '@/components/site-chrome';
import Catalog from '@/components/catalog';
import { toCard } from '@/lib/catalog';
import { jsonLdScript } from '@/lib/seo';

type Props = { params: Promise<{ slug: string }> };
export const dynamicParams = false;
export const revalidate = 300;
export const generateStaticParams = () => Object.keys(categories).map(slug => ({ slug }));

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const c = categories[slug as CategorySlug];
  if (!c) return {};
  return { title: `${c.h1}: Ready Stock & Harga Reseller`, description: c.desc, alternates: { canonical: `/kategori/${slug}` }, openGraph: { title: c.h1, description: c.desc, url: `/kategori/${slug}` } };
}

export default async function CategoryPage({ params }: Props) {
  const { slug } = await params;
  const c = categories[slug as CategorySlug];
  if (!c) notFound();
  const { settings, products, checkoutEnabled } = await getData();
  const cards = products.filter(p => p.category === c.name).map(toCard);
  const url = `${siteUrl}/kategori/${slug}`;
  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      { '@type': 'BreadcrumbList', itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Beranda', item: siteUrl },
        { '@type': 'ListItem', position: 2, name: 'Katalog', item: `${siteUrl}/produk` },
        { '@type': 'ListItem', position: 3, name: c.name, item: url } ] },
      { '@type': 'CollectionPage', name: c.h1, description: c.desc, url, mainEntity: { '@type': 'ItemList', numberOfItems: cards.length, itemListElement: cards.slice(0, 60).map((p, i) => ({ '@type': 'ListItem', position: i + 1, url: `${siteUrl}/produk/${p.slug}`, name: p.name })) } },
    ],
  };
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={jsonLdScript(jsonLd)} />
      <SiteHeader settings={settings} checkout={checkoutEnabled} />
      <main className="container shop">
        <nav className="crumbs" aria-label="Breadcrumb"><a href="/">Beranda</a><ChevronRight size={14} /><a href="/produk">Katalog</a><ChevronRight size={14} /><span aria-current="page">{c.name}</span></nav>
        <header className="pagehead"><h1>{c.h1}</h1><p>{c.desc}</p></header>
        <div className="chips" aria-label="Kategori lain">
          <a href="/produk" className="chip">Semua</a>
          {Object.entries(categories).map(([s, x]) => <a key={s} href={`/kategori/${s}`} className={s === slug ? 'chip active' : 'chip'} aria-current={s === slug ? 'page' : undefined}>{x.name}</a>)}
        </div>
        {cards.length
          ? <Catalog products={cards} lockCategory={c.name} />
          : <p className="pdpdesc">Produk {c.name} belum tersedia di katalog. Hubungi kami untuk permintaan khusus.</p>}
        <section className="catabout"><h2>Tentang {c.name.toLowerCase()} dari kami</h2><p>{c.body}</p><a className="primary" href={waLink(settings)} target="_blank" rel="noopener noreferrer">Konsultasi custom <MessageCircle size={18} /></a></section>
      </main>
      <SiteFooter settings={settings} checkout={checkoutEnabled} />
    </>
  );
}
