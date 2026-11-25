'use client';
import { useState } from 'react';
import type { Product } from '@/lib/types';
import { money } from '@/lib/format';
import { safeUrl } from '@/lib/safe';
import { responsiveImg } from '@/lib/img';
import { productSoldOut, startingPrice } from '@/lib/variants';
import { Swatch } from '@/components/swatch';

/** Satu kartu produk (dipakai di beranda, kategori, dan "produk lainnya"). */
export function ProductCard({ p, priority = false }: { p: Product; priority?: boolean }) {
  const sold = productSoldOut(p);
  const sizes = p.sizes ?? [];
  const from = sizes.some(s => s.price) && startingPrice(p) < Math.max(...sizes.map(s => s.price || p.price));
  return (
    <article className="card">
      <a className="cardimg" href={`/produk/${p.slug}`} tabIndex={-1} aria-hidden="true">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        {safeUrl(p.image_url) && <img {...responsiveImg(safeUrl(p.image_url), [256, 384, 640], '(max-width: 640px) 50vw, (max-width: 1000px) 33vw, 25vw')} alt={`${p.name}, goodie bag ${p.category.toLowerCase()} ukuran ${p.size}`} width={600} height={600} loading={priority ? 'eager' : 'lazy'} decoding="async" />}
        {sold && <span className="soldtag">Stok habis</span>}
      </a>
      <div className="cardbody">
        {(p.colors.length > 0 || p.motifs.length > 0) && (
          <div className="dots" aria-label={`${p.colors.length} warna, ${p.motifs.length} motif`}>
            {p.colors.slice(0, 5).map(o => <Swatch key={o.name} option={o} />)}
            {p.colors.length > 5 && <small>+{p.colors.length - 5}</small>}
            {p.motifs.length > 0 && <small className="motifcount">{p.motifs.length} motif</small>}
          </div>
        )}
        <small className="cat2">{p.category} · {p.size}</small>
        <h3><a href={`/produk/${p.slug}`}>{p.name}</a></h3>
        <div className="cardfoot"><div className="price">{from && <small>mulai </small>}{money(startingPrice(p))} <small>/pcs</small></div></div>
        <div className="stock"><span className={sold ? 'dot out' : 'dot'} />{sold ? 'Stok habis' : `Stok ${p.stock_qty.toLocaleString('id-ID')}`} · MOQ {p.min_order}</div>
      </div>
    </article>
  );
}

/** Katalog dengan filter kategori. Satu-satunya bagian beranda yang butuh JavaScript untuk berfungsi. */
export default function CatalogGrid({ products }: { products: Product[] }) {
  const [filter, setFilter] = useState('Semua');
  const categories = ['Semua', ...Array.from(new Set(products.map(p => p.category)))];
  const shown = filter === 'Semua' ? products : products.filter(p => p.category === filter);
  return (
    <>
      <div className="filters" role="group" aria-label="Filter kategori">
        {categories.map(c => <button key={c} type="button" className={filter === c ? 'active' : ''} aria-pressed={filter === c} onClick={() => setFilter(c)}>{c}</button>)}
      </div>
      <div className="productgrid">{shown.map(p => <ProductCard key={p.id} p={p} />)}</div>
    </>
  );
}
