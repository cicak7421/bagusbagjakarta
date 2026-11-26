import { Images } from 'lucide-react';
import type { CardProduct } from '@/lib/catalog';
import { money } from '@/lib/format';
import { responsiveImg } from '@/lib/img';

/**
 * Ambang "Sisa … pcs": stok di bawah LOW_FACTOR x minimum order ditandai menipis.
 * Ubah angkanya untuk menggeser ambang, atau isi 0 untuk mematikan penanda ini.
 */
const LOW_FACTOR = 2;

const pcs = (n: number) => `${n.toLocaleString('id-ID')} pcs`;

/** Teks dan gaya penanda stok. Dipakai sama di semua kartu supaya urutan dan bahasanya seragam. */
function stockInfo(p: CardProduct): { cls: string; text: string } {
  if (p.soldOut) return { cls: 'stock out', text: 'Stok habis' };
  if (LOW_FACTOR > 0 && p.stock < LOW_FACTOR * p.moq) return { cls: 'stock low', text: `Sisa ${pcs(p.stock)}` };
  return { cls: 'stock', text: `Stok ${pcs(p.stock)}` };
}

/**
 * Kartu produk katalog. Tanpa hook, jadi bisa dipakai di server maupun di dalam komponen client.
 * Seluruh kartu adalah satu target klik (link di nama produk direntangkan menutupi kartu).
 * `priority`: true = gambar dimuat langsung (di atas lipatan); 'high' = gambar utama halaman (hanya satu per halaman).
 */
export function ProductCard({ p, priority = false }: { p: CardProduct; priority?: boolean | 'high' }) {
  const inquiry = !(p.price > 0);
  const out = !inquiry && p.soldOut;
  const sizes = '(max-width: 639px) 50vw, (max-width: 1199px) 33vw, 300px';
  const stock = stockInfo(p);
  return (
    <article className={out ? 'pc is-out' : 'pc'}>
      <div className={p.image2 ? 'pc-img has2' : 'pc-img'}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        {p.image && <img {...responsiveImg(p.image, [256, 384, 640], sizes)} alt="" width={600} height={600} loading={priority ? 'eager' : 'lazy'} fetchPriority={priority === 'high' ? 'high' : undefined} decoding="async" />}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        {p.image2 && <img className="pc-img2" {...responsiveImg(p.image2, [256, 384, 640], sizes)} alt="" width={600} height={600} loading="lazy" decoding="async" />}
        {out && <span className="badge badge--ink pc-flag">Stok habis</span>}
        {p.image2 && <span className="pc-count" aria-hidden="true"><Images size={14} /></span>}
      </div>
      <div className="pc-body">
        <p className="pc-cat">
          {p.category}{p.sku ? ` · ${p.sku}` : ''}
          {p.sizes > 1 ? <span className="pc-sizes"> · {p.sizes} ukuran</span> : p.size ? <span className="pc-sizes"> · {p.size}</span> : null}
        </p>
        <h3 className="pc-name"><a href={`/produk/${p.slug}`}>{p.name}</a></h3>
        {inquiry
          ? <div className="pc-price ask">Tanya harga</div>
          : <div className="pc-price">{p.from && <small>mulai </small>}{money(p.price)}<small> /pcs</small></div>}
        <div className="pc-meta">
          {inquiry
            ? <span className="pc-ask">Cek stok via WhatsApp</span>
            : <><span className="moq">Min. {pcs(p.moq)}</span><span className={stock.cls}>{stock.text}</span></>}
        </div>
      </div>
    </article>
  );
}
