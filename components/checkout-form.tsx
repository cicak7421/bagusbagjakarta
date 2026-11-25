'use client';
import { useEffect, useState } from 'react';
import { Lock, ShoppingBag } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { cartTotal, clearCart, useCart } from '@/lib/cart';
import { money } from '@/lib/format';
import { optimizedSrc } from '@/lib/img';
import { safeUrl } from '@/lib/safe';
import { isOrderNumber, QRIS_MAX_AMOUNT } from '@/lib/orders';
import { lineLabel } from '@/components/cart-view';
import type { Profile } from '@/components/account-view';

/**
 * Form checkout. Yang dikirim ke server hanya: id produk, pilihan varian, jumlah, dan alamat.
 * Harga, stok, dan total dihitung ulang di database (fungsi create_order), jadi tidak bisa diakali dari browser.
 */
export default function CheckoutForm({ profile, email }: { profile: Profile; email: string }) {
  const items = useCart();
  const [ready, setReady] = useState(false);
  useEffect(() => setReady(true), []);
  const [f, setF] = useState({ name: profile.full_name, phone: profile.phone, company: profile.company, address: profile.address, city: profile.city, postal_code: profile.postal_code, notes: '' });
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setF({ ...f, [k]: e.target.value });
  const total = cartTotal(items);

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

  if (!ready) return <div className="empty" aria-busy="true"><span className="spin" /></div>;
  if (!items.length) return <div className="empty"><ShoppingBag size={36} aria-hidden="true" /><p>Keranjang kosong. Pilih produk dulu sebelum checkout.</p><a className="primary" href="/#produk">Lihat katalog</a></div>;

  return (
    <form onSubmit={submit} className="ordergrid">
      <div className="ordermain">
        <section className="boxed" aria-labelledby="co-ship">
          <h2 id="co-ship">Alamat pengiriman</h2>
          <div className="form">
            <div className="form2">
              <label>Nama penerima<input required minLength={3} maxLength={80} autoComplete="name" value={f.name} onChange={set('name')} /></label>
              <label>Nomor WhatsApp<input required type="tel" inputMode="tel" autoComplete="tel" maxLength={20} placeholder="081234567890" value={f.phone} onChange={set('phone')} /></label>
            </div>
            <label>Perusahaan / toko (opsional)<input maxLength={80} autoComplete="organization" value={f.company} onChange={set('company')} /></label>
            <label>Alamat lengkap<textarea required minLength={10} maxLength={300} rows={3} autoComplete="street-address" placeholder="Nama jalan, nomor, RT/RW, kelurahan, kecamatan" value={f.address} onChange={set('address')} /></label>
            <div className="form2">
              <label>Kota / kabupaten<input required minLength={2} maxLength={60} autoComplete="address-level2" value={f.city} onChange={set('city')} /></label>
              <label>Kode pos<input inputMode="numeric" pattern="[0-9]{5}" maxLength={5} autoComplete="postal-code" value={f.postal_code} onChange={set('postal_code')} /></label>
            </div>
            <label>Catatan untuk admin (opsional)<textarea maxLength={500} rows={2} value={f.notes} onChange={set('notes')} /></label>
            <p className="hintline">Konfirmasi pesanan dikirim ke {email}.</p>
          </div>
        </section>
      </div>
      <aside className="orderside">
        <div className="paypanel">
          <h2>Pesanan kamu</h2>
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
          <dl className="sums">
            <div><dt>Subtotal</dt><dd>{money(total)}</dd></div>
            <div><dt>Ongkos kirim</dt><dd>Dikonfirmasi admin</dd></div>
            <div className="grand"><dt>Total barang</dt><dd>{money(total)}</dd></div>
          </dl>
          {total > QRIS_MAX_AMOUNT && <p className="paynote">Total di atas Rp 10.000.000 (batas QRIS). Setelah pesanan dibuat, pembayaran dilakukan lewat transfer bank dengan bantuan admin.</p>}
          {err && <div className="error" role="alert">{err}</div>}
          <button className="primary full" disabled={busy}>{busy ? <><span className="spin" /> Membuat pesanan…</> : <><Lock size={16} /> Buat pesanan</>}</button>
          <p className="paynote small">Ongkos kirim belum termasuk dan dikonfirmasi admin sesuai alamat. Dengan membuat pesanan kamu menyetujui <a href="/syarat-ketentuan" target="_blank">Syarat &amp; Ketentuan</a>.</p>
          <a className="backlink" href="/keranjang">Ubah keranjang</a>
        </div>
      </aside>
    </form>
  );
}
