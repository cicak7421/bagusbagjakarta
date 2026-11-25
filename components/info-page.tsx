import { ChevronRight, MessageCircle } from 'lucide-react';
import { getData } from '@/lib/data';
import { SiteFooter, SiteHeader } from '@/components/site-chrome';
import { waLink } from '@/lib/wa';
import { siteUrl } from '@/lib/site';
import { jsonLdScript } from '@/lib/seo';
import type { SiteSettings } from '@/lib/types';

/** Kerangka halaman informasi (tentang kami, syarat, privasi, pengembalian). */
export default async function InfoPage({ title, path, updated, children }: {
  title: string; path: string; updated?: string; children: (s: SiteSettings) => React.ReactNode;
}) {
  const { settings, checkoutEnabled } = await getData();
  const jsonLd = {
    '@context': 'https://schema.org', '@type': 'BreadcrumbList',
    itemListElement: [{ '@type': 'ListItem', position: 1, name: 'Beranda', item: siteUrl }, { '@type': 'ListItem', position: 2, name: title, item: `${siteUrl}${path}` }],
  };
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={jsonLdScript(jsonLd)} />
      <SiteHeader settings={settings} checkout={checkoutEnabled} />
      <main className="container pdp">
        <nav className="crumbs" aria-label="Breadcrumb"><a href="/">Beranda</a><ChevronRight size={14} /><span aria-current="page">{title}</span></nav>
        <article className="article">
          <header><h1 className="cathead">{title}</h1>{updated && <p className="postmeta">Terakhir diperbarui: {updated}</p>}</header>
          <div className="prose">{children(settings)}</div>
          <aside className="articlecta"><div><b>Ada pertanyaan?</b><span>Tim {settings.company_name} siap membantu lewat WhatsApp.</span></div><a className="primary" href={waLink(settings)} target="_blank" rel="noopener noreferrer">Chat WhatsApp <MessageCircle size={18} /></a></aside>
        </article>
      </main>
      <SiteFooter settings={settings} checkout={checkoutEnabled} />
    </>
  );
}
