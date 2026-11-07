'use client';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Check, Clock, Minus, Plus, MessageCircle, Bell } from 'lucide-react';
import type { Product, SiteSettings, VariantOption } from '@/lib/types';
import { money } from '@/lib/format';
import { waLink } from '@/lib/wa';
import { safeUrl, toInt } from '@/lib/safe';
import { effectiveStock, isLight, unitPrice } from '@/lib/variants';
import { directPaymentEnabled } from '@/lib/payments';
import { Swatch } from '@/components/swatch';
import { PaymentOptions } from '@/components/payment-options';

const MAX_QTY = 100000;

function firstAvailable(list: VariantOption[], p: Product) {
  const i = list.findIndex(o => (o.stock_qty ?? p.stock_qty) > 0);
  return list.length ? Math.max(0, i) : -1;
}

export default function ProductBuy({ product: p, settings }: { product: Product; settings: SiteSettings }) {
  const [ci, setCi] = useState(() => firstAvailable(p.colors, p));
  const [mi, setMi] = useState(() => firstAvailable(p.motifs, p));
  const [si, setSi] = useState(() => firstAvailable(p.sizes ?? [], p));
  const [qtyText, setQtyText] = useState(String(p.min_order));

  const color = ci >= 0 ? p.colors[ci] : null;
  const motif = mi >= 0 ? p.motifs[mi] : null;
  const sizes = p.sizes ?? [];
  const size = si >= 0 ? sizes[si] : null;
  const sizeLabel = size?.name || p.size;
  const qty = Math.min(MAX_QTY, Math.max(p.min_order, toInt(qtyText, p.min_order)));
  const stock = effectiveStock(p, color, motif, size);
  const soldOut = stock <= 0;
  const over = !soldOut && qty > stock;
  const unit = unitPrice(p, color, motif, size);
  const total = unit * qty;

  // Foto utama mengikuti pilihan (motif lebih diprioritaskan, lalu warna, lalu foto produk)
  const gallery = useMemo(() => {
    const seen = new Set<string>();
    const list: { src: string; label: string; kind?: 'color' | 'motif'; idx?: number }[] = [];
    const add = (src: string | undefined, label: string, kind?: 'color' | 'motif', idx?: number) => { const s = safeUrl(src); if (s && !seen.has(s)) { seen.add(s); list.push({ src: s, label, kind, idx }); } };
    add(p.image_url, p.name);
    p.colors.forEach((o, i) => add(o.image_url, `${p.name} — ${o.name}`, 'color', i));
    p.motifs.forEach((o, i) => add(o.image_url, `${p.name} — motif ${o.name}`, 'motif', i));
    (p.sizes ?? []).forEach(o => add(o.image_url, `${p.name} — ukuran ${o.name}`));
    return list;
  }, [p]);
  const [pickedImg, setPickedImg] = useState<string | null>(null);
  const variantImg = safeUrl(motif?.image_url) || safeUrl(size?.image_url) || safeUrl(color?.image_url);
  const mainImg = pickedImg || variantImg || safeUrl(p.image_url);

  // Foto lama tetap tampil sampai foto baru selesai dimuat. Di HP/koneksi lambat, foto yang diganti
  // seketika membuat kotak foto kosong dulu sehingga terlihat seperti "varian tidak mengubah foto".
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
    im.src = mainImg;
    if (im.complete) done();
    return () => { live = false; };
  }, [mainImg, shownImg]);
  // Muat semua foto varian di latar belakang supaya pindah varian terasa instan
  useEffect(() => {
    const t = setTimeout(() => gallery.forEach(g => { const im = new window.Image(); im.src = g.src; }), 400);
    return () => clearTimeout(t);
  }, [gallery]);

  // Klik thumbnail varian = ikut memilih varian itu (warna/motif ikut berganti), bukan cuma ganti foto.
  const pickThumb = (g: { src: string; kind?: 'color' | 'motif'; idx?: number }) => {
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
  const pickLabel = [color?.name, motif ? `Motif ${motif.name}` : '', size?.name].filter(Boolean).join(' · ');

  const sel = { color, motif, size, qty, unit };
  const orderHref = waLink(settings, p, { ...sel, intent: 'order' });
  const notifyHref = waLink(settings, p, { ...sel, intent: 'notify' });
  const customHref = waLink(settings, p, { ...sel, intent: 'custom' });

  const setQty = (n: number) => setQtyText(String(Math.min(MAX_QTY, Math.max(p.min_order, n))));
  const step = p.min_order >= 100 ? 50 : p.min_order >= 20 ? 10 : 1;

  const stockLabel = soldOut ? 'Stok habis' : `${stock.toLocaleString('id-ID')} pcs tersedia`;

  const cta = soldOut
    ? <button className="primary full disabledbtn" disabled aria-disabled="true">Stok habis</button>
    : <a className="primary full" href={orderHref} target="_blank" rel="noopener noreferrer">Pesan via WhatsApp <MessageCircle size={18} /></a>;

  return (
    <div className="pdpgrid">
      <div className="gallery">
        <div className="pdpimg" ref={imgBox}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          {shownImg ? <img key={shownImg} src={shownImg} alt={`${p.name}${color ? ` warna ${color.name}` : ''}${motif ? ` motif ${motif.name}` : ''} — goodie bag ${p.category.toLowerCase()} ukuran ${sizeLabel}`} width={900} height={900} fetchPriority="high" /> : <div className="noimg">Foto belum tersedia</div>}
          {imgLoading && <span className="imgbusy" role="status" aria-label="Memuat foto"><span className="spin" /></span>}
          {pickLabel && <span className="imgtag">{pickLabel}</span>}
        </div>
        {gallery.length > 1 && (
          <div className="thumbs" role="group" aria-label="Foto produk" ref={thumbRow}>
            {gallery.map(g => (
              <button key={g.src} type="button" className={g.src === mainImg ? 'on' : ''} onClick={() => pickThumb(g)} aria-label={g.label} aria-pressed={g.src === mainImg}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={g.src} alt="" width={64} height={64} loading="lazy" />
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="buy">
        <span className="kicker">{p.category}</span>
        <h1>{p.name}</h1>
        <div className="stock"><span className={soldOut ? 'dot out' : 'dot'} />{stockLabel}</div>
        <p className="pdpdesc">{p.description}{p.is_customizable && ' Bisa dicustom dengan logo, motif, dan ukuran sesuai brand kamu.'}</p>

        <div className="pricebox">
          <div className="modalprice">{money(unit)} <small>/pcs</small></div>
          <div className="pricehint">{qty.toLocaleString('id-ID')} pcs ≈ <b>{money(total)}</b> <span>(estimasi, harga final dikonfirmasi admin)</span></div>
        </div>

        {p.colors.length > 0 && (
          <fieldset className="opt">
            <legend>Warna <span>— {color?.name}</span></legend>
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
            <legend>Ukuran <span>— {size?.name}</span></legend>
            <div className="sizes" role="radiogroup" aria-label="Pilih ukuran">
              {sizes.map((o, i) => {
                const out = (o.stock_qty ?? p.stock_qty) <= 0;
                return (
                  <button key={o.name + i} type="button" role="radio" aria-checked={i === si} className={`sz${i === si ? ' on' : ''}${out ? ' out' : ''}`} onClick={() => { setSi(i); setPickedImg(null); }} aria-label={`${o.name}${out ? ', stok habis' : ''}`}>
                    <span className="szname">{o.name}</span>
                    <span className="szsub">{out ? 'Habis' : money(o.price || p.price)}</span>
                  </button>
                );
              })}
            </div>
          </fieldset>
        )}

        {p.motifs.length > 0 && (
          <fieldset className="opt">
            <legend>Motif <span>— {motif?.name}</span></legend>
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
          <legend>Jumlah <span>— min. {p.min_order.toLocaleString('id-ID')} pcs</span></legend>
          <div className="qty">
            <button type="button" onClick={() => setQty(qty - step)} disabled={qty <= p.min_order} aria-label="Kurangi jumlah"><Minus size={16} /></button>
            <input inputMode="numeric" pattern="[0-9]*" value={qtyText} onChange={e => setQtyText(e.target.value.replace(/\D/g, '').slice(0, 6))} onBlur={() => setQty(qty)} aria-label="Jumlah pesanan (pcs)" />
            <button type="button" onClick={() => setQty(qty + step)} aria-label="Tambah jumlah"><Plus size={16} /></button>
          </div>
          {over && <p className="qtynote">Jumlah melebihi stok siap kirim ({stock.toLocaleString('id-ID')} pcs). Sisanya masuk antrean produksi — admin akan konfirmasi waktunya.</p>}
        </fieldset>

        <div className="modalrow"><span>Ukuran<b>{sizeLabel}</b></span><span>MOQ<b>{p.min_order} pcs</b></span><span>Kategori<b>{p.category}</b></span></div>

        <div className="ctas desktop-cta">
          {cta}
          {soldOut && (
            <div className="soldlinks">
              <a className="remind" href={notifyHref} target="_blank" rel="noopener noreferrer"><Bell size={15} /> Ingatkan saya</a>
              {p.is_customizable && <a className="remind" href={customHref} target="_blank" rel="noopener noreferrer">Tanya produksi custom</a>}
            </div>
          )}
          {!directPaymentEnabled && (
            <button className="paysoon" disabled aria-disabled="true"><Clock size={16} /> Bayar langsung via Mitra Trans <em>Segera hadir</em></button>
          )}
        </div>

        <details className="paybox">
          <summary>Metode pembayaran</summary>
          <PaymentOptions />
          <p className="pdpnote">{settings.payment_info}</p>
        </details>
      </div>

      {/* Bar bawah (mobile) — foto + harga di kiri, tombol di kanan, seperti iBox */}
      <div className="buybar" role="region" aria-label="Ringkasan pesanan">
        <div className="buybar-info">
          <button type="button" className="buybar-thumb" aria-label="Lihat foto produk" onClick={() => imgBox.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            {shownImg ? <img src={shownImg} alt="" /> : motif ? <Swatch option={motif} shape="square" preferImage /> : color ? <Swatch option={color} shape="square" /> : null}
          </button>
          <div className="buybar-price">
            <b>{money(total)}</b>
            <span>{qty.toLocaleString('id-ID')} pcs · {color?.name ?? p.category}{motif ? ` · ${motif.name}` : ''}{size ? ` · ${size.name}` : ''}</span>
          </div>
        </div>
        {soldOut
          ? <a className="primary remind-btn" href={notifyHref} target="_blank" rel="noopener noreferrer"><Bell size={16} /> Ingatkan saya</a>
          : <a className="primary" href={orderHref} target="_blank" rel="noopener noreferrer">Pesan <MessageCircle size={16} /></a>}
      </div>
    </div>
  );
}
