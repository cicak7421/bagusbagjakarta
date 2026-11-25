import type { SupabaseClient } from '@supabase/supabase-js';
import type { MidtransStatus } from '@/lib/midtrans';

export type PayableOrder = { id: string; status: string; payment_status: string; payment_ref: string | null; total: number | string; admin_note?: string | null };

/**
 * Terapkan status transaksi Midtrans ke pesanan. Dipakai webhook dan pengecekan status.
 * Idempotent: notifikasi yang sama dikirim berkali-kali tidak mengubah apa-apa lagi.
 * `db` harus client admin (secret key) karena customer tidak boleh mengubah pesanan.
 */
export async function applyPaymentStatus(db: SupabaseClient, order: PayableOrder, tx: MidtransStatus, source: 'webhook' | 'poll') {
  const status = tx.transaction_status;
  if (!status || !order.payment_ref || tx.order_id !== order.payment_ref) return { changed: false, reason: 'ref-mismatch' };
  const log = (transaction_status: string) => db.from('payment_events').insert({ order_id: order.id, payment_ref: order.payment_ref, transaction_status, source, payload: tx });

  const paid = status === 'settlement' || (status === 'capture' && tx.fraud_status === 'accept');
  if (paid) {
    // Nominal yang dibayar harus sama persis dengan total pesanan di database
    if (Math.round(Number(tx.gross_amount)) !== Math.round(Number(order.total))) {
      await log('amount_mismatch');
      return { changed: false, reason: 'amount-mismatch' };
    }
    if (order.payment_status === 'paid') return { changed: false, reason: 'already-paid' };
    const note = order.status === 'cancelled'
      ? `${order.admin_note ?? ''} [PERHATIAN: pembayaran masuk setelah pesanan dibatalkan. Hubungi customer / refund]`.trim()
      : undefined;
    const { data, error } = await db.from('orders')
      .update({ payment_status: 'paid', paid_at: new Date().toISOString(), payment_transaction_id: tx.transaction_id ?? null, ...(note ? { admin_note: note } : {}) })
      .eq('id', order.id).neq('payment_status', 'paid').select('id');
    if (error) throw new Error(error.message);
    if (data?.length) await log(status);
    return { changed: !!data?.length, reason: 'paid' };
  }

  const next = status === 'expire' ? 'expired'
    : ['deny', 'cancel', 'failure'].includes(status) ? 'failed'
    : ['refund', 'partial_refund'].includes(status) ? 'refunded' : null;
  if (!next) return { changed: false, reason: 'pending' };
  // expired/failed hanya menimpa tagihan yang masih menunggu; refund hanya menimpa yang sudah lunas
  const from = next === 'refunded' ? 'paid' : 'pending';
  if (order.payment_status !== from) return { changed: false, reason: 'ignored' };
  const { data, error } = await db.from('orders').update({ payment_status: next })
    .eq('id', order.id).eq('payment_status', from).eq('payment_ref', order.payment_ref).select('id');
  if (error) throw new Error(error.message);
  if (data?.length) await log(status);
  return { changed: !!data?.length, reason: next };
}
