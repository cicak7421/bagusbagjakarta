'use client';
import { useEffect, useMemo, useState } from 'react';
import { ArrowRight, Check, ChevronRight, MapPin, MessageCircle, PackageCheck, ShieldCheck, Truck, BadgeCheck } from 'lucide-react';
import type { Product, SiteSettings } from '@/lib/types';
import { money, waLink } from '@/lib/wa';

const faqs = (s: SiteSettings) => [
  { q: 'Berapa minimal order goodie bag?', a: 'Minimal order (MOQ) berbeda tiap produk dan tertera jelas di kartu produk, mulai dari 50 pcs. Untuk kebutuhan di bawah MOQ, silakan konsultasi lewat WhatsApp.' },
  { q: 'Apakah goodie bag bisa dicustom dengan logo dan motif?', a: 'Bisa. Spunbond, paperbag, dan coolerbag dapat disesuaikan ukuran, motif, dan logo brand kamu, termasuk untuk private label.' },
  { q: 'Bagaimana cara memesan?', a: 'Pilih produk, klik tombol WhatsApp, lalu tim kami membantu cek stok, harga, dan detail custom sampai pesanan disepakati.' },
  { q: 'Bagaimana metode pembayarannya?', a: s.payment_info },
];

export default function Storefront({ settings, products }: { settings: SiteSettings; products: Product[] }) {
  const [filter, setFilter] = useState('Semua');
  const categories = ['Semua', 'Spunbond', 'Paperbag', 'Coolerbag'];
  const shown = useMemo(() => (filter === 'Semua' ? products : products.filter(p => p.category === filter)), [filter, products]);
  const cheapest = useMemo(() => products.reduce((a, b) => (b.price < a.price ? b : a), products[0]), [products]);
  const tw = settings.hero_title.split(' '), tail = tw.slice(-3).join(' '), head = tw.slice(0, -3).join(' ');
  const wa = (p?: Product) => waLink(settings, p);
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const els = document.querySelectorAll('.sectionhead,.card,.steps li,.aboutgrid>div,.faqlist details,.contactcard');
    const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }), { threshold: 0.12 });
    els.forEach(el => { el.classList.add('rv'); io.observe(el); });
    return () => io.disconnect();
  }, [filter]);
  return (
    <>
      <a className="skip" href="#produk">Lewati ke katalog</a>
      <header className="nav">
        <nav className="container navin" aria-label="Navigasi utama">
          <a className="brand" href="#top" aria-label={settings.company_name}><span className="brandmark">T</span><span>Tre Joy Ease <b>Indonesia</b></span></a>
          <div className="navlinks"><a href="#produk">Produk</a><a href="#custom">Custom</a><a href="#about">Tentang</a><a href="#faq">FAQ</a><a href="/blog">Blog</a><a href="#kontak">Kontak</a></div>
          <a className="navcta" href={wa()} target="_blank" rel="noopener noreferrer">Chat WhatsApp <ArrowRight size={16} /></a>
        </nav>
      </header>

      <main id="top">
        <section className="hero" aria-labelledby="hero-title">
          <div className="herobg">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            {settings.hero_image_url && <img src={settings.hero_image_url} alt="Goodie bag spunbond, paperbag, dan coolerbag dari Tre Joy Ease Indonesia" width={1600} height={900} fetchPriority="high" decoding="async" />}
            {settings.hero_video_url && <video autoPlay muted loop playsInline preload="metadata" poster={settings.hero_image_url || undefined} aria-hidden="true" src={settings.hero_video_url} />}
            <div className="heroshade" />
          </div>
          <div className="container herocontent">
            <div>
              <h1 id="hero-title">{head} <mark className="hl">{tail}</mark></h1>
              <p className="lead">{settings.hero_subtitle}</p>
              <div className="herobtns">
                <a className="primary" href={wa()} target="_blank" rel="noopener noreferrer">Konsultasi Sekarang <ArrowRight size={18} /></a>
                <a className="ghost" href="#produk">Lihat Katalog <ChevronRight size={18} /></a>
              </div>
              <ul className="herocats"><li><a href="/kategori/spunbond">Spunbond</a></li><li><a href="/kategori/paperbag">Paperbag</a></li><li><a href="/kategori/coolerbag">Coolerbag</a></li><li>Custom branding</li></ul>
            </div>
            {cheapest && <div className="sticker"><span>Mulai dari</span><b>{money(cheapest.price)}</b><small>/pcs · MOQ {cheapest.min_order}</small></div>}
          </div>
        </section>

        <section className="proof" aria-label="Keunggulan">
          <ul className="container proofgrid">
            <li><PackageCheck /><b>Ready stock</b><span>Stok tampil langsung di katalog</span></li>
            <li><ShieldCheck /><b>Custom branding</b><span>Motif, ukuran, dan logo sesuai brand</span></li>
            <li><Truck /><b>Ramah reseller</b><span>MOQ dan harga jelas sejak awal</span></li>
            <li><MessageCircle /><b>Respon cepat</b><span>Konsultasi dan order via WhatsApp</span></li>
          </ul>
        </section>

        <section id="produk" className="section" aria-labelledby="produk-title">
          <div className="container">
            <div className="sectionhead">
              <div><span className="kicker">Katalog goodie bag</span><h2 id="produk-title">Produk yang siap dijual kembali.</h2></div>
              <p>Cek ukuran, harga, minimum order, dan stok. Butuh yang khusus? Langsung konsultasi.</p>
            </div>
            <div className="filters" role="group" aria-label="Filter kategori">
              {categories.map(c => <button key={c} className={filter === c ? 'active' : ''} aria-pressed={filter === c} onClick={() => setFilter(c)}>{c}</button>)}
            </div>
            <div className="productgrid">
              {shown.map(p => (
                <article className="card" key={p.id}>
                  <div className="cardimg">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={p.image_url} alt={`${p.name} — goodie bag ${p.category.toLowerCase()} ukuran ${p.size}`} width={600} height={510} loading="lazy" decoding="async" />
                    <span>{p.category}</span>
                  </div>
                  <div className="cardbody">
                    <div className="stock"><span className={p.stock_qty > 0 ? 'dot' : 'dot out'} />{p.stock_qty > 0 ? `${p.stock_qty.toLocaleString('id-ID')} pcs tersedia` : 'Pre-order'}</div>
                    <h3><a href={`/produk/${p.slug}`}>{p.name}</a></h3>
                    <p>{p.description}</p>
                    <div className="spec"><span>Ukuran<b>{p.size}</b></span><span>MOQ<b>{p.min_order} pcs</b></span></div>
                    <div className="cardfoot"><div className="price">{money(p.price)} <small>/pcs</small></div><a className="cardbtn" href={`/produk/${p.slug}`} aria-label={`Lihat detail ${p.name}`}>Detail <ArrowRight size={15} /></a></div>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section id="custom" className="custom" aria-labelledby="custom-title">
          <div className="container customgrid">
            <div>
              <span className="kicker">Custom goodie bag</span>
              <h2 id="custom-title">Bawa identitas brand kamu ke setiap tas.</h2>
              <p>Dari pemilihan bahan sampai motif cetak, tim kami bantu mengubah kebutuhan reseller, event, corporate, dan retail jadi produk yang siap produksi.</p>
              <ul className="checks">{['Spunbond', 'Paperbag', 'Coolerbag', 'Custom ukuran', 'Custom motif', 'Private label'].map(t => <li key={t}><Check size={16} />{t}</li>)}</ul>
              <a className="primary" href={wa()} target="_blank" rel="noopener noreferrer">Diskusikan Custom <ArrowRight size={18} /></a>
            </div>
            <ol className="steps">
              <li><b>Konsultasi kebutuhan</b><span>Ceritakan jenis tas, jumlah, dan tujuan penggunaannya.</span></li>
              <li><b>Pilih bahan, ukuran, dan desain</b><span>Kami bantu rekomendasi yang pas dengan budget dan brand kamu.</span></li>
              <li><b>Produksi</b><span>Pesanan diproses sesuai spesifikasi yang sudah disepakati.</span></li>
              <li><b>Pengiriman</b><span>Goodie bag siap dikirim ke lokasi kamu.</span></li>
            </ol>
          </div>
        </section>

        <section id="about" className="section about" aria-labelledby="about-title">
          <div className="container aboutgrid">
            <div className="aboutphoto">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              {settings.hero_image_url && <img src={settings.hero_image_url} alt={`Tim dan produk ${settings.company_name}`} width={700} height={735} loading="lazy" decoding="async" />}
            </div>
            <div>
              <span className="kicker">Tentang kami</span>
              <h2 id="about-title">{settings.company_name}</h2>
              <p>{settings.about}</p>
              <ul className="aboutpoints">
                <li><BadgeCheck size={20} />Supply untuk reseller dan bisnis</li>
                <li><BadgeCheck size={20} />Custom sesuai kebutuhan branding</li>
                <li><BadgeCheck size={20} />Order terarah lewat WhatsApp</li>
              </ul>
            </div>
          </div>
        </section>

        <section id="faq" className="faq" aria-labelledby="faq-title">
          <div className="container faqgrid">
            <div><span className="kicker">Pertanyaan umum</span><h2 id="faq-title">Sebelum order, cek dulu ini.</h2></div>
            <div className="faqlist">{faqs(settings).map(f => <details key={f.q}><summary>{f.q}</summary><p>{f.a}</p></details>)}</div>
          </div>
        </section>

        <section id="kontak" className="contact" aria-labelledby="kontak-title">
          <div className="container contactgrid">
            <div>
              <span className="kicker">Hubungi kami</span>
              <h2 id="kontak-title">Siap jadi partner supply kamu.</h2>
              <p>Untuk harga reseller, custom design, atau quantity besar, hubungi tim kami.</p>
              <a className="primary" href={wa()} target="_blank" rel="noopener noreferrer">Chat WhatsApp <MessageCircle size={18} /></a>
            </div>
            <div className="contactcard">
              <div className="map"><iframe title={`Peta lokasi ${settings.company_name}`} src={`https://www.google.com/maps?q=${encodeURIComponent(settings.address)}&output=embed`} loading="lazy" referrerPolicy="no-referrer-when-downgrade" /></div>
              <address className="contactmeta" style={{ fontStyle: 'normal' }}><MapPin /><div><b>Alamat</b><span>{settings.address}</span></div></address>
              <a href={settings.google_maps_url} target="_blank" rel="noopener noreferrer" className="maplink">Buka Google Maps <ArrowRight size={15} /></a>
              <div className="payment"><b>Metode pembayaran</b><p>{settings.payment_info}</p></div>
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

      <a className="wafab" href={wa()} target="_blank" rel="noopener noreferrer" aria-label="Chat WhatsApp"><MessageCircle size={26} /></a>

    </>
  );
}
