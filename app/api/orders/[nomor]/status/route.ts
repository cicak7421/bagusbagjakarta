import { NextResponse } from 'next/server';
import { getSessionUser, noStore } from '@/lib/session';
import { createAdminClient } from '@/lib/supabase/admin';
import { getTransactionStatus, midtransConfigured } from '@/lib/midtrans';
import { applyPaymentStatus } from '@/lib/payment-sync';
import { isOrderNumber } from '@/lib/orders';

export const dynamic = 'force-dynamic';
const json = (body: unknown, status = 200) => NextResponse.json(body, { status, headers: noStore });

/**
 * Status pembayaran pesanan milik customer yang login.
 * Kalau masih menunggu, tanya langsung ke Midtrans. Jadi pesanan tetap terkonfirmasi
 * walaupun notifikasi (webhook) terlambat atau gagal terkirim.
 */
export async function GET(_request: Request, { params }: { params: Promise<{ nomor: string }> }) {
  const { nomor } = await params;
  if (!isOrderNumber(nomor)) return json({ error: 'not-found' }, 404);
  const { supabase, user } = await getSessionUser();
  if (!supabase || !user) return json({ error: 'unauthorized' }, 401);

  const { data: own } = await supabase.from('orders').select('id,status,payment_status').eq('order_number', nomor).eq('user_id', user.id).maybeSingle();
  if (!own) return json({ error: 'not-found' }, 404);

  const admin = createAdminClient();
  if (own.payment_status === 'pending' && admin && midtransConfigured()) {
    const { data: o } = await admin.from('orders').select('id,status,payment_status,payment_ref,total,admin_note').eq('id', own.id).single();
    if (o?.payment_ref) {
      const tx = await getTransactionStatus(o.payment_ref);
      if (tx?.transaction_status) {
        try {
          await applyPaymentStatus(admin, o, tx, 'poll');
          const { data: fresh } = await admin.from('orders').select('status,payment_status').eq('id', o.id).single();
          if (fresh) return json(fresh);
        } catch (e) { console.error('[midtrans] sync error', nomor, e instanceof Error ? e.message : e); }
      }
    }
  }
  return json({ status: own.status, payment_status: own.payment_status });
}
