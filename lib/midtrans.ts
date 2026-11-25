import { createHash, timingSafeEqual } from 'node:crypto';

/**
 * Midtrans Core API (QRIS) — HANYA dijalankan di server.
 *
 * Env (tanpa awalan NEXT_PUBLIC_, isi di Vercel → Settings → Environment Variables):
 *   MIDTRANS_SERVER_KEY      Server Key dari dashboard Midtrans (Settings → Access Keys)
 *   MIDTRANS_IS_PRODUCTION   "true" untuk produksi. Kosong/"false" = sandbox (uji coba).
 *
 * Aturan aman yang dipegang kode ini:
 *   1. Nominal tagihan selalu diambil dari database, bukan dari browser.
 *   2. Server Key tidak pernah dikirim ke browser.
 *   3. Status lunas hanya dari notifikasi yang signature-nya valid DAN dicek ulang ke API Midtrans.
 */
const serverKey = () => process.env.MIDTRANS_SERVER_KEY?.trim() || '';

export const midtransConfigured = () => serverKey().length > 0;

export function midtransIsProduction() {
  // Key sandbox diawali "SB-": jangan pernah mengirimnya ke server produksi.
  if (serverKey().startsWith('SB-')) return false;
  return process.env.MIDTRANS_IS_PRODUCTION === 'true';
}
const baseUrl = () => (midtransIsProduction() ? 'https://api.midtrans.com' : 'https://api.sandbox.midtrans.com');

const headers = () => ({
  Accept: 'application/json',
  'Content-Type': 'application/json',
  Authorization: `Basic ${Buffer.from(`${serverKey()}:`).toString('base64')}`,
});

export type MidtransStatus = {
  status_code?: string;
  status_message?: string;
  transaction_id?: string;
  order_id?: string;
  gross_amount?: string;
  payment_type?: string;
  transaction_status?: string;
  fraud_status?: string;
  qr_string?: string;
  actions?: { name: string; method: string; url: string }[];
};

/** Format waktu yang diminta Midtrans: "yyyy-MM-dd HH:mm:ss +0700" (WIB). */
function midtransTime(d: Date) {
  const wib = new Date(d.getTime() + 7 * 3600 * 1000).toISOString();
  return `${wib.slice(0, 10)} ${wib.slice(11, 19)} +0700`;
}

export const QRIS_EXPIRY_MINUTES = 30;

/** Buat tagihan QRIS. `orderId` harus unik per percobaan bayar. */
export async function chargeQris(input: { orderId: string; amount: number; customer: { name: string; email: string; phone: string }; now?: Date }) {
  const now = input.now ?? new Date();
  const res = await fetch(`${baseUrl()}/v2/charge`, {
    method: 'POST',
    headers: headers(),
    cache: 'no-store',
    signal: AbortSignal.timeout(15000),
    body: JSON.stringify({
      payment_type: 'qris',
      transaction_details: { order_id: input.orderId, gross_amount: Math.round(input.amount) },
      qris: { acquirer: 'gopay' },
      custom_expiry: { order_time: midtransTime(now), expiry_duration: QRIS_EXPIRY_MINUTES, unit: 'minute' },
      customer_details: { first_name: input.customer.name.slice(0, 60), email: input.customer.email || undefined, phone: input.customer.phone },
    }),
  });
  const data = (await res.json().catch(() => ({}))) as MidtransStatus;
  const qrUrl = data.actions?.find(a => a.name === 'generate-qr-code')?.url;
  const ok = data.status_code === '201' && data.transaction_status === 'pending' && !!qrUrl && /^https:\/\/api\.(sandbox\.)?midtrans\.com\//.test(qrUrl);
  return { ok, data, qrUrl: ok ? qrUrl! : null, expiresAt: new Date(now.getTime() + QRIS_EXPIRY_MINUTES * 60000) };
}

/** Status transaksi langsung dari Midtrans (sumber kebenaran). null = tidak bisa dihubungi. */
export async function getTransactionStatus(orderId: string): Promise<MidtransStatus | null> {
  try {
    const res = await fetch(`${baseUrl()}/v2/${encodeURIComponent(orderId)}/status`, { headers: headers(), cache: 'no-store', signal: AbortSignal.timeout(10000) });
    return (await res.json()) as MidtransStatus;
  } catch { return null; }
}

/** signature_key = SHA512(order_id + status_code + gross_amount + ServerKey), dibandingkan dengan waktu konstan. */
export function verifySignature(n: { order_id?: unknown; status_code?: unknown; gross_amount?: unknown; signature_key?: unknown }) {
  if (![n.order_id, n.status_code, n.gross_amount, n.signature_key].every(v => typeof v === 'string' && v.length > 0 && v.length < 300)) return false;
  const expected = createHash('sha512').update(`${n.order_id}${n.status_code}${n.gross_amount}${serverKey()}`).digest();
  const given = Buffer.from(n.signature_key as string, 'hex');
  return given.length === expected.length && timingSafeEqual(given, expected);
}
