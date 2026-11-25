'use client';
import { useEffect, useState } from 'react';
import { ArrowRight, Minus, Plus, ShoppingBag, Trash2 } from 'lucide-react';
import { cartTotal, removeFromCart, setCartQty, useCart, type CartItem } from '@/lib/cart';
import { money } from '@/lib/format';
import { optimizedSrc } from '@/lib/img';
import { safeUrl } from '@/lib/safe';

export const lineLabel = (i: CartItem) => [i.size, i.color, i.motif ? `Motif ${i.motif}` : ''].filter(Boolean).join(' · ');

function QtyInput({ item }: { item: CartItem }) {
  const [text, setText] = useState(String(item.qty));
  useEffect(() => setText(String(item.qty)), [item.qty]);
  const step = item.min_order >= 100 ? 50 : item.min_order >= 20 ? 10 : 1;
  return (
    <div className="qty small">
      <button type="button" onClick={() => setCartQty(item.key, item.qty - step)} disabled={item.qty <= item.min_order} aria-label="Kurangi jumlah"><Minus size={14} /></button>
      <input inputMode="numeric" pattern="[0-9]*" value={text} aria-label={`Jumlah ${item.name}`}
        onChange={e => setText(e.target.value.replace(/\D/g, '').slice(0, 6))} onBlur={() => setCartQty(item.key, Number(text))} />
      <button type="button" onClick={() => setCartQty(item.key, item.qty + step)} aria-label="Tambah jumlah"><Plus size={14} /></button>
    </div>
  );
}

export default function CartView() {
  const items = useCart();
  // Hindari kedipan "keranjang kosong" sebelum localStorage terbaca
  const [ready, setReady] = useState(false);
  useEffect(() => setReady(true), []);
  if (!ready) return <div className="empty" aria-busy="true"><span className="spin" /></div>;

  if (!items.length) return (
    <div className="empty"><ShoppingBag size={36} aria-hidden="true" /><p>Keranjang kamu masih kosong.</p><a className="primary" href="/#produk">Lihat katalog</a></div>
  );
  return (
    <div className="ordergrid">
      <ul className="lines cartlines">
        {items.map(i => (
          <li key={i.key}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            {safeUrl(i.image) ? <img src={optimizedSrc(safeUrl(i.image), 256)} alt="" width={84} height={84} loading="lazy" /> : <span className="noimg64" />}
            <span className="ln-main">
              <b><a href={`/produk/${i.slug}`}>{i.name}</a></b>
              <small>{lineLabel(i) || i.category}</small>
              <small>{money(i.unit)} /pcs · min. {i.min_order.toLocaleString('id-ID')} pcs</small>
              <span className="ln-actions"><QtyInput item={i} /><button type="button" className="linkbtn danger" onClick={() => removeFromCart(i.key)}><Trash2 size={15} /> Hapus</button></span>
            </span>
            <b className="ln-total">{money(i.unit * i.qty)}</b>
          </li>
        ))}
      </ul>
      <aside className="orderside">
        <div className="paypanel">
          <h2>Ringkasan</h2>
          <dl className="sums">
            <div><dt>Subtotal ({items.length} barang)</dt><dd>{money(cartTotal(items))}</dd></div>
            <div><dt>Ongkos kirim</dt><dd>Dikonfirmasi admin</dd></div>
          </dl>
          <a className="primary full" href="/checkout">Lanjut ke checkout <ArrowRight size={17} /></a>
          <p className="paynote small">Harga dan stok dicek ulang saat checkout.</p>
        </div>
      </aside>
    </div>
  );
}
