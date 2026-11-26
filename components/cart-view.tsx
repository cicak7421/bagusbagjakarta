'use client';
import { useEffect, useRef, useState } from 'react';
import { ArrowRight, Info, Minus, Plus, Trash2 } from 'lucide-react';
import { addToCart, cartTotal, removeFromCart, setCartQty, useCart, type CartItem } from '@/lib/cart';
import { categories } from '@/lib/categories';
import { money } from '@/lib/format';
import { optimizedSrc } from '@/lib/img';
import { safeUrl } from '@/lib/safe';

export const lineLabel = (i: CartItem) => [i.size, i.color, i.motif ? `Motif ${i.motif}` : ''].filter(Boolean).join(' · ');

const num = (n: number) => n.toLocaleString('id-ID');
export const cartPcs = (items: CartItem[]) => items.reduce((a, x) => a + x.qty, 0);
const UNDO_MS = 6000;

/** Keadaan kosong keranjang (dipakai juga di checkout). `art` = ilustrasi dari halaman server (<EmptyArt />). */
export function CartEmpty({ art, title = 'Keranjang kamu masih kosong', text = 'Pilih desain dari katalog untuk mulai memesan.' }: { art?: React.ReactNode; title?: string; text?: string }) {
  return (
    <div className="emptystate">
      {art}
      <h2>{title}</h2>
      <p>{text}</p>
      <a className="btn btn-primary" href="/produk">Lihat katalog <ArrowRight size={18} aria-hidden="true" /></a>
      <div className="chips" aria-label="Kategori">
        {Object.entries(categories).map(([slug, c]) => <a key={slug} className="chip" href={`/kategori/${slug}`}>{c.name}</a>)}
      </div>
    </div>
  );
}

function QtyInput({ item }: { item: CartItem }) {
  const [text, setText] = useState(String(item.qty));
  useEffect(() => setText(String(item.qty)), [item.qty]);
  const step = item.min_order >= 100 ? 50 : item.min_order >= 20 ? 10 : 1;
  return (
    <div className="qty">
      <button type="button" onClick={() => setCartQty(item.key, item.qty - step)} disabled={item.qty <= item.min_order} aria-label={`Kurangi ${num(step)} pcs`}><Minus size={16} aria-hidden="true" /></button>
      <input inputMode="numeric" pattern="[0-9]*" value={text} aria-label={`Jumlah ${item.name} (pcs)`}
        onChange={e => setText(e.target.value.replace(/\D/g, '').slice(0, 6))} onBlur={() => setCartQty(item.key, Number(text))}
        onKeyDown={e => { if (e.key === 'Enter') e.currentTarget.blur(); }} />
      <button type="button" onClick={() => setCartQty(item.key, item.qty + step)} aria-label={`Tambah ${num(step)} pcs`}><Plus size={16} aria-hidden="true" /></button>
    </div>
  );
}

/**
 * Isi halaman keranjang: kepala halaman, daftar barang, ringkasan, dan bar bawah (HP).
 * `shipNote` dan `art` dikirim dari halaman server supaya komponen kerangka toko tidak ikut ke bundel browser.
 */
export default function CartView({ shipNote, art }: { shipNote?: React.ReactNode; art?: React.ReactNode }) {
  const items = useCart();
  // Hindari kedipan "keranjang kosong" sebelum localStorage terbaca
  const [ready, setReady] = useState(false);
  useEffect(() => setReady(true), []);

  // Urungkan hapus: simpan barang terakhir yang dihapus selama beberapa detik
  const [undo, setUndo] = useState<CartItem | null>(null);
  const undoTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => () => { if (undoTimer.current) clearTimeout(undoTimer.current); }, []);
  function remove(item: CartItem) {
    removeFromCart(item.key);
    setUndo(item);
    if (undoTimer.current) clearTimeout(undoTimer.current);
    undoTimer.current = setTimeout(() => setUndo(null), UNDO_MS);
  }
  function restore() {
    if (!undo) return;
    const { key, ...rest } = undo;
    void key;
    addToCart(rest);
    if (undoTimer.current) clearTimeout(undoTimer.current);
    setUndo(null);
  }

  const total = cartTotal(items);
  const pcs = cartPcs(items);
  const filled = ready && items.length > 0;

  return (
    <>
      <header className="shophead">
        <div>
          <h1>Keranjang</h1>
          <p>{filled ? <span className="num">{items.length} jenis barang · {num(pcs)} pcs</span> : 'Periksa barang dan jumlahnya sebelum checkout.'}</p>
        </div>
        <a className="linkbtn" href="/produk">Lanjut belanja <ArrowRight size={16} aria-hidden="true" /></a>
      </header>

      <div className="cart-undo" role="status">
        {undo && (
          <p className="msg">
            <Info aria-hidden="true" />
            <span>Barang dihapus: {undo.name}.</span>
            <button type="button" className="linkbtn" onClick={restore}>Urungkan</button>
          </p>
        )}
      </div>

      {!ready ? (
        <div className="ordergrid" aria-busy="true">
          <span className="vh">Memuat keranjang…</span>
          <div className="cart-skel" aria-hidden="true"><span className="skel" /><span className="skel" /></div>
          <div className="cart-skel-side skel" aria-hidden="true" />
          <div className="stickybar" aria-hidden="true">
            <div className="stickybar-info"><span className="skel cart-skel-total" /></div>
            <span className="btn btn-primary disabledbtn">Checkout</span>
          </div>
        </div>
      ) : !items.length ? (
        <CartEmpty art={art} />
      ) : (
        <div className="ordergrid">
          <ul className="lines cartlines" aria-label="Barang di keranjang">
            {items.map(i => (
              <li key={i.key}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                {safeUrl(i.image) ? <img src={optimizedSrc(safeUrl(i.image), 256)} alt="" width={96} height={96} loading="lazy" /> : <span className="noimg64" />}
                <div className="ln-main">
                  <a className="ln-name" href={`/produk/${i.slug}`}>{i.name}</a>
                  <span className="ln-var">{lineLabel(i) || i.category}</span>
                  <span className="ln-unit"><span className="num">{money(i.unit)} /pcs</span><span className="moq">Min. {num(i.min_order)} pcs</span></span>
                </div>
                <div className="ln-actions">
                  <QtyInput item={i} />
                  <button type="button" className="btn btn-icon btn-icon--bare ln-del" onClick={() => remove(i)} aria-label={`Hapus ${i.name}`}><Trash2 size={18} aria-hidden="true" /></button>
                </div>
                <b className="ln-total">{money(i.unit * i.qty)}</b>
              </li>
            ))}
          </ul>

          <aside className="orderside" aria-label="Ringkasan keranjang">
            <div className="paypanel receipt">
              <h2>Ringkasan</h2>
              <dl className="sums">
                <div><dt>Subtotal ({items.length} jenis · {num(pcs)} pcs)</dt><dd>{money(total)}</dd></div>
                <div><dt>Ongkos kirim</dt><dd><span className="badge">Dikonfirmasi admin</span></dd></div>
                <div className="grand"><dt>Total barang</dt><dd>{money(total)}</dd></div>
              </dl>
              <a className="btn btn-primary btn-lg btn-block only-lg" href="/checkout">Lanjut ke checkout <ArrowRight size={18} aria-hidden="true" /></a>
              {shipNote}
              <p className="paynote small">Harga dan stok dicek ulang saat checkout.</p>
            </div>
          </aside>

          <div className="stickybar">
            <div className="stickybar-info">
              <span className="stickybar-total">{money(total)}</span>
              <span className="stickybar-sub">{num(pcs)} pcs · belum ongkir</span>
            </div>
            <a className="btn btn-primary" href="/checkout">Checkout <ArrowRight size={18} aria-hidden="true" /></a>
          </div>
        </div>
      )}
    </>
  );
}
