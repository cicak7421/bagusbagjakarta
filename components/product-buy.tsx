'use client';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Bell, Check, MessageCircle, Minus, Plus, ShieldCheck, ShoppingBag, Truck } from 'lucide-react';
import type { Product, SiteSettings, VariantOption } from '@/lib/types';
import { money } from '@/lib/format';
import { waLink } from '@/lib/wa';
import { safeUrl, toInt } from '@/lib/safe';
import { optimizedSrc, responsiveImg } from '@/lib/img';
import { effectiveStock, isLight, unitPrice } from '@/lib/variants';
import { addToCart } from '@/lib/cart';
import { Swatch } from '@/components/swatch';
import { PaymentOptions } from '@/components/payment-options';

const MAX_QTY = 100000;
type Shot = { src: string; label: string; kind?: 'color' | 'motif'; idx?: number };

function firstAvailable(list: VariantOption[], p: Product) {
  const i = list.findIndex(o => (o.stock_qty ?? p.stock_qty) > 0);
  return list.length ? Math.max(0, i) : -1;
}

export default function ProductBuy({ product: p, settings, checkout = false, qris = false }: { product: Product; settings: SiteSettings; checkout?: boolean; qris?: boolean }) {
  const sizes = useMemo(() => p.sizes ?? [], [p.sizes]);
  const [ci, setCi] = useState(() => firstAvailable(p.colors, p));
  const [mi, setMi] = useState(() => firstAvailable(p.motifs, p));
  const [si, setSi] = useState(() => firstAvailable(p.sizes ?? [], p));
  const [qtyText, setQtyText] = useState(String(p.min_order));

  const color = ci >= 0 ? p.colors[ci] : null;
  const motif = mi >= 0 ? p.motifs[mi] : null;
  const size = si >= 0 ? sizes[si] : null;
  const sizeLabel = size?.name || p.size;
  const qty = Math.min(MAX_QTY, Math.max(p.min_order, toInt(qtyText, p.min_order)));
  const unit = unitPrice(p, color, motif, size);
  const inquiry = !(unit > 0);            // belum ada harga → hanya lewat WhatsApp
  const stock = effectiveStock(p, color, motif, size);
  const soldOut = !inquiry && stock <= 0;
  const over = !inquiry && !soldOut && qty > stock;
  const total = unit * qty;

  // Galeri: foto utama, foto tambahan, lalu foto varian
  const gallery = useMemo(() => {
    const seen = new Set<string>();
    const list: Shot[] = [];
    const add = (src: string | undefined, label: string, kind?: Shot['kind'], idx?: number) => { const s = safeUrl(src); if (s && !seen.has(s)) { seen.add(s); list.push({ src: s, label, kind, idx }); } };
    add(p.image_url, p.name);
    (p.images ?? []).forEach((u, i) => add(u, `${p.name}, foto ${i + 2}`));
    p.colors.forEach((o, i) => add(o.image_url, `${p.name}, warna ${o.name}`, 'color', i));
    p.motifs.forEach((o, i) => add(o.image_url, `${p.name}, motif ${o.name}`, 'motif', i));
    sizes.forEach(o => add(o.image_url, `${p.name}, ukuran ${o.name}`));
    return list;
  }, [p, sizes]);
  const [pickedImg, setPickedImg] = useState<string | null>(null);
  const variantImg = safeUrl(motif?.image_url) || safeUrl(size?.image_url) || safeUrl(color?.image_url);
  const mainImg = pickedImg || variantImg || safeUrl(p.image_url);

  // Foto lama tetap tampil sampai foto baru selesai dimuat (tidak ada kotak kosong saat ganti foto)
  const [shownImg, setShownImg] = useState(mainImg);
  const [imgLoading, setImgLoading] = useState(false);
  useEffect(() => {
    if (mainImg === shownImg) { setImgLoading(false); return; }
    if (!mainImg) { setShownImg(''); setImgLoading(false); return; }
    let live = true;
    const done = () => { if (live) { setShownImg(mainImg); setImgLoading(false); } };
    setImgLoading(true);
    const im = new window.Image();
    im.onload = done; im.onerror = done;
    im.src = optimizedSrc(mainImg, 1080);
    if (im.complete) done();
    return () => { live = false; };
  }, [mainImg, shownImg]);

  const pickThumb = (g: Shot) => {
    if (g.kind === 'color' && g.idx !== undefined) { setCi(g.idx); setPickedImg(null); }
    else if (g.kind === 'motif' && g.idx !== undefined) { setMi(g.idx); setPickedImg(null); }
    else setPickedImg(g.src);
  };
  const imgBox = useRef<HTMLDivElement>(null);
  const thumbRow = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const box = thumbRow.current;
    const el = box?.querySelector<HTMLElement>('button.on');
    if (!box || !el || box.scrollWidth <= box.clientWidth) return;
    box.scrollTo({ left: el.offsetLeft - (box.clientWidth - el.offsetWidth) / 2, behavior: 'smooth' });
  }, [mainImg]);

  const sel = { color, motif, size, qty, unit: inquiry ? undefined : unit };
  const orderHref = waLink(settings, p, { ...sel, intent: 'order' });
  const notifyHref = waLink(settings, p, { ...sel, intent: 'notify' });
  const customHref = waLink(settings, p, { ...sel, intent: 'custom' });

  const setQty = (n: number) => setQtyText(String(Math.min(MAX_QTY, Math.max(p.min_order, n))));
  const step = p.min_order >= 100 ? 50 : p.min_order >= 20 ? 10 : 1;
  const quick = [1, 2, 5, 10].map(m => m * p.min_order).filter(n => n <= MAX_QTY);

  // Checkout online hanya untuk jumlah yang stoknya siap; di atas stok tetap lewat WhatsApp (pre-order)
  const canCart = checkout && !inquiry && !soldOut && !over;
  const [added, setAdded] = useState<'' | 'ok' | 'full'>('');
  const put = () => addToCart({
    product_id: p.id, slug: p.slug, name: p.name, category: p.category, image: shownImg || safeUrl(p.image_url),
    color: color?.name ?? null, motif: motif?.name ?? null, size: size?.name ?? null, unit, qty, min_order: p.min_order,
  });
  const addCart = () => setAdded(put() ? 'ok' : 'full');
  const buyNow = () => { if (put()) location.href = '/checkout'; else setAdded('full'); };

  const waLabel = inquiry ? 'Tanya harga & stok via WhatsApp' : canCart ? 'Tanya / pesan via WhatsApp' : 'Pesan via WhatsApp';
  const waBtn = <a className={canCart ? 'outline full' : 'primary full'} href={orderHref} target="_blank" rel="noopener noreferrer">{waLabel} <MessageCircle size={18} /></a>;

  return (
    <div className="pdpgrid">
      <div className="gallery">
        <div className="pdpimg" ref={imgBox}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          {shownImg ? <img key={shownImg} {...responsiveImg(shownImg, [640, 828, 1080], '(max-width: 900px) 100vw, 50vw')} alt={`${p.name}${color ? ` warna ${color.name}` : ''}${motif ? ` motif ${motif.name}` : ''}, goodie bag ${p.category.toLowerCase()}${sizeLabel ? ` ukuran ${sizeLabel}` : ''}`} width={900} height={900} fetchPriority="high" /> : <div className="noimg">Foto belum tersedia</div>}
          {imgLoading && <span className="imgbusy" role="status" aria-label="Memuat foto"><span className="spin" /></span>}
        </div>
        {gallery.length > 1 && (
          <div className="thumbs" role="group" aria-label="Foto produk" ref={thumbRow}>
            {gallery.map(g => (
              <button key={g.src} type="button" className={g.src === mainImg ? 'on' : ''} onClick={() => pickThumb(g)} aria-label={g.label} aria-pressed={g.src === mainImg}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={optimizedSrc(g.src, 256)} alt="" width={72} height={72} loading="lazy" />
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="buy">
        <div className="buy-top">
          <a className="kicker" href={`/kategori/${p.category.toLowerCase()}`}>{p.category}</a>
          {p.sku && <span className="skuchip">SKU {p.sku}</span>}
        </div>
        <h1>{p.name}</h1>

        <div className="pricebox">
          {inquiry ? (
            <><div className="modalprice ask">Tanya harga</div><div className="pricehint">Harga dan stok produk ini dikonfirmasi admin lewat WhatsApp.</div></>
          ) : (
            <>
              <div className="modalprice">{money(unit)} <small>/pcs</small></div>
              <div className={soldOut ? 'stockline out' : 'stockline'}><span className={soldOut ? 'dot out' : 'dot'} />{soldOut ? 'Stok habis untuk pilihan ini' : `${stock.toLocaleString('id-ID')} pcs siap kirim`}</div>
            </>
          )}
        </div>

        {p.colors.length > 0 && (
          <fieldset className="opt">
            <legend>Warna <span>{color?.name}</span></legend>
            <div className="swatches" role="radiogroup" aria-label="Pilih warna">
              {p.colors.map((o, i) => {
                const out = (o.stock_qty ?? p.stock_qty) <= 0;
                return (
                  <button key={o.name + i} type="button" role="radio" aria-checked={i === ci} className={`sw${i === ci ? ' on' : ''}${out ? ' out' : ''}`} onClick={() => { setCi(i); setPickedImg(null); }} title={out ? `${o.name} (habis)` : o.name} aria-label={`${o.name}${out ? ', stok habis' : ''}`}>
                    <Swatch option={o} />
                    {i === ci && <Check size={16} className={isLight(o.hex) ? 'chk dark' : 'chk'} />}
                  </button>
                );
              })}
            </div>
          </fieldset>
        )}

        {sizes.length > 0 && (
          <fieldset className="opt">
            <legend>Ukuran <span>{size?.name}</span></legend>
            <div className="sizes" role="radiogroup" aria-label="Pilih ukuran">
              {sizes.map((o, i) => {
                const st = o.stock_qty ?? p.stock_qty;
                const out = st <= 0;
                return (
                  <button key={o.name + i} type="button" role="radio" aria-checked={i === si} className={`sz${i === si ? ' on' : ''}${out ? ' out' : ''}`} onClick={() => { setSi(i); setPickedImg(null); }} aria-label={`${o.name}${out ? ', stok habis' : ''}`}>
                    <span className="szname">{o.name}</span>
                    <span className="szsub">{money(o.price || p.price)}</span>
                    <span className="szstock">{out ? 'Habis' : `Stok ${st.toLocaleString('id-ID')}`}</span>
                  </button>
                );
              })}
            </div>
          </fieldset>
        )}

        {p.motifs.length > 0 && (
          <fieldset className="opt">
            <legend>Motif <span>{motif?.name}</span></legend>
            <div className="motifs" role="radiogroup" aria-label="Pilih motif">
              {p.motifs.map((o, i) => {
                const out = (o.stock_qty ?? p.stock_qty) <= 0;
                return (
                  <button key={o.name + i} type="button" role="radio" aria-checked={i === mi} className={`mt${i === mi ? ' on' : ''}${out ? ' out' : ''}`} onClick={() => { setMi(i); setPickedImg(null); }}>
                    <Swatch option={o} shape="square" preferImage />
                    <span className="mtname">{o.name}</span>
                    <span className="mtsub">{out ? 'Habis' : o.price_add ? `+${money(o.price_add)}` : 'Gratis'}</span>
                  </button>
                );
              })}
            </div>
          </fieldset>
        )}

        <fieldset className="opt">
          <legend>Jumlah <span>min. {p.min_order.toLocaleString('id-ID')} pcs</span></legend>
          <div className="qtyrow">
            <div className="qty">
              <button type="button" onClick={() => setQty(qty - step)} disabled={qty <= p.min_order} aria-label="Kurangi jumlah"><Minus size={16} /></button>
              <input inputMode="numeric" pattern="[0-9]*" value={qtyText} onChange={e => setQtyText(e.target.value.replace(/\D/g, '').slice(0, 6))} onBlur={() => setQty(qty)} aria-label="Jumlah pesanan (pcs)" />
              <button type="button" onClick={() => setQty(qty + step)} aria-label="Tambah jumlah"><Plus size={16} /></button>
            </div>
            <div className="qtyquick" aria-label="Jumlah cepat">{quick.map(n => <button key={n} type="button" className={qty === n ? 'on' : ''} onClick={() => setQty(n)}>{n.toLocaleString('id-ID')}</button>)}</div>
          </div>
          {over && <p className="qtynote">Jumlah melebihi stok siap kirim ({stock.toLocaleString('id-ID')} pcs). Sisanya masuk antrean produksi, pesan lewat WhatsApp supaya admin bisa konfirmasi waktunya.</p>}
        </fieldset>

        {!inquiry && (
          <div className="totalbox">
            <span>Total {qty.toLocaleString('id-ID')} pcs<small>belum termasuk ongkos kirim</small></span>
            <b>{money(total)}</b>
          </div>
        )}

        <div className="ctas desktop-cta">
          {soldOut ? (
            <>
              <button className="primary full disabledbtn" disabled aria-disabled="true">Stok habis</button>
              <div className="soldlinks">
                <a className="remind" href={notifyHref} target="_blank" rel="noopener noreferrer"><Bell size={15} /> Ingatkan saya</a>
                {p.is_customizable && <a className="remind" href={customHref} target="_blank" rel="noopener noreferrer">Tanya produksi custom</a>}
              </div>
            </>
          ) : canCart ? (
            <>
              <div className="cartbtns">
                <button type="button" className="primary" onClick={buyNow}>Beli sekarang</button>
                <button type="button" className="outline" onClick={addCart}><ShoppingBag size={18} /> Keranjang</button>
              </div>
              {added && <p className={added === 'ok' ? 'addednote' : 'addednote warn'} role="status">{added === 'ok' ? <>Masuk keranjang. <a href="/keranjang">Lihat keranjang</a></> : 'Keranjang penuh (maksimal 20 jenis barang).'}</p>}
              {waBtn}
            </>
          ) : waBtn}
        </div>

        <ul className="assure">
          <li><Truck size={18} aria-hidden="true" /><span>Dikirim dari {settings.address}. Ongkos kirim dikonfirmasi admin.</span></li>
          <li><ShieldCheck size={18} aria-hidden="true" /><span>Barang rusak atau tidak sesuai bisa dikomplain. <a href="/kebijakan-pengembalian">Lihat kebijakan</a></span></li>
        </ul>

        <details className="paybox">
          <summary>Metode pembayaran</summary>
          <PaymentOptions qris={qris} />
          <p className="pdpnote">{settings.payment_info}</p>
        </details>
      </div>

      {/* Bar bawah (mobile): foto + total di kiri, tombol di kanan */}
      <div className="buybar" role="region" aria-label="Ringkasan pesanan">
        <div className="buybar-info">
          <button type="button" className="buybar-thumb" aria-label="Lihat foto produk" onClick={() => imgBox.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            {shownImg ? <img src={optimizedSrc(shownImg, 256)} alt="" /> : null}
          </button>
          <div className="buybar-price">
            <b>{inquiry ? 'Tanya harga' : money(total)}</b>
            <span>{[`${qty.toLocaleString('id-ID')} pcs`, size?.name, color?.name, motif?.name].filter(Boolean).join(' · ')}</span>
          </div>
        </div>
        {soldOut
          ? <a className="primary remind-btn" href={notifyHref} target="_blank" rel="noopener noreferrer"><Bell size={16} /> Ingatkan</a>
          : canCart ? <button type="button" className="primary" onClick={buyNow}>Beli sekarang</button>
          : <a className="primary" href={orderHref} target="_blank" rel="noopener noreferrer">{inquiry ? 'Tanya' : 'Pesan'} <MessageCircle size={16} /></a>}
      </div>
    </div>
  );
}
