'use client';
import { useEffect, useMemo, useRef, useState } from 'react';
import type { KeyboardEvent, ReactNode } from 'react';
import { AlertTriangle, BadgeCheck, Bell, Check, CheckCircle2, MapPin, MessageCircle, Minus, Plus, ShieldCheck, ShoppingBag } from 'lucide-react';
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
/**
 * Ambang "Sisa … pcs" (hanya tampilan, sama dengan kartu produk): stok di bawah LOW_FACTOR x minimum order
 * ditandai menipis. Ubah angkanya untuk menggeser ambang, atau isi 0 untuk mematikan penanda ini.
 */
const LOW_FACTOR = 2;
/** Lama pesan "Masuk keranjang" tampil di atas bar bawah (HP). Samakan dengan durasi animasi .buytoast di pdp.css. */
const TOAST_MS = 4000;

type Shot = { src: string; label: string; kind?: 'color' | 'motif'; idx?: number };

const pcs = (n: number) => `${n.toLocaleString('id-ID')} pcs`;
const scrollMode = (): ScrollBehavior => (window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth');

function firstAvailable(list: VariantOption[], p: Product) {
  const i = list.findIndex(o => (o.stock_qty ?? p.stock_qty) > 0);
  return list.length ? Math.max(0, i) : -1;
}

/**
 * Keyboard untuk grup pilihan (warna, ukuran, motif): hanya pilihan aktif yang masuk urutan Tab,
 * panah kiri/kanan/atas/bawah (juga Home/End) memindah pilihan sekaligus fokusnya.
 * Tombol pilihan harus anak langsung dari pembungkus role="radiogroup".
 */
function radioKeys(count: number, current: number, pick: (i: number) => void) {
  return (e: KeyboardEvent<HTMLButtonElement>) => {
    const dir = e.key === 'ArrowRight' || e.key === 'ArrowDown' ? 1 : e.key === 'ArrowLeft' || e.key === 'ArrowUp' ? -1 : 0;
    const next = e.key === 'Home' ? 0 : e.key === 'End' ? count - 1 : dir ? (current + dir + count) % count : -1;
    if (next < 0 || next === current) return;
    e.preventDefault();
    pick(next);
    (e.currentTarget.parentElement?.children[next] as HTMLElement | undefined)?.focus();
  };
}

export default function ProductBuy({ product: p, settings, checkout = false, qris = false, shipNote }: {
  product: Product; settings: SiteSettings; checkout?: boolean; qris?: boolean;
  /** Info ongkos kirim (<ShipNote />) yang dirender di server, tampil tepat di bawah kartu beli. */
  shipNote?: ReactNode;
}) {
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
  const low = !soldOut && LOW_FACTOR > 0 && stock < LOW_FACTOR * p.min_order;

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
  const shotNo = gallery.findIndex(g => g.src === mainImg) + 1;

  // Foto lama tetap tampil sampai foto baru selesai dimuat (tidak ada kotak kosong saat ganti foto)
  const [shownImg, setShownImg] = useState(mainImg);
  const [imgLoading, setImgLoading] = useState(false);
  const [swapped, setSwapped] = useState(false);   // animasi pudar hanya saat GANTI foto, bukan saat muat pertama
  useEffect(() => {
    if (mainImg === shownImg) { setImgLoading(false); return; }
    if (!mainImg) { setShownImg(''); setImgLoading(false); return; }
    let live = true;
    const done = () => { if (live) { setSwapped(true); setShownImg(mainImg); setImgLoading(false); } };
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
  // Thumbnail aktif digeser ke tengah (baris mendatar di HP/tablet, kolom tegak di layar lebar)
  useEffect(() => {
    const box = thumbRow.current;
    const el = box?.querySelector<HTMLElement>('button.on');
    if (!box || !el) return;
    if (box.scrollWidth <= box.clientWidth && box.scrollHeight <= box.clientHeight) return;
    box.scrollTo({
      left: el.offsetLeft - (box.clientWidth - el.offsetWidth) / 2,
      top: el.offsetTop - (box.clientHeight - el.offsetHeight) / 2,
      behavior: scrollMode(),
    });
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
  const [toast, setToast] = useState(0);   // > 0 = pesan mengambang di atas bar bawah sedang tampil (HP)
  useEffect(() => {
    if (!toast) return;
    const t = window.setTimeout(() => setToast(0), TOAST_MS);
    return () => window.clearTimeout(t);
  }, [toast]);
  const put = () => addToCart({
    product_id: p.id, slug: p.slug, name: p.name, category: p.category, image: shownImg || safeUrl(p.image_url),
    color: color?.name ?? null, motif: motif?.name ?? null, size: size?.name ?? null, unit, qty, min_order: p.min_order,
  });
  // Pesan "Masuk keranjang" hanya berlaku untuk pilihan yang baru ditambahkan: begitu pilihan atau jumlah berubah, pesan dilepas
  useEffect(() => { setAdded(''); }, [ci, mi, si, qty]);
  const note = (ok: boolean) => { setAdded(ok ? 'ok' : 'full'); setToast(n => n + 1); };
  const addCart = () => note(put());
  const buyNow = () => { if (put()) location.href = '/checkout'; else note(false); };

  const waLabel = inquiry ? 'Tanya harga & stok via WhatsApp' : 'Pesan via WhatsApp';
  const motifPriced = p.motifs.some(o => o.price_add);
  const pickColor = (i: number) => { setCi(i); setPickedImg(null); };
  const pickSize = (i: number) => { setSi(i); setPickedImg(null); };
  const pickMotif = (i: number) => { setMi(i); setPickedImg(null); };
  const addedMsg = added === 'ok' ? 'Masuk keranjang.' : 'Keranjang penuh (maksimal 20 jenis barang).';

  return (
    <div className="pdpgrid">
      <div className={gallery.length > 1 ? 'gallery has-thumbs' : 'gallery'}>
        <div className="pdpimg" ref={imgBox}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          {shownImg ? <img key={shownImg} className={swapped ? 'is-swap' : undefined} {...responsiveImg(shownImg, [640, 828, 1080], '(max-width: 639px) 100vw, (max-width: 899px) 50vw, 46vw')} alt={`${p.name}${color ? ` warna ${color.name}` : ''}${motif ? ` motif ${motif.name}` : ''}, goodie bag ${p.category.toLowerCase()}${sizeLabel ? ` ukuran ${sizeLabel}` : ''}`} width={900} height={900} fetchPriority="high" /> : <div className="noimg">Foto belum tersedia</div>}
          {imgLoading && <span className="imgbusy" role="status" aria-label="Memuat foto"><span className="spin" /></span>}
          {gallery.length > 1 && shotNo > 0 && <span className="badge badge--ink pdp-count" aria-hidden="true">{shotNo}/{gallery.length}</span>}
        </div>
        {gallery.length > 1 && (
          <div className="thumbs" role="group" aria-label="Foto produk" ref={thumbRow}>
            {gallery.map(g => (
              <button key={g.src} type="button" className={g.src === mainImg ? 'on' : ''} onClick={() => pickThumb(g)} aria-label={g.label} aria-pressed={g.src === mainImg}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={optimizedSrc(g.src, 256)} alt="" width={72} height={72} loading="lazy" decoding="async" />
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="buy">
        <div className="buy-top">
          <a className="buy-cat" href={`/kategori/${p.category.toLowerCase()}`}>{p.category}</a>
          {p.sku && <span className="skutag skutag--box">SKU {p.sku}</span>}
        </div>
        <h1>{p.name}</h1>

        <div className="card buycard">
          <div className="pricebox" aria-live="polite">
            {inquiry ? (
              <>
                <div className="pricerow">
                  <div className="modalprice ask">Tanya harga</div>
                  <div className="pricefacts"><span className="moq">Min. {pcs(p.min_order)}</span></div>
                </div>
                <p className="pricehint">Harga dan stok produk ini dikonfirmasi admin lewat WhatsApp.</p>
              </>
            ) : (
              <div className="pricerow">
                <div className="modalprice">{money(unit)}<small> /pcs</small></div>
                <div className="pricefacts">
                  <span className="moq">Min. {pcs(p.min_order)}</span>
                  <span className={soldOut ? 'stock out' : low ? 'stock low' : 'stock'}>{soldOut ? 'Stok habis untuk pilihan ini' : low ? `Sisa ${pcs(stock)} siap kirim` : `${pcs(stock)} siap kirim`}</span>
                </div>
              </div>
            )}
          </div>

          {p.colors.length > 0 && (
            <fieldset className="opt">
              <legend>Warna <span>{color?.name}</span></legend>
              <div className="swatches" role="radiogroup" aria-label="Pilih warna">
                {p.colors.map((o, i) => {
                  const out = (o.stock_qty ?? p.stock_qty) <= 0;
                  return (
                    <button key={o.name + i} type="button" role="radio" aria-checked={i === ci} tabIndex={i === ci ? 0 : -1} className={`sw${i === ci ? ' on' : ''}${out ? ' out' : ''}`} onClick={() => pickColor(i)} onKeyDown={radioKeys(p.colors.length, ci, pickColor)} title={out ? `${o.name} (habis)` : o.name} aria-label={`${o.name}${out ? ', stok habis' : ''}`}>
                      <Swatch option={o} />
                      {i === ci && <Check size={16} aria-hidden="true" className={isLight(o.hex) ? 'chk dark' : 'chk'} />}
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
                  const price = o.price || p.price;
                  return (
                    <button key={o.name + i} type="button" role="radio" aria-checked={i === si} tabIndex={i === si ? 0 : -1} className={`sz${i === si ? ' on' : ''}${out ? ' out' : ''}`} onClick={() => pickSize(i)} onKeyDown={radioKeys(sizes.length, si, pickSize)} aria-label={`${o.name}${price > 0 ? `, ${money(price)} per pcs` : ''}, ${out ? 'stok habis' : `stok ${pcs(st)}`}`}>
                      <span className="szname">{o.name}</span>
                      <span className="szsub">{price > 0 ? <>{money(price)}<small> /pcs</small></> : 'Tanya harga'}</span>
                      <span className="szstock">{out ? 'Habis' : `Stok ${pcs(st)}`}</span>
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
                  const photo = safeUrl(o.image_url);
                  const sub = out ? 'Habis' : o.price_add ? `+${money(o.price_add)} /pcs` : motifPriced ? 'Harga sama' : '';
                  return (
                    <button key={o.name + i} type="button" role="radio" aria-checked={i === mi} tabIndex={i === mi ? 0 : -1} className={`mt${i === mi ? ' on' : ''}${out ? ' out' : ''}`} onClick={() => pickMotif(i)} onKeyDown={radioKeys(p.motifs.length, mi, pickMotif)} aria-label={out ? `${o.name}, stok habis` : undefined}>
                      {photo
                        // eslint-disable-next-line @next/next/no-img-element
                        ? <span className="photo mt-ph" aria-hidden="true"><img src={optimizedSrc(photo, 256)} alt="" width={120} height={120} loading="lazy" decoding="async" /></span>
                        : <Swatch option={o} shape="square" />}
                      <span className="mtname">{o.name}</span>
                      {sub && <span className="mtsub">{sub}</span>}
                    </button>
                  );
                })}
              </div>
            </fieldset>
          )}

          <fieldset className="opt">
            <legend>Jumlah</legend>
            <div className="qtyrow">
              <div className="qty">
                <button type="button" onClick={() => setQty(qty - step)} disabled={qty <= p.min_order} aria-label="Kurangi jumlah"><Minus size={18} aria-hidden="true" /></button>
                <input inputMode="numeric" pattern="[0-9]*" value={qtyText} onChange={e => setQtyText(e.target.value.replace(/\D/g, '').slice(0, 6))} onBlur={() => setQty(qty)} aria-label="Jumlah pesanan (pcs)" aria-describedby="qty-help" />
                <button type="button" onClick={() => setQty(qty + step)} aria-label="Tambah jumlah"><Plus size={18} aria-hidden="true" /></button>
              </div>
              <div className="qtyquick" role="group" aria-label="Jumlah cepat">
                {quick.map(n => <button key={n} type="button" className={qty === n ? 'on' : ''} aria-pressed={qty === n} onClick={() => setQty(n)}>{pcs(n)}</button>)}
              </div>
            </div>
            <p className="qtyhelp" id="qty-help">Minimal {pcs(p.min_order)}.{step > 1 ? ` Atur per ${pcs(step)} atau ketik jumlahnya langsung.` : ' Ketik jumlahnya langsung atau pakai tombol.'}</p>
            {over && (
              <p className="msg msg--warn qtymsg" role="status">
                <AlertTriangle aria-hidden="true" />
                <span>Jumlah melebihi stok siap kirim ({pcs(stock)}). Sisanya masuk antrean produksi, pesan lewat WhatsApp supaya admin bisa konfirmasi waktunya.</span>
              </p>
            )}
          </fieldset>

          {!inquiry && (
            <div className="totalbox">
              <span>{pcs(qty)} × {money(unit)}<small>belum termasuk ongkos kirim</small></span>
              <b>{money(total)}</b>
            </div>
          )}

          <div className="ctas">
            {soldOut ? (
              <>
                <button type="button" className="btn btn-lg btn-block disabledbtn ctamain" disabled aria-disabled="true">Stok habis</button>
                <div className="soldlinks">
                  <a className="remind" href={notifyHref} target="_blank" rel="noopener noreferrer"><Bell size={16} aria-hidden="true" /> Ingatkan saya</a>
                  {p.is_customizable && <a className="remind" href={customHref} target="_blank" rel="noopener noreferrer">Tanya produksi custom</a>}
                </div>
              </>
            ) : canCart ? (
              <>
                <div className="cartbtns">
                  <button type="button" className="btn btn-primary btn-lg btn-block" onClick={buyNow}>Beli sekarang</button>
                  <button type="button" className="btn btn-outline btn-lg btn-block" onClick={addCart}><ShoppingBag size={18} aria-hidden="true" /> Tambah ke keranjang</button>
                </div>
                {/* Satu tempat tetap di bawah tombol: tautan WhatsApp, dan di desktop pesan "Masuk keranjang" tampil
                    menggantikannya di tempat yang sama, jadi isi di bawahnya tidak terdorong turun (tanpa layout shift).
                    Pesan hilang lagi begitu pilihan atau jumlah diubah. */}
                <div className={added ? 'ctanote is-noted' : 'ctanote'}>
                  <a className="walink" href={orderHref} target="_blank" rel="noopener noreferrer">
                    <MessageCircle size={18} aria-hidden="true" />
                    <span>Butuh jumlah besar atau custom? <b>Chat admin di WhatsApp</b></span>
                  </a>
                  {added && (
                    <p className={added === 'ok' ? 'msg msg--ok addedmsg' : 'msg msg--warn addedmsg'} role="status">
                      {added === 'ok' ? <CheckCircle2 aria-hidden="true" /> : <AlertTriangle aria-hidden="true" />}
                      <span>{addedMsg}{added === 'ok' && <> <a href="/keranjang">Lihat keranjang</a></>}</span>
                    </p>
                  )}
                </div>
              </>
            ) : (
              <a className="btn btn-wa btn-lg btn-block ctamain" href={orderHref} target="_blank" rel="noopener noreferrer"><MessageCircle size={18} aria-hidden="true" /> {waLabel}</a>
            )}
          </div>
        </div>

        {shipNote}

        <ul className="assure">
          <li><MapPin size={20} aria-hidden="true" /><span>Dikirim dari {settings.address}. Kirim ke seluruh Indonesia.</span></li>
          <li><ShieldCheck size={20} aria-hidden="true" /><span>Barang rusak atau tidak sesuai bisa dikomplain. <a href="/kebijakan-pengembalian">Lihat kebijakan</a></span></li>
          {p.is_customizable && <li><BadgeCheck size={20} aria-hidden="true" /><span>Bisa custom logo, motif, dan ukuran. <a href={customHref} target="_blank" rel="noopener noreferrer">Tanya custom via WhatsApp</a></span></li>}
        </ul>

        <details className="paybox">
          <summary>Metode pembayaran</summary>
          <PaymentOptions qris={qris} />
          {settings.payment_info && <p className="pdpnote">{settings.payment_info}</p>}
        </details>
      </div>

      {/* Bar bawah (HP dan tablet): foto + total di kiri, aksi di kanan. Satu-satunya tombol utama di layar kecil. */}
      <div className="buybar stickybar" role="region" aria-label="Ringkasan pesanan">
        <div className="buybar-info">
          {shownImg && (
            <button type="button" className="buybar-thumb" aria-label="Lihat foto produk" onClick={() => imgBox.current?.scrollIntoView({ behavior: scrollMode(), block: 'center' })}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={optimizedSrc(shownImg, 256)} alt="" width={48} height={48} />
            </button>
          )}
          <div className="buybar-price">
            <b>{inquiry ? 'Tanya harga' : money(total)}</b>
            <span>{[pcs(qty), size?.name, color?.name, motif?.name].filter(Boolean).join(' · ')}</span>
          </div>
        </div>
        {soldOut ? (
          <a className="btn btn-wa" href={notifyHref} target="_blank" rel="noopener noreferrer"><Bell size={18} aria-hidden="true" /> Ingatkan</a>
        ) : canCart ? (
          <>
            <button type="button" className="btn btn-outline btn-icon btn-icon--lg" onClick={addCart} aria-label="Tambah ke keranjang"><ShoppingBag size={20} aria-hidden="true" /></button>
            <button type="button" className="btn btn-primary" onClick={buyNow}>Beli sekarang</button>
          </>
        ) : (
          <a className="btn btn-wa" href={orderHref} target="_blank" rel="noopener noreferrer"><MessageCircle size={18} aria-hidden="true" /> {inquiry ? 'Tanya harga' : 'Pesan'}</a>
        )}
      </div>

      {/* Konfirmasi tambah keranjang di atas bar bawah (HP dan tablet), hilang sendiri setelah TOAST_MS */}
      {toast > 0 && added && (
        <p key={toast} className={added === 'ok' ? 'msg msg--ok buytoast' : 'msg msg--warn buytoast'} role="status">
          {added === 'ok' ? <CheckCircle2 aria-hidden="true" /> : <AlertTriangle aria-hidden="true" />}
          <span>{addedMsg}</span>
          {added === 'ok' && <a className="linkbtn" href="/keranjang">Lihat<span className="vh"> keranjang</span></a>}
        </p>
      )}
    </div>
  );
}
