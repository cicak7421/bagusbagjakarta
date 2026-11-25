/**
 * Metode pembayaran yang ditampilkan ke pengunjung.
 *
 * QRIS diproses lewat Midtrans (lihat lib/midtrans.ts dan app/api/midtrans/notification).
 * Aktif/tidaknya ditentukan di SERVER (ada Server Key + database pesanan terpasang),
 * bukan lewat env NEXT_PUBLIC_*, supaya tidak bisa "dinyalakan" dari browser.
 */
export type PaymentMethod = { id: 'qris' | 'whatsapp'; name: string; description: string };

export const paymentMethods: PaymentMethod[] = [
  { id: 'qris', name: 'QRIS (e-wallet & m-banking)', description: 'Checkout di website, scan kode QR, pesanan terkonfirmasi otomatis. Maksimal Rp 10 juta per transaksi.' },
  { id: 'whatsapp', name: 'Pesan via WhatsApp', description: 'Untuk order besar, custom, atau transfer bank: tim kami bantu cek stok dan kirim detail pembayaran.' },
];

/**
 * QRIS benar-benar siap dipakai? (Server Key Midtrans + secret key Supabase sudah dipasang di server.)
 * Hanya bernilai benar di server; di browser selalu false karena env-nya tidak pernah dikirim ke sana.
 */
export const qrisReady = () =>
  !!process.env.MIDTRANS_SERVER_KEY?.trim() && !!(process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY);
