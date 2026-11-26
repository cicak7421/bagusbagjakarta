import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { ArrowRight, ChevronRight, MessageCircle } from 'lucide-react';
import { getData } from '@/lib/data';
import { getPosts, fmtDate, readingTime } from '@/lib/blog';
import { waLink } from '@/lib/wa';
import { siteUrl } from '@/lib/site';
import { responsiveImg } from '@/lib/img';
import { LogoMark, StoreShell, catalogMoq } from '@/components/site-chrome';

type Props = { params: Promise<{ slug: string }> };

export const revalidate = 300;
export const generateStaticParams = async () => [];

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const post = (await getPosts()).find(p => p.slug === slug);
  if (!post) return { title: 'Artikel tidak ditemukan', robots: { index: false } };
  // Judul SEO dari admin kadang sudah diakhiri nama toko ("… | Tre Joy Ease"). Akhiran itu dilepas supaya
  // pola judul dari app/layout.tsx ("… | Tre Joy Ease Indonesia") dipakai sama seperti halaman lain.
  const title = (post.meta_title || post.title).replace(/\s*[|·–-]\s*(PT\s+)?Tre Joy Ease(\s+Indonesia)?\s*$/i, '').trim() || post.title;
  const description = (post.meta_description || post.excerpt).slice(0, 160);
  return {
    title, description, alternates: { canonical: `/blog/${post.slug}` },
    openGraph: { type: 'article', title, description, url: `/blog/${post.slug}`, publishedTime: post.published_at ?? undefined, modifiedTime: post.updated_at, authors: [post.author], images: post.cover_image_url ? [{ url: post.cover_image_url, alt: post.title }] : undefined },
    twitter: { card: 'summary_large_image' },
  };
}

export default async function BlogPost({ params }: Props) {
  const { slug } = await params;
  const [{ settings, products, checkoutEnabled }, posts] = await Promise.all([getData(), getPosts()]);
  const post = posts.find(p => p.slug === slug);
  if (!post) notFound();
  const more = posts.filter(p => p.id !== post.id).slice(0, 3);
  const url = `${siteUrl}/blog/${post.slug}`;
  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      { '@type': 'BreadcrumbList', itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Beranda', item: siteUrl },
        { '@type': 'ListItem', position: 2, name: 'Blog', item: `${siteUrl}/blog` },
        { '@type': 'ListItem', position: 3, name: post.title, item: url } ] },
      { '@type': 'BlogPosting', headline: post.title, description: post.meta_description || post.excerpt, image: post.cover_image_url || undefined, datePublished: post.published_at, dateModified: post.updated_at || post.published_at, inLanguage: 'id-ID', mainEntityOfPage: url,
        author: { '@type': 'Organization', name: post.author || settings.company_name }, publisher: { '@type': 'Organization', name: settings.company_name, url: siteUrl } },
    ],
  };
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c') }} />
      <StoreShell settings={settings} checkout={checkoutEnabled} active="/blog" moq={catalogMoq(products)}>
        <main id="konten" className="container container--text docpage">
          <nav className="crumbs" aria-label="Breadcrumb"><a href="/">Beranda</a><ChevronRight size={14} aria-hidden="true" /><a href="/blog">Blog</a><ChevronRight size={14} aria-hidden="true" /><span aria-current="page">{post.title}</span></nav>
          <article className="article">
            <header className="article-head">
              {post.category && <p className="seclabel">{post.category}</p>}
              <h1>{post.title}</h1>
              <p className="postmeta">
                {post.author && <span>{post.author}</span>}
                <time dateTime={post.published_at ?? undefined}>{fmtDate(post.published_at)}</time>
                <span>{readingTime(post.content)} menit baca</span>
              </p>
            </header>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            {post.cover_image_url && <img className="articlecover" {...responsiveImg(post.cover_image_url, [640, 828, 1200], '(max-width: 808px) 100vw, 760px')} alt={post.title} width={1200} height={630} fetchPriority="high" />}
            <div className="prose"><ReactMarkdown remarkPlugins={[remarkGfm]} components={{ img: ({ src, alt }) => /* eslint-disable-next-line @next/next/no-img-element */ <img src={typeof src === 'string' ? src : undefined} alt={alt ?? ''} loading="lazy" />, a: ({ href, children }) => <a href={href} {...(href?.startsWith('http') ? { target: '_blank', rel: 'noopener noreferrer' } : {})}>{children}</a> }}>{post.content}</ReactMarkdown></div>
            <aside className="panel-soft articlecta" aria-label="Konsultasi">
              <div><b>Butuh goodie bag untuk bisnis atau event kamu?</b><span>Konsultasikan bahan, ukuran, dan custom branding bersama tim kami.</span></div>
              <a className="btn btn-wa-outline" href={waLink(settings)} target="_blank" rel="noopener noreferrer"><MessageCircle size={18} aria-hidden="true" /> Chat WhatsApp</a>
            </aside>
          </article>
          {more.length > 0 && (
            <section className="morepost" aria-labelledby="more-title">
              <div className="sechead">
                <h2 id="more-title">Artikel lainnya</h2>
                <a className="seclink" href="/blog">Semua artikel <ArrowRight size={16} aria-hidden="true" /></a>
              </div>
              <ul className="postgrid">
                {more.map(r => (
                  <li className="post post--card" key={r.id}>
                    {r.cover_image_url ? (
                      <div className="post-cover">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img {...responsiveImg(r.cover_image_url, [256, 384, 640], '(max-width: 639px) 100vw, 240px')} alt="" width={640} height={480} loading="lazy" decoding="async" />
                      </div>
                    ) : (
                      <div className="post-cover post-cover--blank" aria-hidden="true"><LogoMark size={48} /></div>
                    )}
                    <div className="post-body">
                      <p className="post-meta"><time dateTime={r.published_at ?? undefined}>{fmtDate(r.published_at)}</time></p>
                      <h3 className="post-title"><a href={`/blog/${r.slug}`}>{r.title}</a></h3>
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </main>
      </StoreShell>
    </>
  );
}
