import Storefront from '@/components/storefront';
import type { Metadata } from 'next';
import { siteUrl } from '@/lib/site';
import { getData } from '@/lib/data';
import { safeUrl } from '@/lib/safe';
import { fillTokens } from '@/lib/sections';
import { clip, jsonLdScript, organizationLd } from '@/lib/seo';

export const revalidate = 300;

export async function generateMetadata(): Promise<Metadata> {
  const { settings } = await getData();
  const hero = safeUrl(settings.hero_image_url);
  return {
    description: clip(`Supplier goodie bag spunbond, paperbag, dan coolerbag untuk reseller, event, dan corporate. ${settings.hero_subtitle}`),
    alternates: { canonical: '/' },
    openGraph: { url: '/', images: hero ? [{ url: hero, alt: `Goodie bag ${settings.company_name}` }] : undefined },
  };
}

export default async function Home() {
  const { settings, products, sections, checkoutEnabled } = await getData();
  // FAQ untuk Google mengikuti isi FAQ yang diedit di admin
  const faq = sections.faq.enabled ? sections.faq.items.filter(f => f.a).map(f => [f.q, fillTokens(f.a, settings)] as const) : [];
  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      organizationLd(settings),
      { '@type': 'WebSite', '@id': `${siteUrl}/#site`, url: siteUrl, name: settings.company_name.replace(/^PT\s+/i, ''), alternateName: settings.company_name, inLanguage: 'id-ID', publisher: { '@id': `${siteUrl}/#org` } },
      {
        '@type': 'ItemList', name: 'Katalog goodie bag',
        itemListElement: products.map((p, i) => ({
          '@type': 'ListItem', position: i + 1, url: `${siteUrl}/produk/${p.slug}`, name: p.name,
          ...(safeUrl(p.image_url) ? { image: safeUrl(p.image_url) } : {}),
        })),
      },
      ...(faq.length ? [{ '@type': 'FAQPage', mainEntity: faq.map(([q, a]) => ({ '@type': 'Question', name: q, acceptedAnswer: { '@type': 'Answer', text: a } })) }] : []),
    ],
  };
  return (<>
    <script type="application/ld+json" dangerouslySetInnerHTML={jsonLdScript(jsonLd)} />
    <Storefront settings={settings} products={products} sections={sections} checkout={checkoutEnabled} />
  </>);
}
