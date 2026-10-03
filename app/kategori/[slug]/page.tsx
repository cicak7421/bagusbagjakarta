import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { ArrowRight, ChevronRight, MessageCircle } from 'lucide-react';
import { getData } from '@/lib/data';
import { money, waLink } from '@/lib/wa';
import { siteUrl } from '@/lib/site';
import { categories, type CategorySlug } from '@/lib/categories';

type Props = { params: Promise<{ slug: string }> };
export const dynamicParams = false;
export const generateStaticParams = () => Object.keys(categories).map(slug => ({ slug }));

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const c = categories[slug as CategorySlug];
  if (!c) return {};
  return { title: `${c.h1} — Ready Stock & Harga Reseller`, description: c.desc.slice(0, 160), alternates: { canonical: `/kategori/${slug}` }, openGraph: { title: c.h1, description: c.desc, url: `/kategori/${slug}` } };
}

export default async function CategoryPage({ params }: Props) {
  const { slug } = await params;
  const c = categories[slug as CategorySlug];
  if (!c) notFound();
  const { settings, products } = await getData();
  const items = products.filter(p => p.category === c.name);
  const url = `${siteUrl}/kategori/${slug}`;
  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      { '@type': 'BreadcrumbList', itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Beranda', item: siteUrl },
        { '@type': 'ListItem', position: 2, name: c.name, item: url } ] },
      { '@type': 'CollectionPage', name: c.h1, description: c.desc, url, mainEntity: { '@type': 'ItemList', itemListElement: items.map((p, i) => ({ '@type': 'ListItem', position: i + 1, url: `${siteUrl}/produk/${p.slug}`, name: p.name })) } },
    ],
  };
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c') }} />
      <header className="nav">
        <nav className="container navin" aria-label="Navigasi utama">
          <a className="brand" href="/"><span className="brandmark">T</span><span>Tre Joy Ease <b>Indonesia</b></span></a>
          <div className="navlinks"><a href="/#produk">Produk</a><a href="/#custom">Custom</a><a href="/#about">Tentang</a><a href="/#faq">FAQ</a><a href="/#kontak">Kontak</a></div>
          <a className="navcta" href={waLink(settings)} target="_blank" rel="noopener noreferrer">Chat WhatsApp <ArrowRight size={16} /></a>
        </nav>
      </header>
      <main className="container pdp">
        <nav className="crumbs" aria-label="Breadcrumb"><a href="/">Beranda</a><ChevronRight size={14} /><span aria-current="page">{c.name}</span></nav>
        <div className="sectionhead">
          <div><span className="kicker">Kategori</span><h1 className="cathead">{c.h1}</h1></div>
          <p>{c.desc}</p>
        </div>
        <div className="filters" aria-label="Kategori lain">
          {Object.entries(categories).map(([s, x]) => <a key={s} href={`/kategori/${s}`} className={s === slug ? 'chip active' : 'chip'} aria-current={s === slug ? 'page' : undefined}>{x.name}</a>)}
        </div>
        {items.length ? (
          <div className="productgrid">
            {items.map(p => (
              <article className="card" key={p.id}>
                <div className="cardimg">{/* eslint-disable-next-line @next/next/no-img-element */}<img src={p.image_url} alt={`${p.name} — goodie bag ${p.category.toLowerCase()} ukuran ${p.size}`} width={600} height={510} loading="lazy" /><span>{p.category}</span></div>
                <div className="cardbody">
                  <div className="stock"><span className={p.stock_qty > 0 ? 'dot' : 'dot out'} />{p.stock_qty > 0 ? `${p.stock_qty.toLocaleString('id-ID')} pcs tersedia` : 'Pre-order'}</div>
                  <h2 className="cardtitle"><a href={`/produk/${p.slug}`}>{p.name}</a></h2>
                  <p>{p.description}</p>
                  <div className="spec"><span>Ukuran<b>{p.size}</b></span><span>MOQ<b>{p.min_order} pcs</b></span></div>
                  <div className="cardfoot"><div className="price">{money(p.price)} <small>/pcs</small></div><a className="cardbtn" href={`/produk/${p.slug}`}>Detail <ArrowRight size={15} /></a></div>
                </div>
              </article>
            ))}
          </div>
        ) : <p className="pdpdesc">Produk {c.name} belum tersedia di katalog. Hubungi kami untuk permintaan khusus.</p>}
        <section className="catabout"><h2>Tentang {c.name.toLowerCase()} dari kami</h2><p>{c.body}</p><a className="primary" href={waLink(settings)} target="_blank" rel="noopener noreferrer">Konsultasi Custom <MessageCircle size={18} /></a></section>
      </main>
      <footer><div className="container"><div className="footgrid"><div><a className="brand" href="/"><span className="brandmark">T</span><span>Tre Joy Ease <b>Indonesia</b></span></a><p>{settings.tagline}</p></div><nav className="footnav" aria-label="Navigasi footer"><a href="/#produk">Produk</a>{Object.entries(categories).map(([s, x]) => <a key={s} href={`/kategori/${s}`}>{x.name}</a>)}<a href="/#kontak">Kontak</a></nav></div><div className="copy">© {new Date().getFullYear()} {settings.company_name}. Semua hak dilindungi.</div></div></footer>
    </>
  );
}
