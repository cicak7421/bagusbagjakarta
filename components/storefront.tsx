import { ArrowRight, BadgeCheck, MapPin, MessageCircle, PackageCheck, QrCode, Truck } from 'lucide-react';
import type { Product, SiteSettings } from '@/lib/types';
import { money } from '@/lib/format';
import { waLink } from '@/lib/wa';
import { safeUrl } from '@/lib/safe';
import { responsiveImg } from '@/lib/img';
import { mapEmbedSrc } from '@/lib/maps';
import PromoPopup from '@/components/promo-popup';
import { CustomSectionView, FaqSectionView, HowtoSection } from '@/components/page-sections';
import type { PageSections } from '@/lib/sections';
import { SiteFooter, SiteHeader } from '@/components/site-chrome';
import { ProductCard } from '@/components/product-card';
import { categories as categoryInfo } from '@/lib/categories';
import { qrisReady } from '@/lib/payments';
import { toCard, type CardProduct } from '@/lib/catalog';

/** Ambil produk pilihan: yang punya harga & stok, bergantian antar kategori supaya beranda beragam. */
function pickFeatured(cards: CardProduct[], n: number) {
  const ok = cards.filter(c => c.price > 0 && !c.soldOut && c.image);
  const byCat = new Map<string, CardProduct[]>();
  ok.forEach(c => byCat.set(c.category, [...(byCat.get(c.category) ?? []), c]));
  const out: CardProduct[] = [];
  const lists = [...byCat.values()];
  for (let i = 0; out.length < n && lists.some(l => l[i]); i++) for (const l of lists) if (l[i] && out.length < n) out.push(l[i]);
  return out.length ? out : cards.slice(0, n);
}

/**
 * Beranda toko. Komponen SERVER: HTML lengkap langsung dikirim, JavaScript hanya untuk popup & keranjang.
 * Katalog lengkap dengan pencarian dan filter ada di /produk.
 */
export default function Storefront({ settings, products, sections, checkout }: { settings: SiteSettings; products: Product[]; sections: PageSections; checkout: boolean }) {
  const wa = waLink(settings);
  const hero = safeUrl(settings.hero_image_url);
  const qris = checkout && qrisReady();
  const cards = products.map(toCard);
  const priced = cards.filter(c => c.price > 0);
  const cheapest = priced.length ? priced.reduce((a, b) => (b.price < a.price ? b : a)) : null;
  const featured = pickFeatured(cards, 8);
  const mosaic = pickFeatured(cards, 4);
  const cats = Object.entries(categoryInfo)
    .map(([slug, c]) => { const list = cards.filter(p => p.category === c.name); const pr = list.filter(p => p.price > 0).map(p => p.price); return { slug, name: c.name, desc: c.desc, list, from: pr.length ? Math.min(...pr) : 0 }; })
    .filter(c => c.list.length);

  return (
    <>
      <a className="skip" href="#produk">Lewati ke produk</a>
      <SiteHeader settings={settings} checkout={checkout} />

      <main id="top">
        <section className="container hero2" aria-labelledby="hero-title">
          <div className="hero2-text">
            <p className="eyebrow">Supplier goodie bag · {settings.company_name}</p>
            <h1 id="hero-title">{settings.hero_title}</h1>
            <p className="lead">{settings.hero_subtitle}</p>
            <div className="hero2-btns">
              <a className="primary" href="/produk">Belanja sekarang <ArrowRight size={17} /></a>
              <a className="outline" href={wa} target="_blank" rel="noopener noreferrer"><MessageCircle size={17} /> Konsultasi custom</a>
            </div>
            <dl className="hero2-stats">
              <div><dt>{products.length}+</dt><dd>desain siap pesan</dd></div>
              {cheapest && <div><dt>{money(cheapest.price)}</dt><dd>harga mulai /pcs</dd></div>}
              {cheapest && <div><dt>{cheapest.moq} pcs</dt><dd>minimum order</dd></div>}
            </dl>
          </div>
          <div className={mosaic.length >= 4 ? 'hero2-art grid' : 'hero2-art'}>
            {mosaic.length >= 4
              ? mosaic.map((m, i) => (
                <a key={m.id} href={`/produk/${m.slug}`} aria-label={m.name}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img {...responsiveImg(m.image, [256, 384, 640], '(max-width: 900px) 50vw, 25vw')} alt={`${m.name}, goodie bag ${m.category.toLowerCase()}`} width={600} height={600} {...(i === 0 ? { fetchPriority: 'high' as const } : { loading: 'lazy' as const })} decoding="async" />
                  <span>{m.name}</span>
                </a>
              ))
              /* eslint-disable-next-line @next/next/no-img-element */
              : hero && <img {...responsiveImg(hero, [640, 828, 1080], '(max-width: 900px) 100vw, 50vw')} alt={`Goodie bag dari ${settings.company_name}`} width={1200} height={1200} fetchPriority="high" decoding="async" />}
          </div>
        </section>

        <section className="container">
          <ul className="trust" aria-label="Keunggulan">
            <li><PackageCheck size={22} aria-hidden="true" /><span><b>Ready stock</b>Stok dan harga tampil langsung di katalog</span></li>
            <li><BadgeCheck size={22} aria-hidden="true" /><span><b>Bisa custom</b>Logo, motif, dan ukuran sesuai brand</span></li>
            <li><Truck size={22} aria-hidden="true" /><span><b>Kirim se-Indonesia</b>Dari gudang kami ke lokasi kamu</span></li>
            <li>{qris ? <QrCode size={22} aria-hidden="true" /> : <MessageCircle size={22} aria-hidden="true" />}<span><b>{qris ? 'Bayar QRIS' : checkout ? 'Pesan online' : 'Order mudah'}</b>{qris ? 'Checkout di website, konfirmasi otomatis' : checkout ? 'Checkout di website, pantau status pesanan' : 'Dibantu tim kami lewat WhatsApp'}</span></li>
          </ul>
        </section>

        {cats.length > 0 && (
          <section className="container sec" aria-labelledby="kategori-title">
            <div className="sechead"><h2 id="kategori-title">Belanja per kategori</h2></div>
            <div className="catcards">
              {cats.map(c => (
                <a className="catcard" key={c.slug} href={`/kategori/${c.slug}`}>
                  <div className="catcard-imgs">
                    {c.list.filter(p => p.image).slice(0, 3).map(p => (
                      /* eslint-disable-next-line @next/next/no-img-element */
                      <img key={p.id} {...responsiveImg(p.image, [256, 384], '(max-width: 640px) 33vw, 12vw')} alt="" width={300} height={300} loading="lazy" decoding="async" />
                    ))}
                  </div>
                  <div className="catcard-body">
                    <h3>Goodie bag {c.name.toLowerCase()}</h3>
                    <p>{c.list.length} desain{c.from > 0 && <> · mulai {money(c.from)}</>}</p>
                    <span className="catcard-go">Lihat semua <ArrowRight size={15} /></span>
                  </div>
                </a>
              ))}
            </div>
          </section>
        )}

        <section id="produk" className="container sec" aria-labelledby="produk-title">
          <div className="sechead">
            <div><h2 id="produk-title">Produk pilihan</h2><p>Ready stock, harga per pcs sudah tertera.</p></div>
            <a className="seclink" href="/produk">Lihat semua {products.length} produk <ArrowRight size={16} /></a>
          </div>
          <div className="pgrid">{featured.map((p, i) => <ProductCard key={p.id} p={p} priority={i < 4} />)}</div>
          <div className="sec-cta"><a className="primary" href="/produk">Buka katalog lengkap <ArrowRight size={17} /></a></div>
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
      <a className="wafab" href={wa} target="_blank" rel="noopener noreferrer" aria-label="Chat WhatsApp"><MessageCircle size={24} /></a>
    </>
  );
}
