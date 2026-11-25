'use client';
import { useCallback, useEffect, useMemo, useState } from 'react';
import type { SupabaseClient } from '@supabase/supabase-js';
import { MessageCircle, RefreshCw, Save, Search } from 'lucide-react';
import { money } from '@/lib/format';
import { fmtDateTime, normalizeOrder, ORDER_STATUS_LABEL, PAYMENT_STATUS_LABEL, variantLabel, type Order, type OrderStatus } from '@/lib/orders';

type Notify = (text: string, kind?: 'success' | 'error' | 'info') => void;
const FILTERS: { key: 'all' | OrderStatus; label: string }[] = [
  { key: 'all', label: 'Semua' }, { key: 'pending_payment', label: 'Belum bayar' }, { key: 'paid', label: 'Perlu diproses' },
  { key: 'processing', label: 'Diproses' }, { key: 'shipped', label: 'Dikirim' }, { key: 'completed', label: 'Selesai' }, { key: 'cancelled', label: 'Batal' },
];
/** Status berikutnya yang wajar dari tiap status (admin tidak bisa "melompat" sembarangan). */
const NEXT: Record<OrderStatus, OrderStatus[]> = {
  pending_payment: ['cancelled'], paid: ['processing', 'cancelled'], processing: ['shipped', 'cancelled'], shipped: ['completed'], completed: [], cancelled: [],
};

function OrderCard({ o, supabase, notify, onSaved }: { o: Order; supabase: SupabaseClient; notify: Notify; onSaved: () => void }) {
  const [courier, setCourier] = useState(o.courier);
  const [resi, setResi] = useState(o.tracking_number);
  const [ship, setShip] = useState(String(o.shipping_cost || ''));
  const [note, setNote] = useState(o.admin_note ?? '');
  const [busy, setBusy] = useState(false);
  const unpaid = o.payment_status !== 'paid' && o.payment_status !== 'refunded';
  const qrActive = o.payment_status === 'pending' && !!o.payment_expires_at && new Date(o.payment_expires_at).getTime() > Date.now();

  async function update(patch: Record<string, unknown>, okText: string) {
    if (busy) return;
    setBusy(true);
    const { data, error } = await supabase.from('orders').update(patch).eq('id', o.id).select('id');
    setBusy(false);
    if (error || !data?.length) return notify(`Gagal menyimpan pesanan ${o.order_number}: ${error?.message || 'ditolak database (akun ini bukan admin?)'}`, 'error');
    notify(okText, 'success'); onSaved();
  }
  const saveDetail = () => {
    const cost = Math.max(0, Math.floor(Number(ship) || 0));
    if (cost !== o.shipping_cost && !unpaid) return notify('Ongkir tidak bisa diubah setelah pesanan dibayar.', 'error');
    if (cost !== o.shipping_cost && qrActive) return notify('Customer sedang punya kode QRIS aktif. Tunggu sampai kedaluwarsa (maks. 30 menit) sebelum mengubah ongkir.', 'error');
    update({ courier: courier.trim().slice(0, 40), tracking_number: resi.trim().slice(0, 60), admin_note: note.trim().slice(0, 1000), ...(unpaid ? { shipping_cost: cost } : {}) }, `Pesanan ${o.order_number} tersimpan.`);
  };
  const setStatus = (s: OrderStatus) => {
    if (s === 'cancelled' && !confirm(`Batalkan pesanan ${o.order_number}? Stok akan dikembalikan.${o.payment_status === 'paid' ? '\n\nPesanan ini SUDAH DIBAYAR. Refund harus kamu proses sendiri ke customer.' : ''}`)) return;
    if (s === 'shipped' && !resi.trim() && !confirm('Nomor resi masih kosong. Tetap tandai dikirim?')) return;
    update({ status: s, courier: courier.trim().slice(0, 40), tracking_number: resi.trim().slice(0, 60) }, `Pesanan ${o.order_number}: ${ORDER_STATUS_LABEL[s]}.`);
  };
  const markPaid = () => {
    if (!confirm(`Tandai pesanan ${o.order_number} LUNAS secara manual (${money(o.total)})?\n\nPakai ini hanya kalau uangnya benar-benar sudah masuk (mis. transfer bank).`)) return;
    update({ payment_status: 'paid', payment_method: 'manual', admin_note: `${note.trim()} [Lunas manual ${new Date().toLocaleDateString('id-ID')}]`.trim().slice(0, 1000) }, `Pesanan ${o.order_number} ditandai lunas.`);
  };
  const wa = `https://wa.me/${o.customer_phone.replace(/\D/g, '').replace(/^0/, '62')}?text=${encodeURIComponent(`Halo ${o.customer_name}, kami dari Tre Joy Ease mengenai pesanan ${o.order_number}.`)}`;

  return (
    <details className="ordcard">
      <summary>
        <span className="ord-main"><b>{o.order_number}</b><small>{fmtDateTime(o.created_at)} · {o.customer_name}{o.company ? ` (${o.company})` : ''}</small></span>
        <span className="ord-side"><b>{money(o.total)}</b><span className={`badge st-${o.status}`}>{ORDER_STATUS_LABEL[o.status]}</span></span>
      </summary>
      <div className="ord-body">
        <ul className="ord-items">
          {(o.order_items ?? []).map(it => <li key={it.id}><span><b>{it.product_name}</b> <small>{variantLabel(it)}</small></span><span>{it.qty.toLocaleString('id-ID')} × {money(it.unit_price)} = <b>{money(it.line_total)}</b></span></li>)}
          <li className="sum"><span>Subtotal {money(o.subtotal)} + ongkir {money(o.shipping_cost)}</span><b>{money(o.total)}</b></li>
        </ul>
        <div className="ord-info">
          <p><b>Kirim ke</b><br />{o.customer_name} · {o.customer_phone}<br />{[o.shipping_address, o.shipping_city, o.shipping_postal_code].filter(Boolean).join(', ')}<br />{o.customer_email}</p>
          <p><b>Pembayaran</b><br />{PAYMENT_STATUS_LABEL[o.payment_status]} ({o.payment_method === 'qris' ? 'QRIS' : 'manual'}){o.paid_at && <><br />{fmtDateTime(o.paid_at)}</>}{o.payment_ref && <><br /><small>Ref Midtrans: {o.payment_ref}</small></>}</p>
          {o.notes && <p><b>Catatan customer</b><br />{o.notes}</p>}
        </div>
        <div className="ord-form">
          <label>Kurir<input value={courier} maxLength={40} placeholder="JNE / J&T / kargo…" onChange={e => setCourier(e.target.value)} /></label>
          <label>No. resi<input value={resi} maxLength={60} onChange={e => setResi(e.target.value)} /></label>
          <label>Ongkir (Rp)<input type="number" min={0} value={ship} disabled={!unpaid} onChange={e => setShip(e.target.value)} /></label>
          <label className="wide">Catatan internal (tidak terlihat customer)<input value={note} maxLength={1000} onChange={e => setNote(e.target.value)} /></label>
        </div>
        <div className="ord-actions">
          <button type="button" className="navadd" onClick={saveDetail} disabled={busy}><Save size={14} /> Simpan detail</button>
          {unpaid && o.status === 'pending_payment' && <button type="button" className="navadd" onClick={markPaid} disabled={busy}>Tandai lunas (manual)</button>}
          {NEXT[o.status].map(s => <button key={s} type="button" className={s === 'cancelled' ? 'navadd dangerbtn' : 'navadd go'} onClick={() => setStatus(s)} disabled={busy}>{s === 'cancelled' ? 'Batalkan pesanan' : `Tandai: ${ORDER_STATUS_LABEL[s]}`}</button>)}
          <a className="navadd" href={wa} target="_blank" rel="noopener noreferrer"><MessageCircle size={14} /> WhatsApp customer</a>
        </div>
      </div>
    </details>
  );
}

/** Tab "Pesanan" di panel admin: lihat, cari, dan proses pesanan. */
export default function OrdersAdmin({ supabase, notify }: { supabase: SupabaseClient; notify: Notify }) {
  const [orders, setOrders] = useState<Order[] | null>(null);
  const [missing, setMissing] = useState(false);
  const [filter, setFilter] = useState<'all' | OrderStatus>('all');
  const [q, setQ] = useState('');
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase.from('orders').select('*,order_items(*)').order('created_at', { ascending: false }).limit(200);
    setLoading(false);
    if (error) {
      if (/orders|schema cache|does not exist/i.test(error.message)) setMissing(true);
      else notify(`Gagal memuat pesanan: ${error.message}`, 'error');
      setOrders([]); return;
    }
    setMissing(false);
    setOrders((data ?? []).map(r => normalizeOrder(r as Record<string, unknown>)));
  }, [supabase, notify]);
  useEffect(() => { load(); }, [load]);

  const counts = useMemo(() => {
    const c: Record<string, number> = { all: orders?.length ?? 0 };
    (orders ?? []).forEach(o => { c[o.status] = (c[o.status] ?? 0) + 1; });
    return c;
  }, [orders]);
  const shown = (orders ?? []).filter(o => (filter === 'all' || o.status === filter) && (!q.trim() || `${o.order_number} ${o.customer_name} ${o.customer_phone} ${o.customer_email} ${o.company}`.toLowerCase().includes(q.trim().toLowerCase())));

  if (missing) return <div className="panel"><h2>Database pesanan belum dipasang</h2><p className="hint">Jalankan file <code>supabase/orders.sql</code> di Supabase → SQL Editor, lalu muat ulang halaman ini.</p></div>;

  return (
    <div>
      <div className="ordbar">
        <div className="sec-tabs">{FILTERS.map(f => <button key={f.key} type="button" className={filter === f.key ? 'on' : ''} onClick={() => setFilter(f.key)}>{f.label}{counts[f.key] ? <em>{counts[f.key]}</em> : null}</button>)}</div>
        <div className="ordsearch"><Search size={16} /><input type="search" placeholder="Cari nomor pesanan, nama, HP…" value={q} onChange={e => setQ(e.target.value)} aria-label="Cari pesanan" /><button type="button" className="navadd" onClick={load} disabled={loading} aria-label="Muat ulang">{loading ? <span className="spin" /> : <RefreshCw size={14} />}</button></div>
      </div>
      {orders === null ? <p className="hint">Memuat pesanan…</p> : shown.length === 0 ? <div className="panel"><p className="hint">{orders.length ? 'Tidak ada pesanan yang cocok.' : 'Belum ada pesanan masuk.'}</p></div>
        : <div className="ordlist">{shown.map(o => <OrderCard key={`${o.id}-${o.updated_at}`} o={o} supabase={supabase} notify={notify} onSaved={load} />)}</div>}
    </div>
  );
}
