'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import { AlertCircle, AlertTriangle, CheckCircle2, Clock, MessageCircle, QrCode, RefreshCw } from 'lucide-react';
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
/** Sisa waktu di bawah ini: lencana hitung mundur berubah jadi warna peringatan. */
const HURRY_MS = 5 * 60 * 1000;

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

  // Batal: konfirmasi di tempat (bukan dialog browser)
  const [asking, setAsking] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  async function cancel() {
    if (cancelling) return;
    setCancelling(true); setErr('');
    const { error } = await createClient().rpc('cancel_my_order', { p_order_number: p.orderNumber });
    if (error) { setErr(error.code === 'P0001' ? error.message : 'Gagal membatalkan pesanan. Coba lagi.'); setCancelling(false); setAsking(false); return; }
    location.reload();
  }

  if (paid) return (
    <div className="paypanel paid" role="status">
      <CheckCircle2 size={40} aria-hidden="true" />
      <b>Pembayaran diterima</b>
      <p>Terima kasih! Pesanan kamu segera kami proses.</p>
    </div>
  );

  const expired = !active && (!!qr || p.paymentStatus === 'expired');

  return (
    <div className="paypanel receipt">
      <h2>Pembayaran</h2>
      <div className="paytotal"><span>Total tagihan</span><b className="num">{money(p.total)}</b></div>

      {!p.qrisAvailable ? (
        <>
          <p className="paynote">{p.overLimit
            ? 'Total pesanan di atas Rp 10.000.000 (batas QRIS). Pembayaran dilakukan lewat transfer bank, detail rekening dikirim admin.'
            : 'Pesanan kamu sudah kami terima. Pembayaran dilakukan lewat transfer bank: klik tombol di bawah, admin akan mengirim detail rekening dan ongkos kirim.'}</p>
          <a className="btn btn-wa btn-lg btn-block" href={p.waHref} target="_blank" rel="noopener noreferrer"><MessageCircle size={18} aria-hidden="true" /> Konfirmasi via WhatsApp</a>
        </>
      ) : active ? (
        <>
          <div className="qrbox">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={qr!} alt={`Kode QRIS untuk pesanan ${p.orderNumber}`} width={280} height={280} />
          </div>
          <p className={left < HURRY_MS ? 'badge big badge--warn qrtimer' : 'badge big qrtimer'} aria-live="off">
            <Clock size={16} aria-hidden="true" /><span>Berlaku <b className="num">{fmtLeft(left)}</b> lagi</span>
          </p>
          <ol className="paysteps">
            <li>Buka aplikasi e-wallet atau m-banking (GoPay, OVO, DANA, ShopeePay, BCA, dll).</li>
            <li>Pilih <b>Scan / QRIS</b>, lalu scan kode di atas.</li>
            <li>Pastikan nominalnya <b className="num">{money(p.total)}</b>, lalu bayar. Halaman ini otomatis berubah saat pembayaran masuk.</li>
          </ol>
        </>
      ) : (
        <>
          {expired
            ? <p className="msg msg--warn"><AlertTriangle aria-hidden="true" /><span>Kode QRIS sebelumnya sudah kedaluwarsa. Buat kode baru untuk membayar.</span></p>
            : <p className="paynote">Bayar dengan QRIS dari aplikasi e-wallet atau m-banking apa pun. Pesanan terkonfirmasi otomatis.</p>}
          <button type="button" className="btn btn-primary btn-lg btn-block" onClick={create} disabled={busy}>
            {busy ? <><span className="spin" aria-hidden="true" /> Membuat kode…</> : qr ? <><RefreshCw size={18} aria-hidden="true" /> Buat kode QRIS baru</> : <><QrCode size={18} aria-hidden="true" /> Bayar dengan QRIS</>}
          </button>
        </>
      )}

      {err && <p className="msg msg--danger" role="alert"><AlertCircle aria-hidden="true" /><span>{err}</span></p>}

      {asking && !active && (
        <div className="cancelask" role="group" aria-label="Konfirmasi pembatalan pesanan">
          <p className="msg msg--warn"><AlertTriangle aria-hidden="true" /><span>Batalkan pesanan ini?</span></p>
          <div className="btnrow">
            <button type="button" className="btn btn-outline btn-sm" onClick={() => setAsking(false)} disabled={cancelling} autoFocus>Tidak jadi</button>
            <button type="button" className="btn btn-danger btn-sm" onClick={cancel} disabled={cancelling}>{cancelling ? <><span className="spin" aria-hidden="true" /> Membatalkan…</> : 'Ya, batalkan'}</button>
          </div>
        </div>
      )}

      <div className="payfoot">
        <a href={p.waHref} target="_blank" rel="noopener noreferrer"><MessageCircle size={16} aria-hidden="true" /> Butuh bantuan? Chat admin</a>
        {!active && !asking && <button type="button" className="linkbtn danger" onClick={() => setAsking(true)}>Batalkan pesanan</button>}
      </div>
    </div>
  );
}
