import { ArrowLeft, ArrowRight, MapPin, MessageCircle, Search, Truck } from 'lucide-react';
import { waLink } from '@/lib/wa';
import type { Product, SiteSettings } from '@/lib/types';
import { categories } from '@/lib/categories';
import { toCard } from '@/lib/catalog';
import { getNavLinks, navAnchorProps } from '@/lib/nav';
import MobileMenu from '@/components/mobile-menu';
import HeaderActions from '@/components/header-actions';
import { qrisReady } from '@/lib/payments';

/* =====================================================================
   Kerangka toko: logo, StoreShell (pembungkus .toko), header, footer,
   tombol WhatsApp mengambang, info ongkir, ilustrasi keadaan kosong.
   Semua gayanya ada di app/theme.css dan hanya berlaku di dalam .toko.
   ===================================================================== */

/** Monogram: tas tote hijau botol dengan tiga titik kunyit. Warna bisa diganti lewat --logo-bag / --logo-dot. */
export function LogoMark({ size = 36 }: { size?: number }) {
  return (
    <svg className="logo-mark" viewBox="0 0 40 40" width={size} height={size} fill="none" aria-hidden="true" focusable="false">
      <path d="M13.5 15v-3.5a6.5 6.5 0 0 1 13 0V15" stroke="var(--logo-bag,var(--brand))" strokeWidth="2.6" strokeLinecap="round" />
      <path d="M8.2 14h23.6a2 2 0 0 1 2 1.8l1.6 17.4A3.5 3.5 0 0 1 31.9 37H8.1a3.5 3.5 0 0 1-3.5-3.8l1.6-17.4a2 2 0 0 1 2-1.8Z" fill="var(--logo-bag,var(--brand))" />
      <circle cx="13.4" cy="27" r="2" fill="var(--logo-dot,var(--sun))" />
      <circle cx="20" cy="28.4" r="2" fill="var(--logo-dot,var(--sun))" />
      <circle cx="26.6" cy="27" r="2" fill="var(--logo-dot,var(--sun))" />
    </svg>
  );
}

/** Logo (header, footer, laci menu, halaman akun). `tone="light"` untuk latar gelap. */
export function Brand({ href = '/', tone }: { href?: string; tone?: 'light' }) {
  return (
    <a className={tone === 'light' ? 'brand brand--light' : 'brand'} href={href} aria-label="Tre Joy Ease Indonesia, beranda">
      <LogoMark />
      <span className="brand-text"><span className="brand-name">Tre Joy Ease</span><span className="brand-desc">Supplier goodie bag</span></span>
    </a>
  );
}

/** Ilustrasi keadaan kosong (keranjang kosong, 404, hasil cari kosong, belum ada pesanan). Pakai di dalam `.emptystate`. */
export function EmptyArt() {
  return (
    <svg className="empty-art" viewBox="0 0 120 120" width="120" height="120" fill="none" aria-hidden="true" focusable="false">
      <ellipse cx="60" cy="108" rx="34" ry="4" fill="var(--surface-3)" />
      <path d="M42 46V36a18 18 0 0 1 36 0v10" stroke="var(--brand)" strokeWidth="3.5" strokeLinecap="round" />
      <path d="M27 44h66a5 5 0 0 1 5 4.5l4.4 50A9 9 0 0 1 93.4 108H26.6a9 9 0 0 1-9-9.5l4.4-50a5 5 0 0 1 5-4.5Z" fill="var(--surface)" stroke="var(--line-strong)" strokeWidth="2.5" strokeLinejoin="round" />
      <circle cx="42" cy="80" r="4.5" fill="var(--sun)" />
      <circle cx="60" cy="84" r="4.5" fill="var(--sun)" />
      <circle cx="78" cy="80" r="4.5" fill="var(--sun)" />
    </svg>
  );
}

/** Nomor WhatsApp untuk DITAMPILKAN, contoh "+62 882-0172-90240". Untuk href tetap pakai waLink(). */
export function formatWa(number: string) {
  const d = number.replace(/\D/g, '');
  if (!d) return '';
  const group = (rest: string) => (rest.length > 7 ? `${rest.slice(0, 3)}-${rest.slice(3, 7)}-${rest.slice(7)}` : rest);
  if (d.startsWith('62')) return `+62 ${group(d.slice(2))}`;
  if (d.startsWith('0')) return `0${group(d.slice(1))}`;
  return `+${d}`;
}

/**
 * Minimum order terkecil di katalog (produk yang punya harga), untuk strip atas: `<StoreShell moq={catalogMoq(products)}>`.
 * Dihitung dari `products` hasil getData() yang sudah dipanggil tiap halaman, jadi tidak ada query tambahan.
 * Semua halaman memakai fungsi ini supaya teks strip sama di seluruh toko.
 */
export function catalogMoq(products: Product[]): number | undefined {
  const moqs = products.map(toCard).filter(c => c.price > 0 && c.moq > 0).map(c => c.moq);
  return moqs.length ? Math.min(...moqs) : undefined;
}

/**
 * Info ongkos kirim. Dipakai sama persis di halaman produk, keranjang, checkout, dan halaman pesanan.
 * `compact` menyembunyikan kalimat asal pengiriman.
 */
export function ShipNote({ settings, compact = false }: { settings: Pick<SiteSettings, 'address'>; compact?: boolean }) {
  return (
    <div className="shipnote">
      <Truck size={20} aria-hidden="true" />
      <p>
        <b>Ongkos kirim belum termasuk</b>
        Dikonfirmasi admin sesuai alamat pengiriman.{!compact && settings.address ? ` Dikirim dari ${settings.address}.` : ''}
      </p>
    </div>
  );
}

/** Tombol WhatsApp mengambang. Ada di semua halaman toko kecuali checkout (lihat prop `fab` di StoreShell). */
export function WaFab({ settings }: { settings: SiteSettings }) {
  return (
    <a className="wa-fab" href={waLink(settings)} target="_blank" rel="noopener noreferrer" aria-label="Chat WhatsApp">
      <MessageCircle size={22} aria-hidden="true" /><span aria-hidden="true">Chat</span>
    </a>
  );
}

/**
 * Pembungkus SEMUA halaman publik. Memasang class .toko (scope seluruh gaya toko), skip link, header, footer,
 * dan tombol WhatsApp mengambang. Isi halaman: <main id="konten" className="…">…</main>.
 *
 * - variant="min"  : header ringkas untuk checkout (logo + kembali ke keranjang + bantuan).
 * - search={false} : tanpa kotak cari di header (halaman katalog punya kotak cari sendiri).
 * - active         : url menu yang sedang dibuka, contoh "/produk" atau "/kategori/spunbond".
 * - moq            : minimum order terkecil di katalog, ditampilkan di strip atas. Isi dengan catalogMoq(products)
 *                    di SEMUA halaman supaya teks strip tidak berubah saat pindah halaman.
 * - cta={false}    : footer tanpa baris ajakan dan tanpa jarak atas (beranda, menempel ke band Kontak).
 * - fab={false}    : tanpa tombol WhatsApp mengambang (checkout).
 * - bar            : halaman punya bar bawah di HP (.stickybar); menyetel --bar-bottom:72px.
 */
export function StoreShell({ settings, checkout = false, variant = 'full', search = true, active, moq, cta = true, fab = true, bar = false, children }: {
  settings: SiteSettings; checkout?: boolean; variant?: 'full' | 'min'; search?: boolean; active?: string; moq?: number;
  cta?: boolean; fab?: boolean; bar?: boolean; children: React.ReactNode;
}) {
  return (
    <div className={bar ? 'toko has-bar' : 'toko'}>
      <a className="skip" href="#konten">Lewati ke konten</a>
      <SiteHeader settings={settings} checkout={checkout} variant={variant} search={search} active={active} moq={moq} />
      {children}
      <SiteFooter settings={settings} checkout={checkout} cta={cta} />
      {fab && <WaFab settings={settings} />}
    </div>
  );
}

const CATEGORY_LINKS = [
  { label: 'Semua produk', url: '/produk' },
  ...Object.entries(categories).map(([slug, c]) => ({ label: c.name, url: `/kategori/${slug}` })),
];

/** Formulir cari: GET biasa ke /produk?q=… (dirender dua kali: di header untuk desktop, di bawah header untuk HP). */
function SearchForm() {
  return (
    <form className="shead-search" action="/produk" method="get" role="search">
      <Search size={18} aria-hidden="true" />
      <input type="search" name="q" placeholder="Cari produk, motif, atau SKU" aria-label="Cari produk" maxLength={60} enterKeyHint="search" />
      <button type="submit" aria-label="Cari"><ArrowRight size={18} aria-hidden="true" /></button>
    </form>
  );
}

/**
 * Header toko.
 * - Strip info (ikut menggulung), baris logo yang lengket (HP 56px, desktop 72px), kotak cari HP (ikut menggulung),
 *   dan baris kategori desktop (ikut menggulung).
 * - Menu di kanan baris kategori tetap mengikuti "Menu Navigasi" yang diatur di admin.
 */
export function SiteHeader({ settings, checkout = false, variant = 'full', search = true, active, moq }: {
  settings: SiteSettings; checkout?: boolean; variant?: 'full' | 'min'; search?: boolean; active?: string; moq?: number;
}) {
  const wa = waLink(settings);

  if (variant === 'min') {
    return (
      <header className="shead shead--min">
        <div className="container shead-main">
          <Brand />
          <div className="navright">
            <a className="linkbtn" href="/keranjang">
              <ArrowLeft size={16} aria-hidden="true" />
              <span className="shead-long">Kembali ke keranjang</span><span className="shead-short">Keranjang</span>
            </a>
            <a className="linkbtn shead-help" href={wa} target="_blank" rel="noopener noreferrer" aria-label="Bantuan WhatsApp">
              <MessageCircle size={18} aria-hidden="true" /><span className="shead-long">Bantuan WhatsApp</span>
            </a>
          </div>
        </div>
      </header>
    );
  }

  const links = getNavLinks(settings).filter(l => !/^\/?#produk$/.test(l.url));
  const mobileLinks = [...CATEGORY_LINKS, ...links, ...(checkout ? [{ label: 'Keranjang', url: '/keranjang' }, { label: 'Akun & pesanan saya', url: '/akun' }] : [])];
  const current = (url: string) => (active === url ? ('page' as const) : undefined);
  return (
    <>
      <div className="topstrip">
        <div className="container">
          <p className="topstrip-from"><Truck size={14} aria-hidden="true" /><span>Dikirim dari {settings.address}</span></p>
          <p className="topstrip-fact">
            {moq ? <>Minimum order {moq.toLocaleString('id-ID')} pcs<span className="topstrip-more"> · Kirim ke seluruh Indonesia</span></> : 'Kirim ke seluruh Indonesia'}
          </p>
        </div>
      </div>
      <header className="shead">
        <div className="container shead-main">
          <MobileMenu links={mobileLinks} wa={wa} address={settings.address} brand={<Brand />} />
          <Brand />
          {search && <SearchForm />}
          <div className="navright">
            {checkout && <HeaderActions />}
            <a className="btn btn-wa-outline btn-sm shead-wa" href={wa} target="_blank" rel="noopener noreferrer"><MessageCircle size={16} aria-hidden="true" /> WhatsApp</a>
          </div>
        </div>
      </header>
      {search && <div className="container shead-msearch"><SearchForm /></div>}
      <nav className="shead-nav" aria-label="Navigasi utama">
        <div className="container">
          <div className="shead-cats">{CATEGORY_LINKS.map(l => <a key={l.url} href={l.url} aria-current={current(l.url)}>{l.label}</a>)}</div>
          <div className="shead-links">{links.map(l => <a key={`${l.label}-${l.url}`} href={l.url} aria-current={current(l.url)} {...navAnchorProps(l)}>{l.label}</a>)}</div>
        </div>
      </nav>
    </>
  );
}

/**
 * Footer toko (gelap). `cta={false}` menyembunyikan baris ajakan dan menempelkan footer ke section di atasnya (beranda).
 */
export function SiteFooter({ settings, checkout = false, cta = true }: { settings: SiteSettings; checkout?: boolean; cta?: boolean }) {
  const wa = waLink(settings);
  const waText = formatWa(settings.whatsapp_number);
  const payFact = checkout && qrisReady() ? 'Pembayaran QRIS diproses oleh Midtrans' : checkout ? 'Pembayaran dikonfirmasi admin' : 'Pemesanan lewat WhatsApp';
  return (
    <footer className={cta ? 'sfoot' : 'sfoot sfoot--flush'}>
      <div className="container">
        {cta && (
          <div className="sfoot-cta">
            <p className="sfoot-cta-title">Butuh jumlah besar atau custom?</p>
            <a className="btn btn-sun" href={wa} target="_blank" rel="noopener noreferrer"><MessageCircle size={18} aria-hidden="true" /> Chat WhatsApp</a>
          </div>
        )}
        <div className="sfoot-grid">
          <div className="sfoot-brand">
            <Brand tone="light" />
            <p>{settings.tagline}</p>
            <div className="sfoot-legal">
              <b>{settings.company_name}</b>
              <address><MapPin size={16} aria-hidden="true" /><span>{settings.address}</span></address>
              {waText && <a className="sfoot-wa" href={wa} target="_blank" rel="noopener noreferrer" aria-label={`WhatsApp ${waText}`}><MessageCircle size={16} aria-hidden="true" /> <span className="num">{waText}</span></a>}
            </div>
          </div>
          <nav aria-label="Produk">
            <h2>Produk</h2>
            <a href="/produk">Semua produk</a>
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
          <nav className="sfoot-help" aria-label="Bantuan">
            <h2>Bantuan</h2>
            {checkout && <a href="/akun">Akun &amp; pesanan saya</a>}
            <a href="/syarat-ketentuan">Syarat &amp; ketentuan</a>
            <a href="/kebijakan-privasi">Kebijakan privasi</a>
            <a href="/kebijakan-pengembalian">Pengembalian &amp; refund</a>
          </nav>
        </div>
        <div className="sfoot-bottom">
          <span>© {new Date().getFullYear()} {settings.company_name}. Semua hak dilindungi.</span>
          <span>{payFact}</span>
        </div>
      </div>
    </footer>
  );
}
