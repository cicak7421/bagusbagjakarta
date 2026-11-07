import Storefront from '@/components/storefront';
import type { Metadata } from 'next';
import { siteUrl } from '@/lib/site';

import { getData } from '@/lib/data';
import { safeUrl } from '@/lib/safe';
import { productSoldOut } from '@/lib/variants';
import { fillTokens } from '@/lib/sections';
export async function generateMetadata(): Promise<Metadata> {
  const { settings } = await getData();
  return { description: `${settings.hero_subtitle} Supplier goodie bag spunbond, paperbag, coolerbag untuk reseller, event, dan corporate.`.slice(0, 160), openGraph: { images: safeUrl(settings.hero_image_url) ? [{ url: safeUrl(settings.hero_image_url) }] : undefined } };
}
export default async function Home() {
  const { settings, products, sections } = await getData();
  // FAQ untuk Google mengikuti isi FAQ yang diedit di admin
  const faq = sections.faq.enabled ? sections.faq.items.filter(f => f.a).map(f => [f.q, fillTokens(f.a, settings)] as const) : [];
  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      { '@type': 'Organization', '@id': `${siteUrl}/#org`, name: settings.company_name, url: siteUrl, description: settings.about, address: { '@type': 'PostalAddress', streetAddress: settings.address, addressCountry: 'ID' }, contactPoint: { '@type': 'ContactPoint', contactType: 'sales', telephone: `+${settings.whatsapp_number.replace(/\D/g, '')}`, availableLanguage: 'id' } },
      { '@type': 'WebSite', '@id': `${siteUrl}/#site`, url: siteUrl, name: settings.company_name, inLanguage: 'id-ID' },
      { '@type': 'ItemList', name: 'Katalog goodie bag', itemListElement: products.map((p, i) => ({ '@type': 'ListItem', position: i + 1, item: { '@type': 'Product', name: p.name, description: p.description, category: p.category, image: safeUrl(p.image_url) || undefined, brand: { '@type': 'Brand', name: settings.company_name }, offers: { '@type': 'Offer', priceCurrency: 'IDR', price: p.price, availability: productSoldOut(p) ? 'https://schema.org/OutOfStock' : 'https://schema.org/InStock', url: `${siteUrl}/produk/${p.slug}`, eligibleQuantity: { '@type': 'QuantitativeValue', minValue: p.min_order } } } })) },
      ...(faq.length ? [{ '@type': 'FAQPage', mainEntity: faq.map(([q, a]) => ({ '@type': 'Question', name: q, acceptedAnswer: { '@type': 'Answer', text: a } })) }] : []),
    ],
  };
  return (<>
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c') }} />
    <Storefront settings={settings} products={products} sections={sections} />
  </>);
}
