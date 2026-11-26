import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { ChevronRight } from 'lucide-react';
import { getData } from '@/lib/data';
import { money } from '@/lib/format';
import { siteUrl } from '@/lib/site';
import { SiteFooter, SiteHeader } from '@/components/site-chrome';
import ProductBuy from '@/components/product-buy';
import { ProductCard } from '@/components/product-card';
import { productSoldOut, startingPrice } from '@/lib/variants';
import { safeUrl } from '@/lib/safe';
import { clip, jsonLdScript } from '@/lib/seo';
import { qrisReady } from '@/lib/payments';
import { toCard } from '@/lib/catalog';

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
  const price = startingPrice(p);
  const title = `${p.name}${p.sku ? ` (${p.sku})` : ''}: Goodie Bag ${p.category}`;
  const description = clip(`${p.name}${p.size ? ` ukuran ${p.size}` : ''}${price > 0 ? `, harga mulai ${money(price)}/pcs` : ''}, minimal order ${p.min_order} pcs. ${p.description}`);
  const img = safeUrl(p.image_url);
  return { title, description, alternates: { canonical: `/produk/${p.slug}` }, openGraph: { type: 'website', title, description, url: `/produk/${p.slug}`, images: img ? [{ url: img, alt: p.name }] : undefined } };
}

export default async function ProductPage({ params }: Props) {
  const { slug } = await params;
  const { settings, products, product: p, checkoutEnabled } = await load(slug);
  if (!p) notFound();
  const others = products.filter(x => x.id !== p.id);
  const related = [...others.filter(x => x.category === p.category), ...others.filter(x => x.category !== p.category)].slice(0, 4).map(toCard);
  const url = `${siteUrl}/produk/${p.slug}`;
  const catUrl = `${siteUrl}/kategori/${p.category.toLowerCase()}`;
  const images = [p.image_url, ...(p.images ?? []), ...p.colors.map(c => c.image_url), ...p.motifs.map(m => m.image_url)].map(u => safeUrl(u)).filter(Boolean);
  const price = startingPrice(p);
  const sizes = p.sizes ?? [];
  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      { '@type': 'BreadcrumbList', itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Beranda', item: siteUrl },
        { '@type': 'ListItem', position: 2, name: p.category, item: catUrl },
        { '@type': 'ListItem', position: 3, name: p.name, item: url } ] },
      {
        '@type': 'Product', '@id': `${url}#product`, name: p.name, description: p.description, category: `Goodie bag ${p.category}`, sku: p.sku || p.slug, url,
        ...(images.length ? { image: Array.from(new Set(images)).slice(0, 6) } : {}),
        ...(p.colors.length ? { color: p.colors.map(c => c.name).join(', ') } : {}),
        ...(p.size ? { size: p.size } : {}),
        brand: { '@type': 'Brand', name: settings.company_name.replace(/^PT\s+/i, '') },
        // Tanpa harga → tidak ada "offers" (Google menolak penawaran berharga 0)
        ...(price > 0 ? { offers: {
          '@type': 'Offer', url, priceCurrency: 'IDR', price, itemCondition: 'https://schema.org/NewCondition',
          availability: productSoldOut(p) ? 'https://schema.org/OutOfStock' : 'https://schema.org/InStock',
          eligibleQuantity: { '@type': 'QuantitativeValue', minValue: p.min_order, unitText: 'pcs' },
          seller: { '@id': `${siteUrl}/#org` },
        } } : {}),
      },
    ],
  };
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={jsonLdScript(jsonLd)} />
      <SiteHeader settings={settings} checkout={checkoutEnabled} />
      <main className="container pdp">
        <nav className="crumbs" aria-label="Breadcrumb"><a href="/">Beranda</a><ChevronRight size={14} /><a href="/produk">Katalog</a><ChevronRight size={14} /><a href={`/kategori/${p.category.toLowerCase()}`}>{p.category}</a><ChevronRight size={14} /><span aria-current="page">{p.name}</span></nav>
        <ProductBuy product={p} settings={settings} checkout={checkoutEnabled} qris={checkoutEnabled && qrisReady()} />

        <section className="pdpinfo" aria-labelledby="desc-title">
          <div>
            <h2 id="desc-title">Deskripsi</h2>
            <p>{p.description}{p.is_customizable && ' Bisa dicustom dengan logo, motif, dan ukuran sesuai brand kamu.'}</p>
          </div>
          <div>
            <h2>Spesifikasi</h2>
            <dl className="spectable">
              {p.sku && <div><dt>Kode SKU</dt><dd>{p.sku}</dd></div>}
              <div><dt>Kategori</dt><dd>{p.category}</dd></div>
              {sizes.length > 0
                ? <div><dt>Ukuran tersedia</dt><dd>{sizes.map(s => s.name).join(' · ')}</dd></div>
                : p.size && <div><dt>Ukuran</dt><dd>{p.size}</dd></div>}
              <div><dt>Minimum order</dt><dd>{p.min_order.toLocaleString('id-ID')} pcs</dd></div>
              <div><dt>Custom logo / motif</dt><dd>{p.is_customizable ? 'Bisa, konsultasi via WhatsApp' : 'Tidak tersedia untuk desain ini'}</dd></div>
              <div><dt>Dikirim dari</dt><dd>{settings.address}</dd></div>
            </dl>
          </div>
        </section>

        {related.length > 0 && (
          <section className="related" aria-labelledby="rel-title">
            <div className="sechead"><h2 id="rel-title">Produk serupa</h2><a className="seclink" href={`/kategori/${p.category.toLowerCase()}`}>Lihat semua {p.category.toLowerCase()}</a></div>
            <div className="pgrid">{related.map(r => <ProductCard key={r.id} p={r} />)}</div>
          </section>
        )}
      </main>
      <SiteFooter settings={settings} checkout={checkoutEnabled} />
    </>
  );
}
