import { ArrowRight, BadgeCheck, MapPin, MessageCircle, PackageCheck, QrCode, Truck } from 'lucide-react';
import type { Product, SiteSettings } from '@/lib/types';
import { money } from '@/lib/format';
import { waLink } from '@/lib/wa';
import { safeUrl } from '@/lib/safe';
import { responsiveImg } from '@/lib/img';
import { mapEmbedSrc } from '@/lib/maps';
import PromoPopup from '@/components/promo-popup';
import { getNavLinks, navAnchorProps } from '@/lib/nav';
import { CustomSectionView, FaqSectionView, HowtoSection } from '@/components/page-sections';
import type { PageSections } from '@/lib/sections';
import { SiteFooter, SiteHeader } from '@/components/site-chrome';
import CatalogGrid from '@/components/catalog-grid';
import PillBar, { type Pill } from '@/components/pill-bar';
import { categories as categoryInfo } from '@/lib/categories';
import { qrisReady } from '@/lib/payments';

/**
 * Beranda. Komponen SERVER: HTML lengkap langsung dikirim (bagus untuk Google & HP lambat),
 * JavaScript hanya dipakai bagian kecil yang interaktif (filter katalog, bar pintasan, popup).
 */
export default function Storefront({ settings, products, sections, checkout }: { settings: SiteSettings; products: Product[]; sections: PageSections; checkout: boolean }) {
  const cheapest = products.length ? products.reduce((a, b) => (b.price < a.price ? b : a), products[0]) : null;
  const wa = waLink(settings);
  const hero = safeUrl(settings.hero_image_url);
  const qris = checkout && qrisReady();

  // Link "Custom" mengikuti pengaturan menu di admin (mis. artikel /blog/custom-goodie-bag)
  const customLink = getNavLinks(settings).find(l => /custom/i.test(l.label));
  const customHref = customLink?.url ?? '#custom';
  const customAnchor = customHref.replace(/^\//, '').startsWith('#') ? customHref.replace(/^\/?#/, '') : '';
  const pills: Pill[] = [
    { label: 'Produk', href: '#produk', sec: 'produk', show: true },
    { label: 'Cara pesan', href: '#carapesan', sec: 'carapesan', show: sections.howto.enabled },
    { label: 'Custom', href: customAnchor ? `#${customAnchor}` : customHref, sec: customAnchor, props: customAnchor || !customLink ? undefined : navAnchorProps(customLink), show: customAnchor !== 'custom' || sections.custom.enabled },
    { label: 'FAQ', href: '#faq', sec: 'faq', show: sections.faq.enabled },
  ].filter(x => x.show).map(({ show: _show, ...x }) => x as Pill);

  const cats = Object.entries(categoryInfo)
    .map(([slug, c]) => ({ slug, name: c.name, list: products.filter(p => p.category === c.name) }))
    .filter(c => c.list.length);

  return (
    <>
      <a className="skip" href="#produk">Lewati ke katalog</a>
      <SiteHeader settings={settings} checkout={checkout} />

      <main id="top">
        <section className="hero container" aria-labelledby="hero-title">
          <div className="herobox">
            <div className="herotext">
              <p className="eyebrow">Supplier goodie bag · {settings.company_name}</p>
              <h1 id="hero-title">{settings.hero_title}</h1>
              <p className="lead">{settings.hero_subtitle}</p>
              {cheapest && <p className="heroprice">Mulai dari <b>{money(cheapest.price)}</b>/pcs · MOQ {cheapest.min_order} pcs</p>}
              <div className="herobtns">
                <a className="primary" href="#produk">Lihat katalog</a>
                <a className="ghost" href={wa} target="_blank" rel="noopener noreferrer">Konsultasi via WhatsApp <ArrowRight size={16} /></a>
              </div>
            </div>
            <div className="heroimg">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              {hero && <img {...responsiveImg(hero, [640, 828, 1080, 1200], '(max-width: 900px) 100vw, 50vw')} alt={`Goodie bag spunbond, paperbag, dan coolerbag dari ${settings.company_name}`} width={1200} height={1200} fetchPriority="high" decoding="async" />}
            </div>
          </div>
          <ul className="trust" aria-label="Keunggulan">
            <li><PackageCheck size={22} aria-hidden="true" /><span><b>Ready stock</b>Stok dan harga tampil langsung di katalog</span></li>
            <li><BadgeCheck size={22} aria-hidden="true" /><span><b>Bisa custom</b>Logo, motif, dan ukuran sesuai brand</span></li>
            <li><Truck size={22} aria-hidden="true" /><span><b>Kirim se-Indonesia</b>Dari gudang kami ke lokasi kamu</span></li>
            <li>{qris ? <QrCode size={22} aria-hidden="true" /> : <MessageCircle size={22} aria-hidden="true" />}<span><b>{qris ? 'Bayar QRIS' : checkout ? 'Pesan online' : 'Order mudah'}</b>{qris ? 'Checkout di website, konfirmasi otomatis' : checkout ? 'Checkout di website, pantau status pesanan' : 'Dibantu tim kami lewat WhatsApp'}</span></li>
          </ul>
        </section>

        {cats.length > 0 && (
          <nav className="container cats" aria-label="Kategori produk">
            {cats.map(c => (
              <a className="cat" key={c.slug} href={`/kategori/${c.slug}`}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                {safeUrl(c.list[0].image_url) && <img {...responsiveImg(safeUrl(c.list[0].image_url), [384, 640, 828], '(max-width: 640px) 100vw, 33vw')} alt={`Goodie bag ${c.name.toLowerCase()}`} width={600} height={600} loading="lazy" decoding="async" />}
                <span>{c.name}<small>{c.list.length} produk</small></span>
              </a>
            ))}
          </nav>
        )}

        <section id="produk" className="section" aria-labelledby="produk-title">
          <div className="container">
            <div className="sectionhead">
              <h2 id="produk-title">Katalog goodie bag</h2>
              <p>Cek ukuran, harga, minimum order, dan stok. Butuh yang khusus? Langsung konsultasi.</p>
            </div>
            <CatalogGrid products={products} />
          </div>
        </section>

        {sections.howto.enabled && <HowtoSection s={sections.howto} />}

        {sections.custom.enabled && <CustomSectionView s={sections.custom} settings={settings} />}

        <section id="about" className="section about" aria-labelledby="about-title">
          <div className="container aboutgrid">
            <div className="aboutphoto">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              {hero && <img {...responsiveImg(hero, [384, 640, 828], '(max-width: 900px) 100vw, 50vw')} alt={`Produk goodie bag ${settings.company_name}`} width={700} height={700} loading="lazy" decoding="async" />}
            </div>
            <div>
              <h2 id="about-title">Tentang {settings.company_name}</h2>
              <p>{settings.about}</p>
              <ul className="aboutpoints"><li>Supply untuk reseller dan bisnis</li><li>Custom sesuai kebutuhan branding</li><li>Gudang dan pengiriman dari {settings.address}</li></ul>
              <a className="ghost aboutmore" href="/tentang-kami">Selengkapnya tentang kami <ArrowRight size={16} /></a>
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
                  <a className="primary" href={wa} target="_blank" rel="noopener noreferrer">Chat WhatsApp <MessageCircle size={18} /></a>
                  <a href={safeUrl(settings.google_maps_url, '#')} target="_blank" rel="noopener noreferrer" className="maplink2">Buka Google Maps <ArrowRight size={15} /></a>
                </div>
                <address className="contactaddr"><MapPin size={18} /><span>{settings.address}</span></address>
              </div>
              <div className="contactmap"><iframe title={`Peta lokasi ${settings.company_name}`} src={mapEmbedSrc(settings)} loading="lazy" referrerPolicy="no-referrer-when-downgrade" /></div>
            </div>
          </div>
        </section>
      </main>

      <SiteFooter settings={settings} checkout={checkout} />

      <PromoPopup promo={settings.promo_popup} />
      <div className="pillspacer" aria-hidden="true" />
      <PillBar pills={pills} />
      <a className="wafab" href={wa} target="_blank" rel="noopener noreferrer" aria-label="Chat WhatsApp"><MessageCircle size={24} /></a>
    </>
  );
}
