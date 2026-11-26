'use client';
import { useEffect, useState } from 'react';
import { AlertCircle, ArrowLeft, ChevronDown, Info, Lock } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { cartTotal, clearCart, useCart } from '@/lib/cart';
import { money } from '@/lib/format';
import { optimizedSrc } from '@/lib/img';
import { safeUrl } from '@/lib/safe';
import { isOrderNumber, QRIS_MAX_AMOUNT } from '@/lib/orders';
import { CartEmpty, cartPcs, lineLabel } from '@/components/cart-view';
import { PaymentOptions } from '@/components/payment-options';
import type { Profile } from '@/components/account-view';

/**
 * Form checkout. Yang dikirim ke server hanya: id produk, pilihan varian, jumlah, dan alamat.
 * Harga, stok, dan total dihitung ulang di database (fungsi create_order), jadi tidak bisa diakali dari browser.
 *
 * `qris`     : QRIS aktif di server (hanya memengaruhi daftar metode bayar yang ditampilkan).
 * `shipNote` : info ongkos kirim dari halaman server (<ShipNote />).
 * `art`      : ilustrasi keadaan kosong dari halaman server (<EmptyArt />).
 */
export default function CheckoutForm({ profile, email, qris = false, shipNote, art }: { profile: Profile; email: string; qris?: boolean; shipNote?: React.ReactNode; art?: React.ReactNode }) {
  const items = useCart();
  const [ready, setReady] = useState(false);
  useEffect(() => setReady(true), []);
  const [f, setF] = useState({ name: profile.full_name, phone: profile.phone, company: profile.company, address: profile.address, city: profile.city, postal_code: profile.postal_code, notes: '' });
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setF({ ...f, [k]: e.target.value });
  const total = cartTotal(items);
  const pcs = cartPcs(items);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (busy || !items.length) return;
    setBusy(true); setErr('');
    try {
      const supabase = createClient();
      const { data, error } = await supabase.rpc('create_order', {
        p_items: items.map(i => ({ product_id: i.product_id, color: i.color, motif: i.motif, size: i.size, qty: i.qty })),
        p_shipping: { ...f, phone: f.phone.replace(/[^\d+]/g, '') },
      });
      if (error) {
        // P0001 = pesan validasi dari database yang memang ditujukan untuk customer
        setErr(error.code === 'P0001' ? error.message : /jwt|not authenticated|401/i.test(error.message) ? 'Sesi login habis. Silakan masuk lagi.' : 'Pesanan gagal dibuat. Coba lagi, atau hubungi admin lewat WhatsApp.');
        setBusy(false); return;
      }
      const no = (data as { order_number?: string } | null)?.order_number;
      if (!isOrderNumber(no)) { setErr('Pesanan gagal dibuat. Coba lagi sebentar lagi.'); setBusy(false); return; }
      // Simpan alamat sebagai default untuk pesanan berikutnya (gagal pun tidak masalah)
      const { data: u } = await supabase.auth.getUser();
      if (u.user) await supabase.from('profiles').upsert({ id: u.user.id, full_name: f.name.trim().slice(0, 80), phone: f.phone.replace(/[^\d+]/g, '').slice(0, 20), company: f.company.trim().slice(0, 80), address: f.address.trim().slice(0, 300), city: f.city.trim().slice(0, 60), postal_code: f.postal_code.trim().slice(0, 10) });
      clearCart();
      location.href = `/akun/pesanan/${no}?baru=1`;
    } catch { setErr('Tidak bisa terhubung ke server. Cek koneksi internet lalu coba lagi.'); setBusy(false); }
  }

  if (!ready) return (
    <div className="ordergrid" aria-busy="true">
      <span className="vh">Memuat checkout…</span>
      <div className="cart-skel" aria-hidden="true"><span className="skel co-skel" /></div>
      <div className="cart-skel-side skel" aria-hidden="true" />
    </div>
  );
  if (!items.length) return <CartEmpty art={art} title="Keranjang kamu masih kosong" text="Pilih produk dulu sebelum checkout." />;

  const lines = (
    <ul className="lines mini">
      {items.map(i => (
        <li key={i.key}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          {safeUrl(i.image) ? <img src={optimizedSrc(safeUrl(i.image), 256)} alt="" width={48} height={48} loading="lazy" /> : <span className="noimg64" />}
          <span className="ln-main"><b>{i.name}</b><small>{[lineLabel(i), `${i.qty.toLocaleString('id-ID')} pcs`].filter(Boolean).join(' · ')}</small></span>
          <b className="ln-total">{money(i.unit * i.qty)}</b>
        </li>
      ))}
    </ul>
  );
  const submitLabel = busy ? <><span className="spin" aria-hidden="true" /> Membuat pesanan…</> : <><Lock size={16} aria-hidden="true" /> Buat pesanan</>;

  return (
    <form onSubmit={submit} className="ordergrid">
      <div className="ordermain">
        <details className="cosum only-sm">
          <summary>
            <span className="cosum-label">Lihat pesanan ({items.length} barang)</span>
            <b className="num">{money(total)}</b>
            <ChevronDown size={18} aria-hidden="true" />
          </summary>
          {lines}
        </details>

        <section className="boxed cocard" aria-labelledby="co-ship">
          <h2 id="co-ship"><span className="stepno" aria-hidden="true">1</span>Alamat pengiriman</h2>
          <div className="form">
            <div className="form2">
              <label>Nama penerima<input required minLength={3} maxLength={80} autoComplete="name" value={f.name} onChange={set('name')} /></label>
              <label>Nomor WhatsApp<input required type="tel" inputMode="tel" autoComplete="tel" maxLength={20} placeholder="081234567890" value={f.phone} onChange={set('phone')} /></label>
            </div>
            <label><span>Perusahaan / toko <span className="opt-tag">(opsional)</span></span><input maxLength={80} autoComplete="organization" value={f.company} onChange={set('company')} /></label>
            <label>Alamat lengkap<textarea required minLength={10} maxLength={300} rows={3} autoComplete="street-address" placeholder="Nama jalan, nomor, RT/RW, kelurahan, kecamatan" value={f.address} onChange={set('address')} /></label>
            <div className="form2 form2--city">
              <label>Kota / kabupaten<input required minLength={2} maxLength={60} autoComplete="address-level2" value={f.city} onChange={set('city')} /></label>
              <label><span>Kode pos <span className="opt-tag">(opsional)</span></span><input inputMode="numeric" pattern="[0-9]{5}" maxLength={5} autoComplete="postal-code" value={f.postal_code} onChange={set('postal_code')} /></label>
            </div>
            <label><span>Catatan untuk admin <span className="opt-tag">(opsional)</span></span><textarea maxLength={500} rows={2} value={f.notes} onChange={set('notes')} /></label>
            <p className="hintline">Konfirmasi pesanan dikirim ke {email}.</p>
          </div>
        </section>

        <section className="boxed cocard" aria-labelledby="co-pay">
          <h2 id="co-pay"><span className="stepno" aria-hidden="true">2</span>Pembayaran</h2>
          <p className="cocard-lead">Pembayaran dilakukan di halaman pesanan, setelah kamu menekan Buat pesanan.</p>
          <PaymentOptions qris={qris} />
          {total > QRIS_MAX_AMOUNT && (
            <p className="msg">
              <Info aria-hidden="true" />
              <span>Total di atas Rp 10.000.000 (batas QRIS). Setelah pesanan dibuat, pembayaran dilakukan lewat transfer bank dengan bantuan admin.</span>
            </p>
          )}
        </section>
      </div>

      <aside className="orderside" aria-label="Ringkasan pesanan">
        <div className="paypanel receipt">
          <h2>Pesanan kamu</h2>
          <div className="only-lg">{lines}</div>
          <dl className="sums">
            <div><dt>Subtotal ({items.length} jenis · {pcs.toLocaleString('id-ID')} pcs)</dt><dd>{money(total)}</dd></div>
            <div><dt>Ongkos kirim</dt><dd><span className="badge">Dikonfirmasi admin</span></dd></div>
            <div className="grand"><dt>Total barang</dt><dd>{money(total)}</dd></div>
          </dl>
          {shipNote}
          {err && <p className="msg msg--danger" id="co-err" role="alert"><AlertCircle aria-hidden="true" /><span>{err}</span></p>}
          <button className="btn btn-primary btn-lg btn-block only-lg" disabled={busy} aria-describedby={err ? 'co-err' : undefined}>{submitLabel}</button>
          <p className="paynote small">Dengan membuat pesanan kamu menyetujui <a href="/syarat-ketentuan" target="_blank">Syarat &amp; Ketentuan</a>.</p>
          <a className="backlink" href="/keranjang"><ArrowLeft size={16} aria-hidden="true" /> Ubah keranjang</a>
        </div>
      </aside>

      <div className="stickybar">
        {err && <p className="msg msg--danger stickybar-err" aria-hidden="true"><AlertCircle /><span>{err}</span></p>}
        <div className="stickybar-info">
          <span className="stickybar-total">{money(total)}</span>
          <span className="stickybar-sub">Belum termasuk ongkir</span>
        </div>
        <button className="btn btn-primary" disabled={busy} aria-describedby={err ? 'co-err' : undefined}>{submitLabel}</button>
      </div>
    </form>
  );
}
