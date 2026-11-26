import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { ArrowRight, ChevronRight } from 'lucide-react';
import { getData } from '@/lib/data';
import { money } from '@/lib/format';
import { siteUrl } from '@/lib/site';
import { ShipNote, StoreShell, catalogMoq } from '@/components/site-chrome';
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
  const catHref = `/kategori/${p.category.toLowerCase()}`;
  const pcs = (n: number) => `${n.toLocaleString('id-ID')} pcs`;
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={jsonLdScript(jsonLd)} />
      <StoreShell settings={settings} checkout={checkoutEnabled} bar active={catHref} moq={catalogMoq(products)}>
        <main id="konten" className="container pdp">
          <nav className="crumbs" aria-label="Breadcrumb">
            <a href="/">Beranda</a><ChevronRight size={14} aria-hidden="true" />
            <a href="/produk">Katalog</a><ChevronRight size={14} aria-hidden="true" />
            <a href={catHref}>{p.category}</a><ChevronRight size={14} aria-hidden="true" />
            <span aria-current="page">{p.name}</span>
          </nav>
          <ProductBuy product={p} settings={settings} checkout={checkoutEnabled} qris={checkoutEnabled && qrisReady()} shipNote={<ShipNote settings={settings} compact />} />

          <section className="pdpinfo" aria-labelledby="desc-title">
            <div className="pdp-desc">
              <h2 id="desc-title">Deskripsi</h2>
              <p>{p.description}{p.is_customizable && ' Bisa dicustom dengan logo, motif, dan ukuran sesuai brand kamu.'}</p>
            </div>
            <div className="card speccard">
              <h2 id="spec-title">Spesifikasi</h2>
              <dl className="spectable" aria-labelledby="spec-title">
                {p.sku && <div><dt>Kode SKU</dt><dd>{p.sku}</dd></div>}
                <div><dt>Kategori</dt><dd>{p.category}</dd></div>
                {sizes.length > 0
                  ? <div><dt>Ukuran tersedia</dt><dd>{sizes.map(s => s.name).join(' · ')}</dd></div>
                  : p.size && <div><dt>Ukuran</dt><dd>{p.size}</dd></div>}
                {p.colors.length > 0 && <div><dt>Pilihan warna</dt><dd>{p.colors.map(c => c.name).join(' · ')}</dd></div>}
                {p.motifs.length > 0 && <div><dt>Pilihan motif</dt><dd>{p.motifs.map(m => m.name).join(' · ')}</dd></div>}
                <div><dt>Minimum order</dt><dd>{pcs(p.min_order)}</dd></div>
                <div><dt>Custom logo / motif</dt><dd>{p.is_customizable ? 'Bisa, konsultasi via WhatsApp' : 'Tidak tersedia untuk desain ini'}</dd></div>
                <div><dt>Dikirim dari</dt><dd>{settings.address}</dd></div>
              </dl>
              {sizes.length > 1 && (
                <div className="pricetable-wrap">
                  <h3 id="size-title">Harga per ukuran</h3>
                  <div className="pricetable-scroll">
                    <table className="pricetable" aria-labelledby="size-title">
                      <thead><tr><th scope="col">Ukuran</th><th scope="col">Harga /pcs</th><th scope="col">Stok</th></tr></thead>
                      <tbody>
                        {sizes.map((s, i) => {
                          const sizePrice = s.price || p.price;
                          const sizeStock = s.stock_qty ?? p.stock_qty;
                          return (
                            <tr key={s.name + i}>
                              <th scope="row">{s.name}</th>
                              <td>{sizePrice > 0 ? money(sizePrice) : 'Tanya harga'}</td>
                              <td className={sizeStock > 0 ? undefined : 'is-out'}>{sizeStock > 0 ? pcs(sizeStock) : 'Habis'}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          </section>

          {related.length > 0 && (
            <section className="related" aria-labelledby="rel-title">
              <div className="sechead">
                <div><p className="seclabel">Katalog</p><h2 id="rel-title">Produk serupa</h2></div>
                <a className="seclink" href={catHref}>Lihat semua {p.category.toLowerCase()} <ArrowRight size={16} aria-hidden="true" /></a>
              </div>
              <div className="pgrid">{related.map(r => <ProductCard key={r.id} p={r} />)}</div>
            </section>
          )}
        </main>
      </StoreShell>
    </>
  );
}
