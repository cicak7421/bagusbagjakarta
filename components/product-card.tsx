import type { CardProduct } from '@/lib/catalog';
import { money } from '@/lib/format';
import { responsiveImg } from '@/lib/img';

/** Kartu produk katalog. Tanpa hook, jadi bisa dipakai di server maupun di dalam komponen client. */
export function ProductCard({ p, priority = false }: { p: CardProduct; priority?: boolean }) {
  const inquiry = !(p.price > 0);
  const sizes = '(max-width: 640px) 50vw, (max-width: 1000px) 33vw, 25vw';
  return (
    <article className="pc">
      <a className={p.image2 ? 'pc-img has2' : 'pc-img'} href={`/produk/${p.slug}`} tabIndex={-1} aria-hidden="true">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        {p.image && <img {...responsiveImg(p.image, [256, 384, 640], sizes)} alt="" width={600} height={600} loading={priority ? 'eager' : 'lazy'} decoding="async" />}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        {p.image2 && <img className="pc-img2" {...responsiveImg(p.image2, [256, 384, 640], sizes)} alt="" width={600} height={600} loading="lazy" decoding="async" />}
        {p.sku && <span className="pc-sku">{p.sku}</span>}
        {!inquiry && p.soldOut && <span className="pc-flag out">Stok habis</span>}
      </a>
      <div className="pc-body">
        <span className="pc-cat">{p.category}{p.sizes > 1 ? ` · ${p.sizes} ukuran` : p.size ? ` · ${p.size}` : ''}</span>
        <h3 className="pc-name"><a href={`/produk/${p.slug}`}>{p.name}</a></h3>
        {inquiry
          ? <div className="pc-price ask">Tanya harga</div>
          : <div className="pc-price">{p.from && <small>mulai </small>}{money(p.price)}<small> /pcs</small></div>}
        <div className="pc-meta">
          {inquiry ? <span>Cek stok via WhatsApp</span>
            : <><span className={p.soldOut ? 'dot out' : 'dot'} />{p.soldOut ? 'Stok habis' : `Stok ${p.stock.toLocaleString('id-ID')}`}<span className="sep">·</span>Min. {p.moq}</>}
        </div>
      </div>
    </article>
  );
}
