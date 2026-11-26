import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { ChevronRight, MessageCircle } from 'lucide-react';
import { getData } from '@/lib/data';
import { waLink } from '@/lib/wa';
import { siteUrl } from '@/lib/site';
import { money } from '@/lib/format';
import { categories, type CategorySlug } from '@/lib/categories';
import { EmptyArt, StoreShell, catalogMoq } from '@/components/site-chrome';
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
  const priced = cards.filter(p => p.price > 0);
  const fromPrice = priced.length ? Math.min(...priced.map(p => p.price)) : 0;
  const minMoq = cards.length ? Math.min(...cards.map(p => p.moq)) : 0;
  const wa = waLink(settings);
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
      <StoreShell settings={settings} checkout={checkoutEnabled} search={false} active={`/kategori/${slug}`} moq={catalogMoq(products)}>
        <main id="konten" className="container catpage">
          <nav className="crumbs" aria-label="Breadcrumb"><a href="/">Beranda</a><ChevronRight size={14} aria-hidden="true" /><a href="/produk">Katalog</a><ChevronRight size={14} aria-hidden="true" /><span aria-current="page">{c.name}</span></nav>
          <header className="pagehead">
            <h1>{c.h1}</h1>
            {/* dipotong dua baris di HP: uraian lengkapnya ada di blok "Tentang ... dari kami" di bawah */}
            <p className="pagehead-desc pagehead-desc--clamp">{c.desc}</p>
            {cards.length > 0 && (
              <p className="pagefacts">
                <span>{cards.length.toLocaleString('id-ID')} desain</span>
                {fromPrice > 0 && <span>mulai {money(fromPrice)} /pcs</span>}
                {minMoq > 0 && <span>min. {minMoq.toLocaleString('id-ID')} pcs</span>}
              </p>
            )}
          </header>
          <nav className="tabs" aria-label="Kategori produk">
            <a href="/produk">Semua <small>{products.length.toLocaleString('id-ID')}</small></a>
            {Object.entries(categories).map(([s, x]) => (
              <a key={s} href={`/kategori/${s}`} aria-current={s === slug ? 'page' : undefined}>{x.name} <small>{products.filter(p => p.category === x.name).length.toLocaleString('id-ID')}</small></a>
            ))}
          </nav>
          {cards.length
            ? <Catalog products={cards} lockCategory={c.name} waHref={wa} />
            : (
              <div className="emptystate">
                <EmptyArt />
                <h2>Produk {c.name} belum tersedia</h2>
                <p>Kategori ini belum punya produk di katalog. Hubungi kami untuk permintaan khusus.</p>
                <div className="btnrow">
                  <a className="btn btn-outline" href="/produk">Lihat semua produk</a>
                  <a className="btn btn-wa-outline" href={wa} target="_blank" rel="noopener noreferrer"><MessageCircle size={18} aria-hidden="true" /> Tanya via WhatsApp</a>
                </div>
              </div>
            )}
          <section className="catabout" aria-labelledby="catabout-title">
            <div className="catabout-text">
              <h2 id="catabout-title">Tentang {c.name.toLowerCase()} dari kami</h2>
              <p>{c.body}</p>
            </div>
            <aside className="panel-soft catabout-cta" aria-labelledby="catabout-cta-title">
              <h3 id="catabout-cta-title">Butuh custom?</h3>
              <p>Ukuran, motif, dan logo bisa disesuaikan dengan brand kamu.</p>
              <a className="btn btn-wa-outline" href={wa} target="_blank" rel="noopener noreferrer"><MessageCircle size={18} aria-hidden="true" /> Konsultasi custom via WhatsApp</a>
            </aside>
          </section>
        </main>
      </StoreShell>
    </>
  );
}
