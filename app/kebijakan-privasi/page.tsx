import type { Metadata } from 'next';
import InfoPage from '@/components/info-page';

export const revalidate = 300;
export const metadata: Metadata = {
  title: 'Kebijakan Privasi',
  description: 'Bagaimana Tre Joy Ease Indonesia mengumpulkan, memakai, dan melindungi data pribadi customer saat mendaftar akun dan memesan.',
  alternates: { canonical: '/kebijakan-privasi' },
};

export default function PrivacyPage() {
  return (
    <InfoPage title="Kebijakan Privasi" path="/kebijakan-privasi" updated="25 November 2026">
      {s => (
        <>
          <p>{s.company_name} (“kami”) menghargai privasi kamu. Halaman ini menjelaskan data apa yang kami kumpulkan dan untuk apa.</p>

          <h2>Data yang kami kumpulkan</h2>
          <ul>
            <li><strong>Data akun:</strong> nama, email, nomor WhatsApp, dan password. Password disimpan dalam bentuk terenkripsi (hash), kami tidak bisa melihatnya.</li>
            <li><strong>Data pesanan:</strong> barang yang dipesan, alamat pengiriman, nama perusahaan/toko (kalau diisi), dan catatan pesanan.</li>
            <li><strong>Data pembayaran:</strong> status dan nomor referensi transaksi dari Midtrans. Kami <strong>tidak</strong> menyimpan PIN, saldo, atau data rekening/e-wallet kamu.</li>
            <li><strong>Data teknis:</strong> cookie yang diperlukan untuk menjaga sesi login, dan isi keranjang yang tersimpan di browser kamu.</li>
          </ul>

          <h2>Untuk apa data dipakai</h2>
          <ul>
            <li>Memproses pesanan, pembayaran, dan pengiriman.</li>
            <li>Menghubungi kamu soal pesanan (konfirmasi, ongkos kirim, nomor resi).</li>
            <li>Mencegah penyalahgunaan dan menjaga keamanan akun.</li>
          </ul>

          <h2>Dengan siapa data dibagikan</h2>
          <p>Hanya dengan pihak yang diperlukan untuk menjalankan pesanan: penyedia pembayaran (Midtrans), ekspedisi pengiriman, dan penyedia infrastruktur website (hosting dan database). Kami tidak menjual data pribadi kamu.</p>

          <h2>Penyimpanan dan keamanan</h2>
          <p>Data disimpan di database dengan akses terbatas: setiap customer hanya bisa melihat datanya sendiri, dan seluruh koneksi ke website memakai HTTPS. Data pesanan disimpan selama diperlukan untuk keperluan layanan dan pencatatan usaha.</p>

          <h2>Hak kamu</h2>
          <p>Kamu bisa mengubah data diri di halaman <a href="/akun">Akun saya</a>. Untuk meminta salinan atau penghapusan data, hubungi kami lewat WhatsApp di +{s.whatsapp_number.replace(/\D/g, '')}.</p>
        </>
      )}
    </InfoPage>
  );
}
