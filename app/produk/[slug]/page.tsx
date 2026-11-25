import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { ChevronRight } from 'lucide-react';
import { getData } from '@/lib/data';
import { money } from '@/lib/format';
import { siteUrl } from '@/lib/site';
import { SiteFooter, SiteHeader } from '@/components/site-chrome';
import ProductBuy from '@/components/product-buy';
import { ProductCard } from '@/components/catalog-grid';
import { productSoldOut, startingPrice } from '@/lib/variants';
import { safeUrl } from '@/lib/safe';
import { clip, jsonLdScript } from '@/lib/seo';
import { qrisReady } from '@/lib/payments';

type Props = { params: Promise<{ slug: string }> };

export const revalidate = 300;
// Halaman produk dibuat saat pertama kali dibuka lalu di-cache (produk baru langsung punya halaman)
export const generateStaticParams = async () => [];

async function load(slug: string) {
  const data = await getData();
  return { ...data, product: data.products.find(p => p.slug === slug) };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const { product: p } = await load(slug);
  if (!p) return { title: 'Produk tidak ditemukan', robots: { index: false } };
  const title = `${p.name}: Goodie Bag ${p.category} ${p.size}`;
  const description = clip(`${p.name} ukuran ${p.size}, harga mulai ${money(startingPrice(p))}/pcs, minimal order ${p.min_order} pcs. ${p.description}`);
  const img = safeUrl(p.image_url);
  return { title, description, alternates: { canonical: `/produk/${p.slug}` }, openGraph: { type: 'website', title, description, url: `/produk/${p.slug}`, images: img ? [{ url: img, alt: p.name }] : undefined } };
}

export default async function ProductPage({ params }: Props) {
  const { slug } = await params;
  const { settings, products, product: p, checkoutEnabled } = await load(slug);
  if (!p) notFound();
  const sameCat = products.filter(x => x.id !== p.id && x.category === p.category);
  const related = [...sameCat, ...products.filter(x => x.id !== p.id && x.category !== p.category)].slice(0, 4);
  const url = `${siteUrl}/produk/${p.slug}`;
  const catUrl = `${siteUrl}/kategori/${p.category.toLowerCase()}`;
  const images = [p.image_url, ...p.colors.map(c => c.image_url), ...p.motifs.map(m => m.image_url)].map(u => safeUrl(u)).filter(Boolean);
  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      { '@type': 'BreadcrumbList', itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Beranda', item: siteUrl },
        { '@type': 'ListItem', position: 2, name: p.category, item: catUrl },
        { '@type': 'ListItem', position: 3, name: p.name, item: url } ] },
      {
        '@type': 'Product', '@id': `${url}#product`, name: p.name, description: p.description, category: `Goodie bag ${p.category}`, sku: p.slug, url,
        ...(images.length ? { image: Array.from(new Set(images)).slice(0, 6) } : {}),
        ...(p.colors.length ? { color: p.colors.map(c => c.name).join(', ') } : {}),
        ...(p.size ? { size: p.size } : {}),
        brand: { '@type': 'Brand', name: settings.company_name.replace(/^PT\s+/i, '') },
        offers: {
          '@type': 'Offer', url, priceCurrency: 'IDR', price: startingPrice(p), itemCondition: 'https://schema.org/NewCondition',
          availability: productSoldOut(p) ? 'https://schema.org/OutOfStock' : 'https://schema.org/InStock',
          eligibleQuantity: { '@type': 'QuantitativeValue', minValue: p.min_order, unitText: 'pcs' },
          seller: { '@id': `${siteUrl}/#org` },
        },
      },
    ],
  };
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={jsonLdScript(jsonLd)} />
      <SiteHeader settings={settings} checkout={checkoutEnabled} />
      <main className="container pdp">
        <nav className="crumbs" aria-label="Breadcrumb"><a href="/">Beranda</a><ChevronRight size={14} /><a href={`/kategori/${p.category.toLowerCase()}`}>{p.category}</a><ChevronRight size={14} /><span aria-current="page">{p.name}</span></nav>
        <ProductBuy product={p} settings={settings} checkout={checkoutEnabled} qris={checkoutEnabled && qrisReady()} />
        {related.length > 0 && (
          <section className="related" aria-labelledby="rel-title">
            <h2 id="rel-title">Produk lainnya</h2>
            <div className="productgrid">{related.map(r => <ProductCard key={r.id} p={r} />)}</div>
          </section>
        )}
      </main>
      <SiteFooter settings={settings} checkout={checkoutEnabled} />
    </>
  );
}
