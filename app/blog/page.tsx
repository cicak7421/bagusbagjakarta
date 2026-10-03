import type { Metadata } from 'next';
import { ArrowRight, ChevronRight } from 'lucide-react';
import { getData } from '@/lib/data';
import { getPosts, fmtDate, readingTime } from '@/lib/blog';
import { siteUrl } from '@/lib/site';
import { SiteFooter, SiteHeader } from '@/components/site-chrome';

export const metadata: Metadata = {
  title: 'Blog & Tips Goodie Bag',
  description: 'Tips memilih goodie bag, paperbag, spunbond, dan coolerbag untuk event, promosi brand, dan bisnis reseller.',
  alternates: { canonical: '/blog' },
};

export default async function BlogIndex() {
  const [{ settings }, posts] = await Promise.all([getData(), getPosts()]);
  const jsonLd = { '@context': 'https://schema.org', '@type': 'Blog', name: `Blog ${settings.company_name}`, url: `${siteUrl}/blog`, blogPost: posts.map(p => ({ '@type': 'BlogPosting', headline: p.title, url: `${siteUrl}/blog/${p.slug}`, datePublished: p.published_at })) };
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c') }} />
      <SiteHeader settings={settings} />
      <main className="container pdp">
        <nav className="crumbs" aria-label="Breadcrumb"><a href="/">Beranda</a><ChevronRight size={14} /><span aria-current="page">Blog</span></nav>
        <div className="sectionhead"><div><span className="kicker">Blog</span><h1 className="cathead">Tips & panduan goodie bag</h1></div><p>Panduan memilih bahan, ukuran, dan desain goodie bag untuk event, promosi, dan bisnis kamu.</p></div>
        {posts.length ? (
          <div className="productgrid">
            {posts.map(p => (
              <article className="card" key={p.id}>
                {p.cover_image_url && <div className="cardimg">{/* eslint-disable-next-line @next/next/no-img-element */}<img src={p.cover_image_url} alt={p.title} width={600} height={510} loading="lazy" />{p.category && <span>{p.category}</span>}</div>}
                <div className="cardbody">
                  <div className="stock">{fmtDate(p.published_at)} · {readingTime(p.content)} menit baca</div>
                  <h2 className="cardtitle"><a href={`/blog/${p.slug}`}>{p.title}</a></h2>
                  <p>{p.excerpt}</p>
                  <div className="cardfoot"><a className="cardbtn" href={`/blog/${p.slug}`}>Baca artikel <ArrowRight size={15} /></a></div>
                </div>
              </article>
            ))}
          </div>
        ) : <p className="pdpdesc">Belum ada artikel. Segera hadir.</p>}
      </main>
      <SiteFooter settings={settings} />
    </>
  );
}
