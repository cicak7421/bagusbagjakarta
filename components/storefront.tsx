import { ArrowRight, BadgeCheck, Check, MapPin, MessageCircle, PackageCheck, PenLine, QrCode, ShoppingBag } from 'lucide-react';
import type { Product, SiteSettings } from '@/lib/types';
import { money } from '@/lib/format';
import { waLink } from '@/lib/wa';
import { safeUrl } from '@/lib/safe';
import { responsiveImg } from '@/lib/img';
import { mapEmbedSrc } from '@/lib/maps';
import PromoPopup from '@/components/promo-popup';
import { CustomSectionView, FaqSectionView, HowtoSection } from '@/components/page-sections';
import type { PageSections } from '@/lib/sections';
import { StoreShell, catalogMoq, formatWa } from '@/components/site-chrome';
import { ProductCard } from '@/components/product-card';
import { categories as categoryInfo } from '@/lib/categories';
import { qrisReady } from '@/lib/payments';
import { toCard, type CardProduct } from '@/lib/catalog';

const num = (n: number) => n.toLocaleString('id-ID');

/**
 * Beranda toko. Komponen SERVER: HTML lengkap langsung dikirim, JavaScript hanya untuk popup & keranjang.
 * Katalog lengkap dengan pencarian dan filter ada di /produk.
 *
 * Urutan: hero, garis fakta, kategori, rak produk, cara pesan, custom, tentang, FAQ, kontak.
 * Gayanya ada di app/home.css (semua di bawah .toko). Semua angka di halaman ini dihitung dari data produk.
 */
export default function Storefront({ settings, products, sections, checkout }: { settings: SiteSettings; products: Product[]; sections: PageSections; checkout: boolean }) {
  const wa = waLink(settings);
  const waText = formatWa(settings.whatsapp_number);
  const hero = safeUrl(settings.hero_image_url);
  const mapsUrl = safeUrl(settings.google_maps_url);
  const qris = checkout && qrisReady();
  const total = products.length;

  const cards = products.map(toCard);
  const priced = cards.filter(c => c.price > 0);
  const cheapest = priced.length ? priced.reduce((a, b) => (b.price < a.price ? b : a)) : null;
  // Minimum order terkecil di katalog (angka yang sama dipakai strip atas di semua halaman)
  const minMoq = catalogMoq(products) ?? 0;

  const cats = Object.entries(categoryInfo)
    .map(([slug, c]) => { const list = cards.filter(p => p.category === c.name); const pr = list.filter(p => p.price > 0).map(p => p.price); return { slug, name: c.name, desc: c.desc, list, from: pr.length ? Math.min(...pr) : 0 }; })
    .filter(c => c.list.length);

  // Foto dibagi supaya tidak ada produk yang tampil dua kali di beranda: hero, lalu rak, lalu ubin kategori, lalu Tentang.
  const heroPicks = cats
    .map(c => ({ c, p: c.list.find(p => p.image && !p.soldOut && p.price > 0) }))
    .filter((x): x is { c: (typeof cats)[number]; p: CardProduct } => !!x.p)
    .slice(0, 3);
  const showArt = heroPicks.length >= 3;
  const used = new Set<string>(showArt ? heroPicks.map(x => x.p.id) : []);

  const racks = cats
    .map(c => ({ ...c, items: c.list.filter(p => p.price > 0 && !p.soldOut && p.image && !used.has(p.id)).slice(0, 4) }))
    .filter(r => r.items.length);
  racks.forEach(r => r.items.forEach(p => used.add(p.id)));
  const fallbackRack = racks.length ? [] : cards.slice(0, 8);

  const tiles = cats.map(c => {
    const withImg = c.list.filter(p => p.image);
    const pics = [...withImg.filter(p => !used.has(p.id)), ...withImg.filter(p => used.has(p.id))].slice(0, 3);
    pics.forEach(p => used.add(p.id));
    return { ...c, pics };
  });

  const rest = cats.map(c => c.list.filter(p => p.image && !used.has(p.id)));
  const aboutPics: CardProduct[] = [];
  for (let i = 0; aboutPics.length < 3 && rest.some(l => l[i]); i++) for (const l of rest) if (l[i] && aboutPics.length < 3) aboutPics.push(l[i]);

  const customOn = sections.custom.enabled;

  return (
    <StoreShell settings={settings} checkout={checkout} cta={false} moq={minMoq || undefined}>
      <main id="top" className="home">
        <span id="konten" tabIndex={-1} />

        {/* ---------- Hero ---------- */}
        <section className="container hero2" aria-labelledby="hero-title">
          <div className={showArt || hero ? 'hero-panel' : 'hero-panel hero-panel--solo'}>
            <div className="hero-copy">
              <p className="seclabel hero-label">Supplier goodie bag untuk reseller, event, dan corporate</p>
              <h1 id="hero-title" className="h-display">{settings.hero_title}</h1>
              <p className="lead hero-lead">{settings.hero_subtitle}</p>
              <dl className="hero-stats">
                <div><dt>{num(total)}</dt><dd>desain di katalog</dd></div>
                {cheapest && <div><dt>{money(cheapest.price)}</dt><dd>harga mulai /pcs</dd></div>}
                {minMoq > 0 && <div><dt>{num(minMoq)} pcs</dt><dd>minimum order</dd></div>}
              </dl>
              <div className="hero-cta">
                <a className="btn btn-primary btn-lg" href="/produk">Lihat katalog ({num(total)} produk) <ArrowRight size={18} aria-hidden="true" /></a>
                {checkout
                  ? <a className="btn btn-ghost hero-wa" href={wa} target="_blank" rel="noopener noreferrer">Butuh custom? Konsultasi via WhatsApp</a>
                  : <a className="btn btn-wa-outline btn-lg hero-wa" href={wa} target="_blank" rel="noopener noreferrer"><MessageCircle size={18} aria-hidden="true" /> Konsultasi via WhatsApp</a>}
              </div>
            </div>

            {showArt ? (
              <div className="hero-art">
                {heroPicks.map(({ c, p }, i) => (
                  <a className="hero-fig" key={c.slug} href={`/kategori/${c.slug}`}>
                    <figure>
                      <div className="ph">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          {...responsiveImg(p.image, i === 0 ? [384, 640, 828] : [256, 384, 640], i === 0 ? '(max-width: 639px) 62vw, 30vw' : '(max-width: 639px) 62vw, (max-width: 899px) 30vw, 15vw')}
                          alt={`${p.name}, goodie bag ${c.name.toLowerCase()}`}
                          width={800} height={800}
                          {...(i === 0 ? { fetchPriority: 'high' as const } : { loading: 'lazy' as const })}
                          decoding="async"
                        />
                      </div>
                      <figcaption>
                        <b>{c.name}</b>
                        {c.from > 0 && <span className="num">mulai {money(c.from)} /pcs</span>}
                      </figcaption>
                    </figure>
                  </a>
                ))}
              </div>
            ) : hero ? (
              <div className="hero-art hero-art--single">
                <div className="ph">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img {...responsiveImg(hero, [640, 828, 1080], '(max-width: 899px) 100vw, 45vw')} alt={`Goodie bag dari ${settings.company_name}`} width={1200} height={1200} fetchPriority="high" decoding="async" />
                </div>
              </div>
            ) : null}
          </div>
        </section>

        {/* ---------- Garis fakta ---------- */}
        <div className="container">
          <ul className="facts" aria-label="Keunggulan">
            <li><PackageCheck size={20} aria-hidden="true" /><span>Stok tampil langsung per ukuran</span></li>
            <li><BadgeCheck size={20} aria-hidden="true" /><span>Bisa custom logo, motif, ukuran</span></li>
            <li><MapPin size={20} aria-hidden="true" /><span>Dikirim dari {settings.address}</span></li>
            <li>
              {qris ? <QrCode size={20} aria-hidden="true" /> : checkout ? <ShoppingBag size={20} aria-hidden="true" /> : <MessageCircle size={20} aria-hidden="true" />}
              <span>{qris ? 'Bayar QRIS di website' : checkout ? 'Checkout di website' : 'Pesan dibantu lewat WhatsApp'}</span>
            </li>
          </ul>
        </div>

        {/* ---------- Kategori ---------- */}
        {tiles.length > 0 && (
          <section className="container sec" aria-labelledby="kategori-title">
            <div className="sechead">
              <div><p className="seclabel">Kategori</p><h2 id="kategori-title">Belanja per kategori</h2></div>
            </div>
            <div className="tiles" data-count={tiles.length + (customOn ? 1 : 0)}>
              {tiles.map(c => (
                <a className="tile" key={c.slug} href={`/kategori/${c.slug}`}>
                  <div className="tile-ph">
                    {c.pics[0] && (
                      /* eslint-disable-next-line @next/next/no-img-element */
                      <img className="tile-main" {...responsiveImg(c.pics[0].image, [384, 640, 828], '(max-width: 639px) 78vw, (max-width: 1199px) 45vw, 300px')} alt="" width={600} height={600} loading="lazy" decoding="async" />
                    )}
                    {c.pics.length > 1 && (
                      <span className="tile-minis" aria-hidden="true">
                        {c.pics.slice(1).map(p => (
                          /* eslint-disable-next-line @next/next/no-img-element */
                          <span className="tile-mini" key={p.id}><img {...responsiveImg(p.image, [256], '56px')} alt="" width={112} height={112} loading="lazy" decoding="async" /></span>
                        ))}
                      </span>
                    )}
                  </div>
                  <div className="tile-body">
                    <h3 className="h-serif">Goodie bag {c.name.toLowerCase()}</h3>
                    <p className="tile-desc">{c.desc}</p>
                    <p className="tile-fact num">{num(c.list.length)} desain{c.from > 0 && <> · mulai {money(c.from)} /pcs</>}</p>
                    <span className="tile-go">Lihat {num(c.list.length)} desain <ArrowRight size={16} aria-hidden="true" /></span>
                  </div>
                </a>
              ))}
              {customOn && (
                <a className="tile tile--custom" href="#custom">
                  <div className="tile-ph">
                    {/* Tas polos dengan area logo kosong: "tempat logo kamu" */}
                    <span className="tile-art" aria-hidden="true">
                      <svg viewBox="0 0 120 120" width="120" height="120" fill="none" focusable="false">
                        <path d="M42 46V36a18 18 0 0 1 36 0v10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
                        <path d="M27 44h66a5 5 0 0 1 5 4.5l4.4 50A9 9 0 0 1 93.4 108H26.6a9 9 0 0 1-9-9.5l4.4-50a5 5 0 0 1 5-4.5Z" fill="var(--surface)" stroke="currentColor" strokeWidth="2.5" strokeLinejoin="round" />
                        <rect x="38" y="58" width="44" height="34" rx="5" stroke="currentColor" strokeWidth="2" strokeDasharray="5 5" strokeLinecap="round" />
                      </svg>
                      <PenLine size={22} strokeWidth={1.75} />
                    </span>
                  </div>
                  <div className="tile-body">
                    <h3 className="h-serif">Custom logo dan ukuran</h3>
                    <p className="tile-desc">Punya desain sendiri? Logo, motif, dan ukuran bisa disesuaikan.</p>
                    <span className="tile-go">Lihat cara custom <ArrowRight size={16} aria-hidden="true" /></span>
                  </div>
                </a>
              )}
            </div>
          </section>
        )}

        {/* ---------- Produk: satu rak per kategori ---------- */}
        <section id="produk" className="container sec" aria-labelledby="produk-title">
          <div className="sechead">
            <div>
              <p className="seclabel">Katalog</p>
              <h2 id="produk-title">Produk siap pesan</h2>
              <p className="secsub">Harga per pcs dan stok sudah tertera.</p>
            </div>
            <a className="seclink" href="/produk">Lihat semua {num(total)} produk <ArrowRight size={16} aria-hidden="true" /></a>
          </div>
          {racks.map(r => (
            <div className="rack" key={r.slug}>
              <div className="rack-head">
                <h3>{r.name}</h3>
                <span className="rack-count num">{num(r.list.length)} desain</span>
                <a className="seclink" href={`/kategori/${r.slug}`} aria-label={`Lihat semua goodie bag ${r.name.toLowerCase()}`}>Lihat semua <ArrowRight size={16} aria-hidden="true" /></a>
              </div>
              <div className="rack-row">{r.items.map(p => <ProductCard key={p.id} p={p} priority={false} />)}</div>
            </div>
          ))}
          {fallbackRack.length > 0 && (
            <div className="rack">
              <div className="rack-row rack-row--wrap">{fallbackRack.map(p => <ProductCard key={p.id} p={p} priority={false} />)}</div>
            </div>
          )}
          <div className="rack-foot"><a className="btn btn-outline" href="/produk">Buka katalog lengkap <ArrowRight size={18} aria-hidden="true" /></a></div>
        </section>

        {sections.howto.enabled && <HowtoSection s={sections.howto} />}

        {customOn && <CustomSectionView s={sections.custom} settings={settings} />}

        {/* ---------- Tentang ---------- */}
        <section id="about" className="band about-band" aria-labelledby="about-title">
          <div className="container about-grid">
            <div className="about-text">
              <p className="seclabel">Tentang kami</p>
              <h2 id="about-title">Tentang {settings.company_name}</h2>
              <p className="about-lead">{settings.about}</p>
              <ul className="aboutpoints">
                <li><Check size={18} aria-hidden="true" /><span>Supply untuk reseller dan bisnis</span></li>
                <li><Check size={18} aria-hidden="true" /><span>Custom sesuai kebutuhan branding</span></li>
                <li><Check size={18} aria-hidden="true" /><span>Gudang dan pengiriman dari {settings.address}</span></li>
              </ul>
              <div className="card about-id">
                <p className="h-serif about-id-name">{settings.company_name}</p>
                <address><MapPin size={18} aria-hidden="true" /><span>{settings.address}</span></address>
                {waText && (
                  <a className="about-id-wa" href={wa} target="_blank" rel="noopener noreferrer" aria-label={`WhatsApp ${waText}`}>
                    <MessageCircle size={18} aria-hidden="true" /><span className="num">{waText}</span>
                  </a>
                )}
              </div>
              <a className="linkbtn about-more" href="/tentang-kami">Selengkapnya tentang kami <ArrowRight size={16} aria-hidden="true" /></a>
            </div>
            {aboutPics.length >= 3 ? (
              <div className="about-collage">
                {aboutPics.map((p, i) => (
                  <div className="photo" key={p.id}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img {...responsiveImg(p.image, i === 0 ? [384, 640, 828] : [256, 384], i === 0 ? '(max-width: 899px) 100vw, 40vw' : '20vw')} alt={`${p.name}, goodie bag ${p.category.toLowerCase()}`} width={700} height={700} loading="lazy" decoding="async" />
                  </div>
                ))}
              </div>
            ) : hero ? (
              <div className="about-collage about-collage--single">
                <div className="about-cover">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img {...responsiveImg(hero, [384, 640, 828], '(max-width: 899px) 100vw, 40vw')} alt={`Produk goodie bag ${settings.company_name}`} width={700} height={700} loading="lazy" decoding="async" />
                </div>
              </div>
            ) : null}
          </div>
        </section>

        {sections.faq.enabled && <FaqSectionView s={sections.faq} settings={settings} />}

        {/* ---------- Kontak ---------- */}
        <section id="kontak" className="kontak-band" aria-labelledby="kontak-title">
          <div className="container kontak-grid">
            <div className="kontak-text">
              <p className="seclabel">Kontak</p>
              <h2 id="kontak-title">Siap jadi partner supply kamu.</h2>
              <p className="kontak-lead">Untuk harga reseller, custom design, atau quantity besar, hubungi tim kami.</p>
              <ul className="kontak-facts">
                {minMoq > 0 && <li>Minimum order mulai {num(minMoq)} pcs per desain</li>}
                <li>Kirim ke seluruh Indonesia</li>
                <li>Bisa custom logo, motif, dan ukuran</li>
              </ul>
              <a className="btn btn-sun btn-lg" href={wa} target="_blank" rel="noopener noreferrer"><MessageCircle size={18} aria-hidden="true" /> Chat WhatsApp</a>
            </div>
            <div className="card kontak-card">
              <div className="kontak-map"><iframe title={`Peta lokasi ${settings.company_name}`} src={mapEmbedSrc(settings)} loading="lazy" referrerPolicy="no-referrer-when-downgrade" /></div>
              <div className="kontak-where">
                <address><MapPin size={18} aria-hidden="true" /><span>{settings.address}</span></address>
                {mapsUrl && <a className="linkbtn" href={mapsUrl} target="_blank" rel="noopener noreferrer">Buka Google Maps <ArrowRight size={16} aria-hidden="true" /></a>}
              </div>
            </div>
          </div>
        </section>
      </main>

      <PromoPopup promo={settings.promo_popup} />
    </StoreShell>
  );
}
