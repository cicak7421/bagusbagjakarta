import { NextResponse } from 'next/server';
import { getSessionUser, noStore, sameOrigin } from '@/lib/session';
import { createAdminClient } from '@/lib/supabase/admin';
import { chargeQris, midtransConfigured } from '@/lib/midtrans';
import { isOrderNumber, QRIS_MAX_AMOUNT } from '@/lib/orders';

export const dynamic = 'force-dynamic';
const MAX_ATTEMPTS = 8;
const json = (body: unknown, status = 200) => NextResponse.json(body, { status, headers: noStore });

/**
 * Buat (atau ambil ulang) kode QRIS untuk sebuah pesanan.
 * Nominal SELALU dari database. Browser hanya mengirim nomor pesanan.
 */
export async function POST(request: Request, { params }: { params: Promise<{ nomor: string }> }) {
  if (!sameOrigin(request)) return json({ error: 'Permintaan tidak valid.' }, 403);
  const { nomor } = await params;
  if (!isOrderNumber(nomor)) return json({ error: 'Pesanan tidak ditemukan.' }, 404);

  const { supabase, user } = await getSessionUser();
  if (!supabase || !user) return json({ error: 'Sesi login habis. Silakan masuk lagi.' }, 401);
  const admin = createAdminClient();
  if (!admin || !midtransConfigured()) return json({ error: 'Pembayaran QRIS belum aktif. Hubungi admin lewat WhatsApp.' }, 503);

  // Dibaca dengan sesi customer → RLS menjamin ini pesanannya sendiri
  const { data: own } = await supabase.from('orders').select('id').eq('order_number', nomor).eq('user_id', user.id).maybeSingle();
  if (!own) return json({ error: 'Pesanan tidak ditemukan.' }, 404);

  const { data: o } = await admin.from('orders')
    .select('id,order_number,status,payment_status,payment_method,total,payment_attempt,payment_qr_url,payment_expires_at,customer_name,customer_email,customer_phone')
    .eq('id', own.id).single();
  if (!o) return json({ error: 'Pesanan tidak ditemukan.' }, 404);
  if (o.status !== 'pending_payment' || o.payment_status === 'paid') return json({ error: 'Pesanan ini sudah tidak menunggu pembayaran.' }, 409);
  if (o.payment_method !== 'qris') return json({ error: 'Pesanan ini dibayar lewat admin. Hubungi kami lewat WhatsApp.' }, 409);
  const total = Math.round(Number(o.total));
  if (!(total > 0)) return json({ error: 'Total pesanan tidak valid.' }, 409);
  if (total > QRIS_MAX_AMOUNT) return json({ error: 'Total di atas batas QRIS (Rp 10.000.000). Pembayaran lewat transfer bank, hubungi admin.' }, 409);

  // Kode yang masih aktif dipakai ulang (klik ganda / refresh tidak membuat tagihan baru)
  const now = new Date();
  if (o.payment_status === 'pending' && o.payment_qr_url && o.payment_expires_at && new Date(o.payment_expires_at).getTime() - now.getTime() > 60_000) {
    return json({ qr_url: o.payment_qr_url, expires_at: o.payment_expires_at });
  }
  if (o.payment_attempt >= MAX_ATTEMPTS) return json({ error: 'Terlalu banyak percobaan bayar untuk pesanan ini. Hubungi admin lewat WhatsApp.' }, 429);

  // Kunci percobaan ini: hanya satu request yang boleh menaikkan payment_attempt dari nilai lama
  const attempt = o.payment_attempt + 1;
  const ref = `${o.order_number}-${attempt}`;
  const { data: locked } = await admin.from('orders')
    .update({ payment_attempt: attempt, payment_ref: ref, payment_status: 'pending', payment_qr_url: null, payment_qr_string: null, payment_expires_at: null })
    .eq('id', o.id).eq('payment_attempt', o.payment_attempt).eq('status', 'pending_payment').neq('payment_status', 'paid').select('id');
  if (!locked?.length) return json({ error: 'Pembayaran sedang diproses. Tunggu beberapa detik lalu muat ulang halaman.' }, 409);

  try {
    const r = await chargeQris({ orderId: ref, amount: total, customer: { name: o.customer_name, email: o.customer_email, phone: o.customer_phone }, now });
    if (!r.ok || !r.qrUrl) {
      console.error('[midtrans] charge gagal', ref, r.data.status_code, r.data.status_message);
      await admin.from('orders').update({ payment_status: 'failed' }).eq('id', o.id).eq('payment_ref', ref);
      await admin.from('payment_events').insert({ order_id: o.id, payment_ref: ref, transaction_status: 'charge_failed', source: 'charge', payload: { status_code: r.data.status_code, status_message: r.data.status_message } });
      return json({ error: 'Gagal membuat kode QRIS. Coba lagi, atau hubungi admin lewat WhatsApp.' }, 502);
    }
    const expires = r.expiresAt.toISOString();
    await admin.from('orders').update({ payment_transaction_id: r.data.transaction_id ?? null, payment_qr_url: r.qrUrl, payment_qr_string: r.data.qr_string ?? null, payment_expires_at: expires }).eq('id', o.id).eq('payment_ref', ref);
    return json({ qr_url: r.qrUrl, expires_at: expires });
  } catch (e) {
    console.error('[midtrans] charge error', ref, e instanceof Error ? e.message : e);
    await admin.from('orders').update({ payment_status: 'failed' }).eq('id', o.id).eq('payment_ref', ref);
    return json({ error: 'Layanan pembayaran sedang tidak bisa dihubungi. Coba lagi sebentar lagi.' }, 502);
  }
}
