import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { ArrowRight, ChevronRight, MessageCircle } from 'lucide-react';
import { getData } from '@/lib/data';
import { money, waLink } from '@/lib/wa';
import { siteUrl } from '@/lib/site';
import { categories } from '@/lib/categories';

type Props = { params: Promise<{ slug: string }> };

async function load(slug: string) {
  const { settings, products } = await getData();
  return { settings, products, product: products.find(p => p.slug === slug) };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const { product: p } = await load(slug);
  if (!p) return { title: 'Produk tidak ditemukan', robots: { index: false } };
  const title = `${p.name} — Goodie Bag ${p.category} Custom`;
  const description = `${p.name} ukuran ${p.size}, MOQ ${p.min_order} pcs, harga ${money(p.price)}/pcs. ${p.description}`.slice(0, 160);
  return { title, description, alternates: { canonical: `/produk/${p.slug}` }, openGraph: { type: 'website', title, description, url: `/produk/${p.slug}`, images: p.image_url ? [{ url: p.image_url, alt: p.name }] : undefined } };
}

export default async function ProductPage({ params }: Props) {
  const { slug } = await params;
  const { settings, products, product: p } = await load(slug);
  if (!p) notFound();
  const related = products.filter(x => x.id !== p.id).slice(0, 3);
  const url = `${siteUrl}/produk/${p.slug}`;
  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      { '@type': 'BreadcrumbList', itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Beranda', item: siteUrl },
        { '@type': 'ListItem', position: 2, name: p.category, item: `${siteUrl}/kategori/${p.category.toLowerCase()}` },
        { '@type': 'ListItem', position: 3, name: p.name, item: url } ] },
      { '@type': 'Product', name: p.name, description: p.description, category: p.category, image: p.image_url, sku: p.slug, brand: { '@type': 'Brand', name: settings.company_name },
        offers: { '@type': 'Offer', url, priceCurrency: 'IDR', price: p.price, availability: p.stock_qty > 0 ? 'https://schema.org/InStock' : 'https://schema.org/PreOrder', eligibleQuantity: { '@type': 'QuantitativeValue', minValue: p.min_order }, seller: { '@type': 'Organization', name: settings.company_name } } },
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
        <nav className="crumbs" aria-label="Breadcrumb"><a href="/">Beranda</a><ChevronRight size={14} /><a href={`/kategori/${p.category.toLowerCase()}`}>{p.category}</a><ChevronRight size={14} /><span aria-current="page">{p.name}</span></nav>
        <div className="pdpgrid">
          <div className="pdpimg">{/* eslint-disable-next-line @next/next/no-img-element */}<img src={p.image_url} alt={`${p.name} — goodie bag ${p.category.toLowerCase()} ukuran ${p.size}`} width={900} height={900} fetchPriority="high" /></div>
          <div>
            <span className="kicker">{p.category}</span>
            <h1>{p.name}</h1>
            <div className="stock"><span className={p.stock_qty > 0 ? 'dot' : 'dot out'} />{p.stock_qty > 0 ? `${p.stock_qty.toLocaleString('id-ID')} pcs tersedia` : 'Pre-order'}</div>
            <p className="pdpdesc">{p.description}{p.is_customizable && ' Bisa dicustom dengan logo, motif, dan ukuran sesuai brand kamu.'}</p>
            <div className="modalrow"><span>Ukuran<b>{p.size}</b></span><span>MOQ<b>{p.min_order} pcs</b></span><span>Kategori<b>{p.category}</b></span></div>
            <div className="modalprice">{money(p.price)} <small>/pcs</small></div>
            <a className="primary full" href={waLink(settings, p)} target="_blank" rel="noopener noreferrer">Tanya Produk Ini <MessageCircle size={18} /></a>
            <p className="pdpnote">{settings.payment_info}</p>
          </div>
        </div>
        {related.length > 0 && (
          <section className="related" aria-labelledby="rel-title">
            <h2 id="rel-title">Produk lainnya</h2>
            <div className="productgrid">
              {related.map(r => (
                <article className="card" key={r.id}>
                  <div className="cardimg">{/* eslint-disable-next-line @next/next/no-img-element */}<img src={r.image_url} alt={`${r.name} — goodie bag ${r.category.toLowerCase()}`} width={600} height={510} loading="lazy" /><span>{r.category}</span></div>
                  <div className="cardbody"><h3><a href={`/produk/${r.slug}`}>{r.name}</a></h3><div className="cardfoot"><div className="price">{money(r.price)} <small>/pcs</small></div><a className="cardbtn" href={`/produk/${r.slug}`}>Detail <ArrowRight size={15} /></a></div></div>
                </article>
              ))}
            </div>
          </section>
        )}
      </main>
      <footer><div className="container"><div className="footgrid"><div><a className="brand" href="/"><span className="brandmark">T</span><span>Tre Joy Ease <b>Indonesia</b></span></a><p>{settings.tagline}</p></div><nav className="footnav" aria-label="Navigasi footer"><a href="/#produk">Produk</a><a href="/#custom">Custom</a>{Object.entries(categories).map(([k, x]) => <a key={k} href={`/kategori/${k}`}>{x.name}</a>)}<a href="/#kontak">Kontak</a></nav></div><div className="copy">© {new Date().getFullYear()} {settings.company_name}. Semua hak dilindungi.</div></div></footer>
    </>
  );
}
