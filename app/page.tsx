import Storefront from '@/components/storefront';
import type { Metadata } from 'next';
import { siteUrl } from '@/lib/site';

import { getData } from '@/lib/data';
export async function generateMetadata(): Promise<Metadata> {
  const { settings } = await getData();
  return { description: `${settings.hero_subtitle} Supplier goodie bag spunbond, paperbag, coolerbag untuk reseller, event, dan corporate.`.slice(0, 160), openGraph: { images: settings.hero_image_url ? [{ url: settings.hero_image_url }] : undefined } };
}
export default async function Home() {
  const { settings, products } = await getData();
  const faq = [
    ['Berapa minimal order goodie bag?', 'Minimal order (MOQ) berbeda tiap produk dan tertera di katalog, mulai dari 50 pcs.'],
    ['Apakah goodie bag bisa dicustom dengan logo dan motif?', 'Bisa. Spunbond, paperbag, dan coolerbag dapat disesuaikan ukuran, motif, dan logo brand.'],
    ['Bagaimana cara memesan?', 'Pilih produk, klik tombol WhatsApp, lalu tim kami membantu cek stok, harga, dan detail custom.'],
  ];
  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      { '@type': 'Organization', '@id': `${siteUrl}/#org`, name: settings.company_name, url: siteUrl, description: settings.about, address: { '@type': 'PostalAddress', streetAddress: settings.address, addressCountry: 'ID' }, contactPoint: { '@type': 'ContactPoint', contactType: 'sales', telephone: `+${settings.whatsapp_number.replace(/\D/g, '')}`, availableLanguage: 'id' } },
      { '@type': 'WebSite', '@id': `${siteUrl}/#site`, url: siteUrl, name: settings.company_name, inLanguage: 'id-ID' },
      { '@type': 'ItemList', name: 'Katalog goodie bag', itemListElement: products.map((p, i) => ({ '@type': 'ListItem', position: i + 1, item: { '@type': 'Product', name: p.name, description: p.description, category: p.category, image: p.image_url, brand: { '@type': 'Brand', name: settings.company_name }, offers: { '@type': 'Offer', priceCurrency: 'IDR', price: p.price, availability: p.stock_qty > 0 ? 'https://schema.org/InStock' : 'https://schema.org/PreOrder', url: `${siteUrl}/produk/${p.slug}`, eligibleQuantity: { '@type': 'QuantitativeValue', minValue: p.min_order } } } })) },
      { '@type': 'FAQPage', mainEntity: faq.map(([q, a]) => ({ '@type': 'Question', name: q, acceptedAnswer: { '@type': 'Answer', text: a } })) },
    ],
  };
  return (<>
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c') }} />
    <Storefront settings={settings} products={products} />
  </>);
}
