import { ArrowRight } from 'lucide-react';
import { waLink } from '@/lib/wa';
import type { SiteSettings } from '@/lib/types';
import { categories } from '@/lib/categories';
import { getNavLinks, navAnchorProps } from '@/lib/nav';
import MobileMenu from '@/components/mobile-menu';

export function SiteHeader({ settings }: { settings: SiteSettings }) {
  return (
    <header className="nav">
      <nav className="container navin" aria-label="Navigasi utama">
        <a className="brand" href="/"><span className="brandmark">T</span><span>Tre Joy Ease <b>Indonesia</b></span></a>
        <div className="navlinks">{getNavLinks(settings).map(l => <a key={`${l.label}-${l.url}`} href={l.url} {...navAnchorProps(l)}>{l.label}</a>)}</div>
        <a className="navcta" href={waLink(settings)} target="_blank" rel="noopener noreferrer">Chat WhatsApp <ArrowRight size={16} /></a>
        <MobileMenu links={getNavLinks(settings)} />
      </nav>
    </header>
  );
}
export function SiteFooter({ settings }: { settings: SiteSettings }) {
  return (
    <footer><div className="container"><div className="footgrid">
      <div><a className="brand" href="/"><span className="brandmark">T</span><span>Tre Joy Ease <b>Indonesia</b></span></a><p>{settings.tagline}</p></div>
      <nav className="footnav" aria-label="Navigasi footer"><a href="/#produk">Produk</a>{Object.entries(categories).map(([k, x]) => <a key={k} href={`/kategori/${k}`}>{x.name}</a>)}<a href="/blog">Blog</a><a href="/#kontak">Kontak</a></nav>
    </div><div className="copy">© {new Date().getFullYear()} {settings.company_name}. Semua hak dilindungi.</div></div></footer>
  );
}
