import { siteUrl } from '@/lib/site';
import type { SiteSettings } from '@/lib/types';
import { safeUrl } from '@/lib/safe';

/** Potong teks di batas kata (maks ~158 karakter) untuk meta description. */
export function clip(text: string, max = 158) {
  const t = text.replace(/\s+/g, ' ').trim();
  if (t.length <= max) return t;
  const cut = t.slice(0, max - 1);
  return `${cut.slice(0, Math.max(cut.lastIndexOf(' '), max - 30)).replace(/[\s,.;:–—-]+$/, '')}…`;
}

/** JSON-LD aman disisipkan ke <script> (karakter "<" di-escape). */
export const jsonLdScript = (data: unknown) => ({ __html: JSON.stringify(data).replace(/</g, '\\u003c') });

/** Identitas perusahaan untuk Google (dipakai di beranda & halaman tentang kami). */
export function organizationLd(s: SiteSettings) {
  const phone = s.whatsapp_number.replace(/\D/g, '');
  return {
    '@type': ['Organization', 'Store'],
    '@id': `${siteUrl}/#org`,
    name: s.company_name.replace(/^PT\s+/i, ''),
    legalName: s.company_name,
    url: siteUrl,
    logo: `${siteUrl}/icon.svg`,
    ...(safeUrl(s.hero_image_url) ? { image: safeUrl(s.hero_image_url) } : {}),
    description: s.about,
    ...(phone ? { telephone: `+${phone}` } : {}),
    address: { '@type': 'PostalAddress', streetAddress: s.address, addressCountry: 'ID' },
    ...(safeUrl(s.google_maps_url) ? { hasMap: safeUrl(s.google_maps_url) } : {}),
    areaServed: { '@type': 'Country', name: 'Indonesia' },
    currenciesAccepted: 'IDR',
    contactPoint: { '@type': 'ContactPoint', contactType: 'sales', ...(phone ? { telephone: `+${phone}` } : {}), availableLanguage: ['id'], areaServed: 'ID' },
  };
}
