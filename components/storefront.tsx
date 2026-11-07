'use client';
import { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowRight, MapPin, MessageCircle } from 'lucide-react';
import type { Product, SiteSettings } from '@/lib/types';
import { money } from '@/lib/format';
import { waLink } from '@/lib/wa';
import { safeUrl } from '@/lib/safe';
import { mapEmbedSrc } from '@/lib/maps';
import PromoPopup from '@/components/promo-popup';
import MobileMenu from '@/components/mobile-menu';
import { productSoldOut, startingPrice } from '@/lib/variants';
import { getNavLinks, navAnchorProps } from '@/lib/nav';
import { Swatch } from '@/components/swatch';
import { CustomSectionView, FaqSectionView, HowtoSection } from '@/components/page-sections';
import type { PageSections } from '@/lib/sections';

export default function Storefront({ settings, products, sections }: { settings: SiteSettings; products: Product[]; sections: PageSections }) {
  const [filter, setFilter] = useState('Semua');
  const categories = ['Semua', 'Spunbond', 'Paperbag', 'Coolerbag'];
  const shown = useMemo(() => (filter === 'Semua' ? products : products.filter(p => p.category === filter)), [filter, products]);
  const cheapest = useMemo(() => products.reduce((a, b) => (b.price < a.price ? b : a), products[0]), [products]);
  const wa = (p?: Product) => waLink(settings, p);

  // Link "Custom" mengikuti pengaturan menu di admin (mis. artikel /blog/custom-goodie-bag)
  const customLink = getNavLinks(settings).find(l => /custom/i.test(l.label));
  const customHref = customLink?.url ?? '#custom';
  const customAnchor = customHref.replace(/^\//, '').startsWith('#') ? customHref.replace(/^\/?#/, '') : '';
  const customProps = customLink ? navAnchorProps(customLink) : {};
  const allPills = [
    { label: 'Produk', href: '#produk', sec: 'produk', props: {}, show: true },
    { label: 'Cara pesan', href: '#carapesan', sec: 'carapesan', props: {}, show: sections.howto.enabled },
    { label: 'Custom', href: customAnchor ? `#${customAnchor}` : customHref, sec: customAnchor || '', props: customAnchor ? {} : customProps, show: customAnchor !== 'custom' || sections.custom.enabled },
    { label: 'FAQ', href: '#faq', sec: 'faq', props: {}, show: sections.faq.enabled },
  ];
  const pills = allPills.filter(x => x.show);
  const [active, setActive] = useState('');
  useEffect(() => {
    const els = ['produk', 'carapesan', 'custom', 'about', 'faq', 'kontak'].map(id => document.getElementById(id)).filter((e): e is HTMLElement => !!e);
    if (!('IntersectionObserver' in window)) return;
    const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) setActive(e.target.id); }), { rootMargin: '-45% 0px -50% 0px' });
    els.forEach(e => io.observe(e));
    return () => io.disconnect();
  }, []);
  const pillRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = pillRef.current?.querySelector<HTMLElement>('a.on');
    const box = pillRef.current;
    if (!el || !box || box.scrollWidth <= box.clientWidth) return;
    box.scrollTo({ left: el.offsetLeft - (box.clientWidth - el.offsetWidth) / 2, behavior: 'smooth' });
  }, [active]);
  const cats = categories.slice(1).map(c => ({ name: c, slug: c.toLowerCase(), list: products.filter(p => p.category === c) })).filter(c => c.list.length);
  return (
    <>
      <a className="skip" href="#produk">Lewati ke katalog</a>
      <header className="nav">
        <nav className="container navin" aria-label="Navigasi utama">
          <a className="brand" href="#top" aria-label={settings.company_name}><span className="brandmark">T</span><span>Tre Joy Ease <b>Indonesia</b></span></a>
          <div className="navlinks">{getNavLinks(settings).map(l => <a key={`${l.label}-${l.url}`} href={l.url} {...navAnchorProps(l)}>{l.label}</a>)}</div>
          <a className="navcta" href={wa()} target="_blank" rel="noopener noreferrer">Chat WhatsApp</a>
          <MobileMenu links={getNavLinks(settings)} />
        </nav>
      </header>

      <main id="top">
        <section className="hero container" aria-labelledby="hero-title">
          <div className="herobox">
            <div className="herotext">
              <h1 id="hero-title">{settings.hero_title}</h1>
              <p className="lead">{settings.hero_subtitle}</p>
              {cheapest && <p className="heroprice">Mulai dari <b>{money(cheapest.price)}</b>/pcs · MOQ {cheapest.min_order} pcs</p>}
              <div className="herobtns">
                <a className="primary" href="#produk">Lihat katalog</a>
                <a className="ghost" href={wa()} target="_blank" rel="noopener noreferrer">Konsultasi via WhatsApp <ArrowRight size={16} /></a>
              </div>
            </div>
            <div className="heroimg">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              {safeUrl(settings.hero_image_url) && <img src={safeUrl(settings.hero_image_url)} alt="Goodie bag spunbond, paperbag, dan coolerbag dari Tre Joy Ease Indonesia" width={1200} height={1000} fetchPriority="high" decoding="async" />}
            </div>
          </div>
          <div className="heroline"><span><b>Ready stock</b> tampil langsung di katalog</span><span><b>Custom</b> logo, motif, dan ukuran</span><span><b>Order</b> lewat WhatsApp</span></div>
        </section>

        <div className="container cats">
          {cats.map(c => (
            <a className="cat" key={c.slug} href={`/kategori/${c.slug}`}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={safeUrl(c.list[0].image_url)} alt={`Goodie bag ${c.slug}`} width={600} height={600} loading="lazy" decoding="async" />
              <span>{c.name}<small>{c.list.length} produk</small></span>
            </a>
          ))}
        </div>

        <section id="produk" className="section" aria-labelledby="produk-title">
          <div className="container">
            <div className="sectionhead">
              <h2 id="produk-title">Semua produk</h2>
              <p>Cek ukuran, harga, minimum order, dan stok. Butuh yang khusus? Langsung konsultasi.</p>
            </div>
            <div className="filters" role="group" aria-label="Filter kategori">
              {categories.map(c => <button key={c} className={filter === c ? 'active' : ''} aria-pressed={filter === c} onClick={() => setFilter(c)}>{c}</button>)}
            </div>
            <div className="productgrid">
              {shown.map(p => (
                <article className="card" key={p.id}>
                  <a className="cardimg" href={`/produk/${p.slug}`} tabIndex={-1} aria-hidden="true">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={safeUrl(p.image_url)} alt={`${p.name} — goodie bag ${p.category.toLowerCase()} ukuran ${p.size}`} width={600} height={600} loading="lazy" decoding="async" />
                    {productSoldOut(p) && <span className="soldtag">Stok habis</span>}
                  </a>
                  <div className="cardbody">
                    {(p.colors.length > 0 || p.motifs.length > 0) && (
                      <div className="dots" aria-label={`${p.colors.length} warna, ${p.motifs.length} motif`}>
                        {p.colors.slice(0, 5).map(o => <Swatch key={o.name} option={o} />)}
                        {p.colors.length > 5 && <small>+{p.colors.length - 5}</small>}
                        {p.motifs.length > 0 && <small className="motifcount">{p.motifs.length} motif</small>}
                      </div>
                    )}
                    <small className="cat2">{p.category} · {p.size}</small>
                    <h3><a href={`/produk/${p.slug}`}>{p.name}</a></h3>
                    <div className="cardfoot"><div className="price">{(p.sizes ?? []).some(s => s.price) && startingPrice(p) < Math.max(...(p.sizes ?? []).map(s => s.price || p.price)) && <small>mulai </small>}{money(startingPrice(p))} <small>/pcs</small></div></div>
                    <div className="stock"><span className={productSoldOut(p) ? 'dot out' : 'dot'} />{productSoldOut(p) ? 'Stok habis' : `Stok ${p.stock_qty.toLocaleString('id-ID')}`} · MOQ {p.min_order}</div>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        {sections.howto.enabled && <HowtoSection s={sections.howto} />}

        {sections.custom.enabled && <CustomSectionView s={sections.custom} settings={settings} />}

        <section id="about" className="section about" aria-labelledby="about-title">
          <div className="container aboutgrid">
            <div className="aboutphoto">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              {safeUrl(settings.hero_image_url) && <img src={safeUrl(settings.hero_image_url)} alt={`Tim dan produk ${settings.company_name}`} width={700} height={700} loading="lazy" decoding="async" />}
            </div>
            <div>
              <h2 id="about-title">{settings.company_name}</h2>
              <p>{settings.about}</p>
              <ul className="aboutpoints"><li>Supply untuk reseller dan bisnis</li><li>Custom sesuai kebutuhan branding</li><li>Order terarah lewat WhatsApp</li></ul>
            </div>
          </div>
        </section>

        {sections.faq.enabled && <FaqSectionView s={sections.faq} settings={settings} />}

        <section id="kontak" className="section contact" aria-labelledby="kontak-title">
          <div className="container">
            <div className="contactbox">
              <div className="contacttext">
                <h2 id="kontak-title">Siap jadi partner supply kamu.</h2>
                <p>Untuk harga reseller, custom design, atau quantity besar, hubungi tim kami.</p>
                <div className="contactactions">
                  <a className="primary" href={wa()} target="_blank" rel="noopener noreferrer">Chat WhatsApp <MessageCircle size={18} /></a>
                  <a href={safeUrl(settings.google_maps_url, '#')} target="_blank" rel="noopener noreferrer" className="maplink2">Buka Google Maps <ArrowRight size={15} /></a>
                </div>
                <address className="contactaddr"><MapPin size={18} /><span>{settings.address}</span></address>
              </div>
              <div className="contactmap"><iframe title={`Peta lokasi ${settings.company_name}`} src={mapEmbedSrc(settings)} loading="lazy" referrerPolicy="no-referrer-when-downgrade" /></div>
            </div>
          </div>
        </section>
      </main>

      <footer>
        <div className="container">
          <div className="footgrid">
            <div><div className="brand"><span className="brandmark">T</span><span>Tre Joy Ease <b>Indonesia</b></span></div><p>{settings.tagline}</p></div>
            <nav className="footnav" aria-label="Navigasi footer"><a href="#produk">Produk</a><a href="/kategori/spunbond">Spunbond</a><a href="/kategori/paperbag">Paperbag</a><a href="/kategori/coolerbag">Coolerbag</a><a href="#faq">FAQ</a><a href="/blog">Blog</a><a href="#kontak">Kontak</a></nav>
          </div>
          <div className="copy">© {new Date().getFullYear()} {settings.company_name}. Semua hak dilindungi.</div>
        </div>
      </footer>

      <PromoPopup promo={settings.promo_popup} />
      <div className="pillspacer" aria-hidden="true" />
      <nav className="pillbar" aria-label="Pintasan bagian halaman">
        <div className="pillin" ref={pillRef}>
          {pills.map(x => <a key={x.label} href={x.href} {...x.props} className={x.sec && active === x.sec ? 'on' : ''} aria-current={x.sec && active === x.sec ? 'true' : undefined}>{x.label}</a>)}
        </div>
      </nav>

      <a className="wafab" href={wa()} target="_blank" rel="noopener noreferrer" aria-label="Chat WhatsApp"><MessageCircle size={24} /></a>
    </>
  );
}
