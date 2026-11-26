import type { Metadata } from 'next';
import { ArrowRight, ChevronRight, MessageCircle } from 'lucide-react';
import { getData } from '@/lib/data';
import { getPosts, fmtDate, readingTime } from '@/lib/blog';
import { siteUrl } from '@/lib/site';
import { waLink } from '@/lib/wa';
import { categories } from '@/lib/categories';
import { responsiveImg } from '@/lib/img';
import { EmptyArt, LogoMark, StoreShell, catalogMoq } from '@/components/site-chrome';

export const revalidate = 300;

export const metadata: Metadata = {
  title: 'Blog & Tips Goodie Bag',
  description: 'Tips memilih goodie bag, paperbag, spunbond, dan coolerbag untuk event, promosi brand, dan bisnis reseller.',
  alternates: { canonical: '/blog' },
};

export default async function BlogIndex() {
  const [{ settings, products, checkoutEnabled }, posts] = await Promise.all([getData(), getPosts()]);
  const jsonLd = { '@context': 'https://schema.org', '@type': 'Blog', name: `Blog ${settings.company_name}`, url: `${siteUrl}/blog`, blogPost: posts.map(p => ({ '@type': 'BlogPosting', headline: p.title, url: `${siteUrl}/blog/${p.slug}`, datePublished: p.published_at })) };
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c') }} />
      <StoreShell settings={settings} checkout={checkoutEnabled} active="/blog" moq={catalogMoq(products)}>
        <main id="konten" className="container docpage">
          <nav className="crumbs" aria-label="Breadcrumb"><a href="/">Beranda</a><ChevronRight size={14} aria-hidden="true" /><span aria-current="page">Blog</span></nav>
          <header className="pagehead">
            <p className="seclabel">Blog</p>
            <h1>Tips dan panduan goodie bag</h1>
            <p className="pagehead-desc">Panduan memilih bahan, ukuran, dan desain goodie bag untuk event, promosi, dan bisnis kamu.</p>
          </header>
          {posts.length ? (
            <div className="bloglayout">
              <ul className="postlist">
                {posts.map((p, i) => (
                  <li className="post" key={p.id}>
                    {p.cover_image_url ? (
                      <div className="post-cover">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img {...responsiveImg(p.cover_image_url, [384, 640, 828], '(max-width: 639px) 100vw, 240px')} alt="" width={640} height={480} loading={i === 0 ? 'eager' : 'lazy'} decoding="async" />
                      </div>
                    ) : (
                      /* Artikel tanpa sampul: kotak pengganti berlogo, supaya kolom teks semua baris mulai di garis yang sama */
                      <div className="post-cover post-cover--blank" aria-hidden="true"><LogoMark size={56} /></div>
                    )}
                    <div className="post-body">
                      <p className="post-meta">
                        {p.category && <span>{p.category}</span>}
                        <time dateTime={p.published_at ?? undefined}>{fmtDate(p.published_at)}</time>
                        <span>{readingTime(p.content)} menit baca</span>
                      </p>
                      <h2 className="post-title"><a href={`/blog/${p.slug}`}>{p.title}</a></h2>
                      {p.excerpt && <p className="post-excerpt">{p.excerpt}</p>}
                      <span className="linkbtn post-more" aria-hidden="true">Baca artikel <ArrowRight size={16} /></span>
                    </div>
                  </li>
                ))}
              </ul>
              <aside className="blogside" aria-label="Katalog dan konsultasi">
                <div className="panel-soft blogside-cta">
                  <h2>Butuh goodie bag custom?</h2>
                  <p>Ukuran, motif, dan logo bisa disesuaikan dengan brand kamu. Konsultasikan kebutuhanmu dengan tim kami.</p>
                  <a className="btn btn-wa-outline" href={waLink(settings)} target="_blank" rel="noopener noreferrer"><MessageCircle size={18} aria-hidden="true" /> Konsultasi via WhatsApp</a>
                </div>
                <nav className="blogside-cats" aria-label="Kategori produk">
                  <p className="seclabel seclabel--plain">Lihat katalog</p>
                  <a href="/produk">Semua produk <ArrowRight size={16} aria-hidden="true" /></a>
                  {Object.entries(categories).map(([slug, c]) => (
                    <a key={slug} href={`/kategori/${slug}`}>Goodie bag {c.name.toLowerCase()} <ArrowRight size={16} aria-hidden="true" /></a>
                  ))}
                </nav>
              </aside>
            </div>
          ) : (
            <div className="emptystate">
              <EmptyArt />
              <h2>Belum ada artikel</h2>
              <p>Tips dan panduan goodie bag segera hadir. Sambil menunggu, lihat dulu katalog kami.</p>
              <a className="btn btn-outline" href="/produk">Lihat katalog <ArrowRight size={18} aria-hidden="true" /></a>
            </div>
          )}
        </main>
      </StoreShell>
    </>
  );
}
