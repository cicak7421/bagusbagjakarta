import type { Metadata } from 'next';
import InfoPage from '@/components/info-page';

export const revalidate = 300;
export const metadata: Metadata = {
  title: 'Kebijakan Pengembalian & Refund',
  description: 'Ketentuan pembatalan pesanan, komplain barang rusak atau tidak sesuai, dan pengembalian dana di Tre Joy Ease Indonesia.',
  alternates: { canonical: '/kebijakan-pengembalian' },
};

export default function RefundPage() {
  return (
    <InfoPage title="Kebijakan Pengembalian & Refund" path="/kebijakan-pengembalian" updated="25 November 2026">
      {s => (
        <>
          <h2>Pembatalan pesanan</h2>
          <ul>
            <li><strong>Belum dibayar:</strong> bisa dibatalkan kapan saja dari halaman pesanan.</li>
            <li><strong>Sudah dibayar, belum dikirim:</strong> hubungi admin secepatnya lewat WhatsApp. Kalau pesanan belum diproses, dana dikembalikan penuh.</li>
            <li><strong>Pesanan custom:</strong> tidak bisa dibatalkan setelah proses produksi dimulai, karena barang dibuat khusus untuk kamu.</li>
          </ul>

          <h2>Barang rusak, kurang, atau tidak sesuai</h2>
          <ul>
            <li>Laporkan paling lambat <strong>3 × 24 jam</strong> setelah barang diterima, lewat WhatsApp.</li>
            <li>Sertakan nomor pesanan, foto barang, dan video saat membuka paket (unboxing) sebagai bukti.</li>
            <li>Setelah kami periksa, solusinya bisa berupa kirim ulang barang, penggantian kekurangan, atau pengembalian dana sesuai jumlah yang bermasalah.</li>
          </ul>

          <h2>Yang tidak bisa dikembalikan</h2>
          <ul>
            <li>Barang yang sudah dipakai, dicetak, atau diubah.</li>
            <li>Perbedaan warna tipis akibat pencahayaan foto atau layar.</li>
            <li>Kerusakan karena kesalahan pemakaian.</li>
          </ul>

          <h2>Pengembalian dana</h2>
          <p>Refund yang disetujui diproses dalam <strong>7 sampai 14 hari kerja</strong> lewat transfer ke rekening atau e-wallet atas nama pemesan. Ongkos kirim pengembalian barang karena kesalahan kami ditanggung oleh kami.</p>

          <p>Hubungi {s.company_name} di WhatsApp +{s.whatsapp_number.replace(/\D/g, '')} untuk semua pertanyaan soal pengembalian.</p>
        </>
      )}
    </InfoPage>
  );
}
