import type { Metadata } from 'next';
import InfoPage from '@/components/info-page';

export const revalidate = 300;
export const metadata: Metadata = {
  title: 'Syarat & Ketentuan',
  description: 'Syarat dan ketentuan pemesanan goodie bag di Tre Joy Ease Indonesia: harga, minimum order, pembayaran, pengiriman, dan pembatalan.',
  alternates: { canonical: '/syarat-ketentuan' },
};

export default function TermsPage() {
  return (
    <InfoPage title="Syarat & Ketentuan" path="/syarat-ketentuan" updated="25 November 2026">
      {s => (
        <>
          <p>Dengan memesan di website ini, kamu menyetujui syarat dan ketentuan {s.company_name} (“kami”) di bawah ini.</p>

          <h2>1. Produk, harga, dan stok</h2>
          <ul>
            <li>Harga yang tertera adalah harga per pcs dalam Rupiah dan belum termasuk ongkos kirim.</li>
            <li>Setiap produk punya minimum order (MOQ) yang tertera di halaman produk.</li>
            <li>Warna pada foto bisa sedikit berbeda dari barang asli karena pencahayaan dan layar.</li>
            <li>Harga dan stok dapat berubah sewaktu-waktu. Harga yang berlaku adalah harga saat pesanan dibuat.</li>
          </ul>

          <h2>2. Akun</h2>
          <p>Checkout online membutuhkan akun. Kamu bertanggung jawab menjaga kerahasiaan password dan memastikan data yang diisi benar.</p>

          <h2>3. Pemesanan dan pembayaran</h2>
          <ul>
            <li>Pesanan ready stock dapat dibuat langsung di website. Pembayaran dilakukan sesuai petunjuk di halaman pesanan: QRIS (diproses oleh Midtrans, terkonfirmasi otomatis) atau transfer bank dengan konfirmasi admin.</li>
            <li>QRIS berlaku untuk total sampai Rp 10.000.000 per transaksi. Di atas itu, pembayaran dilakukan lewat transfer bank dengan konfirmasi admin.</li>
            <li>Pesanan yang belum dibayar dalam 24 jam dapat dibatalkan otomatis dan stoknya dilepas kembali.</li>
            <li>Pesanan custom (logo, motif, atau ukuran khusus) disepakati lewat WhatsApp, termasuk harga, uang muka, dan waktu produksi.</li>
          </ul>

          <h2>4. Pengiriman</h2>
          <ul>
            <li>Barang dikirim dari gudang kami di {s.address} ke alamat yang kamu isi saat checkout.</li>
            <li>Ongkos kirim dan pilihan ekspedisi dikonfirmasi admin sesuai alamat dan jumlah barang.</li>
            <li>Nomor resi dapat dilihat di halaman pesanan setelah barang dikirim. Lama pengiriman mengikuti ekspedisi.</li>
          </ul>

          <h2>5. Pembatalan dan pengembalian</h2>
          <p>Pesanan yang belum dibayar bisa kamu batalkan sendiri dari halaman pesanan. Ketentuan untuk pesanan yang sudah dibayar ada di <a href="/kebijakan-pengembalian">Kebijakan Pengembalian &amp; Refund</a>.</p>

          <h2>6. Lain-lain</h2>
          <p>Kami dapat memperbarui syarat ini dari waktu ke waktu. Versi terbaru selalu tersedia di halaman ini. Syarat ini tunduk pada hukum Republik Indonesia.</p>
        </>
      )}
    </InfoPage>
  );
}
