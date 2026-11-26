import type { Metadata } from 'next';
import InfoPage from '@/components/info-page';
import { getData } from '@/lib/data';
import { categories } from '@/lib/categories';
import { clip } from '@/lib/seo';
import { safeUrl } from '@/lib/safe';
import { waLink } from '@/lib/wa';
import { formatWa } from '@/components/site-chrome';

export const revalidate = 300;

export async function generateMetadata(): Promise<Metadata> {
  const { settings } = await getData();
  return {
    title: 'Tentang Kami',
    description: clip(`${settings.company_name}: supplier goodie bag spunbond, paperbag, dan coolerbag. ${settings.about}`),
    alternates: { canonical: '/tentang-kami' },
    openGraph: { title: `Tentang ${settings.company_name}`, url: '/tentang-kami' },
  };
}

export default function AboutPage() {
  return (
    <InfoPage title="Tentang Kami" path="/tentang-kami">
      {s => (
        <>
          {/* settings.about (diatur admin) sudah menjelaskan siapa yang dilayani; kalimat tetap hanya jadi cadangan bila kosong */}
          {s.about?.trim()
            ? <p><strong>{s.company_name}</strong>. {s.about.trim()}</p>
            : <p><strong>{s.company_name}</strong> adalah supplier goodie bag yang melayani reseller, event organizer, perusahaan, dan toko retail.</p>}

          <h2>Apa yang kami sediakan</h2>
          <ul>
            {Object.entries(categories).map(([slug, c]) => <li key={slug}><a href={`/kategori/${slug}`}>Goodie bag {c.name.toLowerCase()}</a>: {c.desc}</li>)}
          </ul>

          <h2>Cara kami bekerja</h2>
          <ul>
            <li><strong>Ready stock.</strong> Stok, harga per pcs, dan minimum order tampil langsung di <a href="/produk">katalog</a>, jadi kamu bisa menghitung kebutuhan sebelum memesan.</li>
            <li><strong>Custom.</strong> Ukuran, motif, dan logo bisa disesuaikan dengan brand kamu. Tim kami mendampingi dari konsultasi sampai pengiriman.</li>
            <li><strong>Pengiriman.</strong> Pesanan dikirim dari gudang kami ke seluruh Indonesia. Ongkos kirim dikonfirmasi sesuai alamat dan jumlah barang.</li>
          </ul>

          <h2>Alamat &amp; kontak</h2>
          <p>
            {s.company_name}<br />
            {s.address}<br />
            WhatsApp: <a className="num" href={waLink(s)} target="_blank" rel="noopener noreferrer">{formatWa(s.whatsapp_number)}</a>
            {safeUrl(s.google_maps_url) && <><br /><a href={safeUrl(s.google_maps_url)} target="_blank" rel="noopener noreferrer">Lihat lokasi di Google Maps</a></>}
          </p>
        </>
      )}
    </InfoPage>
  );
}
