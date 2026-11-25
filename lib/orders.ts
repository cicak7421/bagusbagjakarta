/** Tipe & label pesanan (dipakai halaman akun customer dan panel admin). */
export type OrderStatus = 'pending_payment' | 'paid' | 'processing' | 'shipped' | 'completed' | 'cancelled';
export type PaymentStatus = 'unpaid' | 'pending' | 'paid' | 'expired' | 'failed' | 'refunded';

export type OrderItem = {
  id: string;
  product_id: string | null;
  product_name: string;
  product_slug: string;
  category: string;
  image_url: string;
  color_name: string | null;
  motif_name: string | null;
  size_name: string | null;
  unit_price: number;
  qty: number;
  line_total: number;
};

export type Order = {
  id: string;
  order_number: string;
  user_id?: string;
  status: OrderStatus;
  payment_status: PaymentStatus;
  payment_method: 'qris' | 'manual';
  subtotal: number;
  shipping_cost: number;
  total: number;
  customer_name: string;
  customer_phone: string;
  customer_email: string;
  company: string;
  shipping_address: string;
  shipping_city: string;
  shipping_postal_code: string;
  notes: string;
  admin_note?: string;
  courier: string;
  tracking_number: string;
  payment_attempt?: number;
  payment_ref?: string | null;
  payment_transaction_id?: string | null;
  payment_qr_url: string | null;
  payment_expires_at: string | null;
  paid_at: string | null;
  created_at: string;
  updated_at: string;
  order_items?: OrderItem[];
};

/** Kolom pesanan yang dikirim ke browser customer (tanpa catatan internal admin). */
export const CUSTOMER_ORDER_COLUMNS =
  'id,order_number,status,payment_status,payment_method,subtotal,shipping_cost,total,customer_name,customer_phone,customer_email,company,shipping_address,shipping_city,shipping_postal_code,notes,courier,tracking_number,payment_qr_url,payment_expires_at,paid_at,created_at,updated_at';

export const ORDER_STATUS_LABEL: Record<OrderStatus, string> = {
  pending_payment: 'Menunggu pembayaran',
  paid: 'Sudah dibayar',
  processing: 'Diproses',
  shipped: 'Dikirim',
  completed: 'Selesai',
  cancelled: 'Dibatalkan',
};
export const PAYMENT_STATUS_LABEL: Record<PaymentStatus, string> = {
  unpaid: 'Belum dibayar',
  pending: 'Menunggu pembayaran QRIS',
  paid: 'Lunas',
  expired: 'Kode QRIS kedaluwarsa',
  failed: 'Pembayaran gagal',
  refunded: 'Dana dikembalikan',
};
/** Urutan langkah untuk indikator progres di halaman pesanan. */
export const ORDER_STEPS: OrderStatus[] = ['pending_payment', 'paid', 'processing', 'shipped', 'completed'];

/** Batas nominal QRIS per transaksi (maksimal Rp 10.000.000). */
export const QRIS_MAX_AMOUNT = 10_000_000;

export const isOrderNumber = (s: unknown): s is string => typeof s === 'string' && /^TJE-\d{6}-[A-Z0-9]{6}$/.test(s);

export const variantLabel = (it: Pick<OrderItem, 'color_name' | 'motif_name' | 'size_name'>) =>
  [it.size_name, it.color_name, it.motif_name ? `Motif ${it.motif_name}` : ''].filter(Boolean).join(' · ');

export const fmtDateTime = (iso: string | null | undefined) =>
  iso ? new Intl.DateTimeFormat('id-ID', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'Asia/Jakarta' }).format(new Date(iso)) + ' WIB' : '';

/** Supabase mengembalikan numeric sebagai number/string → pastikan number. */
export function normalizeOrder(row: Record<string, unknown>): Order {
  const o = row as unknown as Order;
  return {
    ...o,
    subtotal: Number(o.subtotal) || 0,
    shipping_cost: Number(o.shipping_cost) || 0,
    total: Number(o.total) || 0,
    order_items: Array.isArray(o.order_items)
      ? o.order_items.map(i => ({ ...i, unit_price: Number(i.unit_price) || 0, line_total: Number(i.line_total) || 0, qty: Number(i.qty) || 0 }))
      : undefined,
  };
}

/** Hanya izinkan redirect ke path internal (cegah open redirect lewat ?next=). */
export function safeNext(input: unknown, fallback = '/akun'): string {
  if (typeof input !== 'string') return fallback;
  return /^\/(?![/\\])[\w\-./?=&%]*$/.test(input) ? input : fallback;
}
