/**
 * Metode pembayaran.
 *
 * Mitra Trans belum aktif (coming soon). Status sengaja ditulis di kode,
 * BUKAN lewat env/NEXT_PUBLIC_*, supaya tidak ada yang bisa "menyalakan" tombol
 * bayar dari sisi browser sebelum backend-nya siap.
 *
 * Saat integrasi Mitra Trans dikerjakan nanti, aturan amannya:
 *  1. Harga & total SELALU dihitung ulang di server dari database (jangan percaya angka dari browser).
 *  2. Secret / API key Mitra Trans hanya di env server (tanpa awalan NEXT_PUBLIC_).
 *  3. Status "lunas" hanya boleh diubah oleh webhook yang signature-nya diverifikasi,
 *     bukan oleh halaman redirect/success di browser.
 *  4. Simpan pesanan dulu (status `pending`), baru buat transaksi; pakai idempotency key
 *     supaya klik ganda tidak membuat tagihan ganda.
 */
export type PaymentMethodStatus = 'active' | 'coming_soon';

export type PaymentMethod = {
  id: 'whatsapp' | 'mitra_trans';
  name: string;
  description: string;
  status: PaymentMethodStatus;
};

export const paymentMethods: PaymentMethod[] = [
  {
    id: 'whatsapp',
    name: 'Pesan via WhatsApp',
    description: 'Tim kami cek stok & harga, lalu kirim detail pembayaran setelah pesanan disepakati.',
    status: 'active',
  },
  {
    id: 'mitra_trans',
    name: 'Bayar langsung via Mitra Trans',
    description: 'Checkout dan bayar langsung di website. Segera hadir.',
    status: 'coming_soon',
  },
];

export const directPaymentEnabled = paymentMethods.some(m => m.id === 'mitra_trans' && m.status === 'active');
