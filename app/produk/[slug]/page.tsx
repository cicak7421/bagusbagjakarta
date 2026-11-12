import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { ArrowRight, ChevronRight } from 'lucide-react';
import { getData } from '@/lib/data';
import { money } from '@/lib/format';
import { siteUrl } from '@/lib/site';
import { SiteFooter, SiteHeader } from '@/components/site-chrome';
import ProductBuy from '@/components/product-buy';
import { Swatch } from '@/components/swatch';
import { productSoldOut } from '@/lib/variants';
import { safeUrl } from '@/lib/safe';

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
  return { title, description, alternates: { canonical: `/produk/${p.slug}` }, openGraph: { type: 'website', title, description, url: `/produk/${p.slug}`, images: safeUrl(p.image_url) ? [{ url: safeUrl(p.image_url), alt: p.name }] : undefined } };
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
      { '@type': 'Product', name: p.name, description: p.description, category: p.category, image: safeUrl(p.image_url) || undefined, sku: p.slug, ...(p.colors.length ? { color: p.colors.map(c => c.name).join(', ') } : {}), brand: { '@type': 'Brand', name: settings.company_name },
        offers: { '@type': 'Offer', url, priceCurrency: 'IDR', price: p.price, availability: productSoldOut(p) ? 'https://schema.org/OutOfStock' : 'https://schema.org/InStock', eligibleQuantity: { '@type': 'QuantitativeValue', minValue: p.min_order }, seller: { '@type': 'Organization', name: settings.company_name } } },
    ],
  };
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c') }} />
      <SiteHeader settings={settings} />
      <main className="container pdp">
        <nav className="crumbs" aria-label="Breadcrumb"><a href="/">Beranda</a><ChevronRight size={14} /><a href={`/kategori/${p.category.toLowerCase()}`}>{p.category}</a><ChevronRight size={14} /><span aria-current="page">{p.name}</span></nav>
        <ProductBuy product={p} settings={settings} />
        {related.length > 0 && (
          <section className="related" aria-labelledby="rel-title">
            <h2 id="rel-title">Produk lainnya</h2>
            <div className="productgrid">
              {related.map(r => (
                <article className="card" key={r.id}>
                  <div className="cardimg">{/* eslint-disable-next-line @next/next/no-img-element */}<img src={safeUrl(r.image_url)} alt={`${r.name} — goodie bag ${r.category.toLowerCase()}`} width={600} height={510} loading="lazy" /><span>{r.category}</span></div>
                  <div className="cardbody">{r.colors.length > 0 && <div className="dots" aria-label={`${r.colors.length} pilihan warna`}>{r.colors.slice(0, 5).map(o => <Swatch key={o.name} option={o} />)}</div>}<h3><a href={`/produk/${r.slug}`}>{r.name}</a></h3><div className="cardfoot"><div className="price">{money(r.price)} <small>/pcs</small></div><a className="cardbtn" href={`/produk/${r.slug}`}>Detail <ArrowRight size={15} /></a></div></div>
                </article>
              ))}
            </div>
          </section>
        )}
      </main>
      <SiteFooter settings={settings} />
    </>
  );
}
