import { ChevronRight, MessageCircle } from 'lucide-react';
import { getData } from '@/lib/data';
import { StoreShell, catalogMoq } from '@/components/site-chrome';
import { waLink } from '@/lib/wa';
import { siteUrl } from '@/lib/site';
import { jsonLdScript } from '@/lib/seo';
import type { SiteSettings } from '@/lib/types';

/** Kerangka halaman informasi (tentang kami, syarat, privasi, pengembalian). */
export default async function InfoPage({ title, path, updated, children }: {
  title: string; path: string; updated?: string; children: (s: SiteSettings) => React.ReactNode;
}) {
  const { settings, products, checkoutEnabled } = await getData();
  const jsonLd = {
    '@context': 'https://schema.org', '@type': 'BreadcrumbList',
    itemListElement: [{ '@type': 'ListItem', position: 1, name: 'Beranda', item: siteUrl }, { '@type': 'ListItem', position: 2, name: title, item: `${siteUrl}${path}` }],
  };
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={jsonLdScript(jsonLd)} />
      <StoreShell settings={settings} checkout={checkoutEnabled} active={path} moq={catalogMoq(products)}>
        <main id="konten" className="container container--text docpage">
          <nav className="crumbs" aria-label="Breadcrumb"><a href="/">Beranda</a><ChevronRight size={14} aria-hidden="true" /><span aria-current="page">{title}</span></nav>
          <article className="article">
            <header className="article-head">
              <h1>{title}</h1>
              {updated && <p className="postmeta"><span>Terakhir diperbarui: {updated}</span></p>}
            </header>
            <div className="prose">{children(settings)}</div>
            <aside className="panel-soft articlecta" aria-label="Bantuan">
              <div><b>Ada pertanyaan?</b><span>Tim {settings.company_name} siap membantu lewat WhatsApp.</span></div>
              <a className="btn btn-wa-outline" href={waLink(settings)} target="_blank" rel="noopener noreferrer"><MessageCircle size={18} aria-hidden="true" /> Chat WhatsApp</a>
            </aside>
          </article>
        </main>
      </StoreShell>
    </>
  );
}
