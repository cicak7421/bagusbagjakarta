import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { getTransactionStatus, midtransConfigured, verifySignature, type MidtransStatus } from '@/lib/midtrans';
import { applyPaymentStatus } from '@/lib/payment-sync';
import { noStore } from '@/lib/session';

export const dynamic = 'force-dynamic';
const reply = (body: unknown, status = 200) => NextResponse.json(body, { status, headers: noStore });

/**
 * Webhook notifikasi pembayaran dari Midtrans.
 * Pasang URL ini di dashboard Midtrans → Settings → Configuration → Payment Notification URL:
 *   https://DOMAIN-KAMU/api/midtrans/notification
 *
 * Urutan pengamanan:
 *  1. Signature SHA-512 harus cocok dengan Server Key (pengirim palsu ditolak).
 *  2. Status diambil ulang langsung dari API Midtrans (isi notifikasi tidak dipercaya begitu saja).
 *  3. Nominal harus sama dengan total pesanan di database.
 *  4. Idempotent: notifikasi ganda tidak mengubah apa-apa.
 */
export async function POST(request: Request) {
  const admin = createAdminClient();
  if (!admin || !midtransConfigured()) return reply({ error: 'not-configured' }, 503);

  let n: MidtransStatus & { signature_key?: string };
  try {
    const raw = await request.text();
    if (raw.length > 20_000) return reply({ error: 'too-large' }, 413);
    n = JSON.parse(raw);
  } catch { return reply({ error: 'bad-json' }, 400); }
  if (!n || typeof n !== 'object' || !verifySignature(n)) return reply({ error: 'invalid-signature' }, 403);

  const ref = String(n.order_id);
  const { data: o, error } = await admin.from('orders').select('id,status,payment_status,payment_ref,total,admin_note').eq('payment_ref', ref).maybeSingle();
  if (error) return reply({ error: 'db' }, 500);          // Midtrans akan mencoba kirim ulang
  if (!o) return reply({ ok: true, ignored: 'unknown-order' }); // mis. tombol "test notification" di dashboard / tagihan lama

  // Sumber kebenaran: status terbaru langsung dari Midtrans. Kalau API-nya tidak terjangkau, pakai isi notifikasi yang signature-nya sudah valid.
  const live = await getTransactionStatus(ref);
  const tx: MidtransStatus = live?.transaction_status && live.order_id === ref ? live : n;
  try {
    const r = await applyPaymentStatus(admin, o, tx, 'webhook');
    return reply({ ok: true, result: r.reason });
  } catch (e) {
    console.error('[midtrans] webhook error', ref, e instanceof Error ? e.message : e);
    return reply({ error: 'db' }, 500);
  }
}
