import { MapPin, MessageCircle, ShieldCheck } from 'lucide-react';
import { waLink } from '@/lib/wa';
import type { SiteSettings } from '@/lib/types';
import { categories } from '@/lib/categories';
import { getNavLinks, navAnchorProps } from '@/lib/nav';
import MobileMenu from '@/components/mobile-menu';
import HeaderActions from '@/components/header-actions';
import { qrisReady } from '@/lib/payments';

/** Nama brand = nama perusahaan tanpa "PT" (logo teks di navbar & footer). */
export function Brand({ href = '/' }: { href?: string }) {
  return <a className="brand" href={href} aria-label="Tre Joy Ease Indonesia, beranda"><span className="brandmark" aria-hidden="true">T</span><span>Tre Joy Ease <b>Indonesia</b></span></a>;
}

export function SiteHeader({ settings, checkout = false }: { settings: SiteSettings; checkout?: boolean }) {
  const links = getNavLinks(settings);
  const mobileLinks = checkout ? [...links, { label: 'Keranjang', url: '/keranjang' }, { label: 'Akun & pesanan saya', url: '/akun' }] : links;
  return (
    <header className="nav">
      <nav className="container navin" aria-label="Navigasi utama">
        <Brand />
        <div className="navlinks">{links.map(l => <a key={`${l.label}-${l.url}`} href={l.url} {...navAnchorProps(l)}>{l.label}</a>)}</div>
        <div className="navright">
          {checkout && <HeaderActions />}
          <a className="navcta" href={waLink(settings)} target="_blank" rel="noopener noreferrer"><MessageCircle size={16} aria-hidden="true" /><span>WhatsApp</span></a>
          <MobileMenu links={mobileLinks} />
        </div>
      </nav>
    </header>
  );
}

export function SiteFooter({ settings, checkout = false }: { settings: SiteSettings; checkout?: boolean }) {
  return (
    <footer>
      <div className="container">
        <div className="footcols">
          <div className="footabout">
            <Brand />
            <p>{settings.tagline}</p>
            <address><MapPin size={16} aria-hidden="true" /><span>{settings.address}</span></address>
            <a className="footwa" href={waLink(settings)} target="_blank" rel="noopener noreferrer"><MessageCircle size={16} aria-hidden="true" /> +{settings.whatsapp_number.replace(/\D/g, '')}</a>
          </div>
          <nav aria-label="Produk">
            <h2>Produk</h2>
            <a href="/#produk">Semua produk</a>
            {Object.entries(categories).map(([k, x]) => <a key={k} href={`/kategori/${k}`}>Goodie bag {x.name.toLowerCase()}</a>)}
            <a href="/#custom">Custom logo &amp; ukuran</a>
          </nav>
          <nav aria-label="Informasi">
            <h2>Informasi</h2>
            <a href="/tentang-kami">Tentang kami</a>
            <a href="/#carapesan">Cara pesan</a>
            <a href="/#faq">FAQ</a>
            <a href="/blog">Blog &amp; tips</a>
            <a href="/#kontak">Kontak</a>
          </nav>
          <nav aria-label="Bantuan">
            <h2>Bantuan</h2>
            {checkout && <a href="/akun">Akun &amp; pesanan saya</a>}
            <a href="/syarat-ketentuan">Syarat &amp; ketentuan</a>
            <a href="/kebijakan-privasi">Kebijakan privasi</a>
            <a href="/kebijakan-pengembalian">Pengembalian &amp; refund</a>
          </nav>
        </div>
        <div className="copy">
          <span>© {new Date().getFullYear()} {settings.company_name}. Semua hak dilindungi.</span>
          <span className="footsecure"><ShieldCheck size={15} aria-hidden="true" /> {checkout && qrisReady() ? 'Pembayaran QRIS diproses aman oleh Midtrans' : 'Koneksi aman (HTTPS)'}</span>
        </div>
      </div>
    </footer>
  );
}
