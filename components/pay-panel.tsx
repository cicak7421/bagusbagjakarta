'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import { CheckCircle2, MessageCircle, QrCode, RefreshCw } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { money } from '@/lib/format';

type Props = {
  orderNumber: string;
  total: number;
  paymentStatus: string;
  qrUrl: string | null;
  expiresAt: string | null;
  /** QRIS bisa dipakai (Midtrans aktif & total di bawah batas). Kalau false, arahkan ke WhatsApp. */
  qrisAvailable: boolean;
  overLimit: boolean;
  waHref: string;
};

const fmtLeft = (ms: number) => { const s = Math.max(0, Math.floor(ms / 1000)); return `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`; };

/** Kotak pembayaran di halaman pesanan: buat kode QRIS, tampilkan, dan pantau sampai lunas. */
export default function PayPanel(p: Props) {
  const [qr, setQr] = useState(p.paymentStatus === 'pending' ? p.qrUrl : null);
  const [expires, setExpires] = useState(p.paymentStatus === 'pending' ? p.expiresAt : null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const [paid, setPaid] = useState(false);
  const [now, setNow] = useState(() => Date.now());
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  const left = expires ? new Date(expires).getTime() - now : 0;
  const active = !!qr && left > 0 && !paid;

  const create = useCallback(async () => {
    if (busy) return;
    setBusy(true); setErr('');
    try {
      const res = await fetch(`/api/orders/${p.orderNumber}/pay`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) { setErr(j.error || 'Gagal membuat kode QRIS. Coba lagi sebentar lagi.'); return; }
      setQr(j.qr_url); setExpires(j.expires_at); setNow(Date.now());
    } catch { setErr('Tidak bisa terhubung ke server. Cek koneksi internet lalu coba lagi.'); }
    finally { setBusy(false); }
  }, [busy, p.orderNumber]);

  // Hitung mundur + cek status tiap 5 detik selama kode QR aktif dan tab sedang dibuka
  useEffect(() => {
    if (!active) return;
    let n = 0;
    timer.current = setInterval(async () => {
      setNow(Date.now());
      if (++n % 5 !== 0 || document.hidden) return;
      try {
        const res = await fetch(`/api/orders/${p.orderNumber}/status`, { cache: 'no-store' });
        if (!res.ok) return;
        const j = await res.json();
        if (j.payment_status === 'paid') { setPaid(true); setTimeout(() => location.reload(), 1500); }
        else if (j.payment_status === 'expired' || j.payment_status === 'failed') { setQr(null); setExpires(null); }
      } catch { /* coba lagi di putaran berikutnya */ }
    }, 1000);
    return () => { if (timer.current) clearInterval(timer.current); };
  }, [active, p.orderNumber]);

  const [cancelling, setCancelling] = useState(false);
  async function cancel() {
    if (cancelling || !confirm('Batalkan pesanan ini?')) return;
    setCancelling(true); setErr('');
    const { error } = await createClient().rpc('cancel_my_order', { p_order_number: p.orderNumber });
    if (error) { setErr(error.code === 'P0001' ? error.message : 'Gagal membatalkan pesanan. Coba lagi.'); setCancelling(false); return; }
    location.reload();
  }

  if (paid) return <div className="paypanel paid" role="status"><CheckCircle2 size={40} /><b>Pembayaran diterima</b><p>Terima kasih! Pesanan kamu segera kami proses.</p></div>;

  return (
    <div className="paypanel">
      <h2>Pembayaran</h2>
      <div className="paytotal"><span>Total tagihan</span><b>{money(p.total)}</b></div>

      {!p.qrisAvailable ? (
        <>
          <p className="paynote">{p.overLimit
            ? 'Total pesanan di atas Rp 10.000.000 (batas QRIS). Pembayaran dilakukan lewat transfer bank, detail rekening dikirim admin.'
            : 'Pesanan kamu sudah kami terima. Pembayaran dilakukan lewat transfer bank: klik tombol di bawah, admin akan mengirim detail rekening dan ongkos kirim.'}</p>
          <a className="primary full" href={p.waHref} target="_blank" rel="noopener noreferrer">Konfirmasi via WhatsApp <MessageCircle size={18} /></a>
        </>
      ) : active ? (
        <>
          <div className="qrbox">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={qr!} alt={`Kode QRIS untuk pesanan ${p.orderNumber}`} width={280} height={280} />
          </div>
          <p className="qrtimer" aria-live="off">Berlaku <b>{fmtLeft(left)}</b> lagi</p>
          <ol className="paysteps">
            <li>Buka aplikasi e-wallet atau m-banking (GoPay, OVO, DANA, ShopeePay, BCA, dll).</li>
            <li>Pilih <b>Scan / QRIS</b>, lalu scan kode di atas.</li>
            <li>Pastikan nominalnya <b>{money(p.total)}</b>, lalu bayar. Halaman ini otomatis berubah saat pembayaran masuk.</li>
          </ol>
        </>
      ) : (
        <>
          <p className="paynote">{qr || p.paymentStatus === 'expired' ? 'Kode QRIS sebelumnya sudah kedaluwarsa. Buat kode baru untuk membayar.' : 'Bayar dengan QRIS dari aplikasi e-wallet atau m-banking apa pun. Pesanan terkonfirmasi otomatis.'}</p>
          <button type="button" className="primary full" onClick={create} disabled={busy}>{busy ? <><span className="spin" /> Membuat kode…</> : qr ? <><RefreshCw size={18} /> Buat kode QRIS baru</> : <><QrCode size={18} /> Bayar dengan QRIS</>}</button>
        </>
      )}

      {err && <div className="error" role="alert">{err}</div>}
      <div className="payfoot">
        <a href={p.waHref} target="_blank" rel="noopener noreferrer">Butuh bantuan? Chat admin</a>
        {!active && <button type="button" className="linkbtn danger" onClick={cancel} disabled={cancelling}>{cancelling ? 'Membatalkan…' : 'Batalkan pesanan'}</button>}
      </div>
    </div>
  );
}
