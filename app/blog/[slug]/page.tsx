import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { ArrowRight, ChevronRight, MessageCircle } from 'lucide-react';
import { getData } from '@/lib/data';
import { getPosts, fmtDate, readingTime } from '@/lib/blog';
import { waLink } from '@/lib/wa';
import { siteUrl } from '@/lib/site';
import { SiteFooter, SiteHeader } from '@/components/site-chrome';

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const post = (await getPosts()).find(p => p.slug === slug);
  if (!post) return { title: 'Artikel tidak ditemukan', robots: { index: false } };
  const title = post.meta_title || post.title;
  const description = (post.meta_description || post.excerpt).slice(0, 160);
  return {
    title: { absolute: title }, description, alternates: { canonical: `/blog/${post.slug}` },
    openGraph: { type: 'article', title, description, url: `/blog/${post.slug}`, publishedTime: post.published_at ?? undefined, modifiedTime: post.updated_at, authors: [post.author], images: post.cover_image_url ? [{ url: post.cover_image_url, alt: post.title }] : undefined },
    twitter: { card: 'summary_large_image' },
  };
}

export default async function BlogPost({ params }: Props) {
  const { slug } = await params;
  const [{ settings }, posts] = await Promise.all([getData(), getPosts()]);
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
      <SiteHeader settings={settings} />
      <main className="container pdp">
        <nav className="crumbs" aria-label="Breadcrumb"><a href="/">Beranda</a><ChevronRight size={14} /><a href="/blog">Blog</a><ChevronRight size={14} /><span aria-current="page">{post.title}</span></nav>
        <article className="article">
          <header>
            {post.category && <span className="kicker">{post.category}</span>}
            <h1 className="cathead">{post.title}</h1>
            <p className="postmeta">{post.author} · <time dateTime={post.published_at ?? undefined}>{fmtDate(post.published_at)}</time> · {readingTime(post.content)} menit baca</p>
          </header>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          {post.cover_image_url && <img className="articlecover" src={post.cover_image_url} alt={post.title} width={1200} height={630} fetchPriority="high" />}
          <div className="prose"><ReactMarkdown remarkPlugins={[remarkGfm]} components={{ img: ({ src, alt }) => /* eslint-disable-next-line @next/next/no-img-element */ <img src={typeof src === 'string' ? src : undefined} alt={alt ?? ''} loading="lazy" />, a: ({ href, children }) => <a href={href} {...(href?.startsWith('http') ? { target: '_blank', rel: 'noopener noreferrer' } : {})}>{children}</a> }}>{post.content}</ReactMarkdown></div>
          <aside className="articlecta"><div><b>Butuh goodie bag untuk bisnis atau event kamu?</b><span>Konsultasikan bahan, ukuran, dan custom branding bersama tim kami.</span></div><a className="primary" href={waLink(settings)} target="_blank" rel="noopener noreferrer">Chat WhatsApp <MessageCircle size={18} /></a></aside>
        </article>
        {more.length > 0 && (
          <section className="related" aria-labelledby="more-title"><h2 id="more-title">Artikel lainnya</h2>
            <div className="productgrid">{more.map(r => (
              <article className="card" key={r.id}>{r.cover_image_url && <div className="cardimg">{/* eslint-disable-next-line @next/next/no-img-element */}<img src={r.cover_image_url} alt={r.title} width={600} height={510} loading="lazy" /></div>}
                <div className="cardbody"><h3><a href={`/blog/${r.slug}`}>{r.title}</a></h3><div className="cardfoot"><a className="cardbtn" href={`/blog/${r.slug}`}>Baca <ArrowRight size={15} /></a></div></div></article>))}
            </div>
          </section>
        )}
      </main>
      <SiteFooter settings={settings} />
    </>
  );
}
