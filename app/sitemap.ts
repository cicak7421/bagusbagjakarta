import type { MetadataRoute } from 'next';
import { siteUrl } from '@/lib/site';
import { getData } from '@/lib/data';
import { getPosts } from '@/lib/blog';
import { categories } from '@/lib/categories';
import { safeUrl } from '@/lib/safe';

export const revalidate = 300;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [{ products, settings }, posts] = await Promise.all([getData(), getPosts()]);
  const date = (v?: string | null) => { const d = v ? new Date(v) : null; return d && !Number.isNaN(d.getTime()) ? d : undefined; };
  // Tanggal ubah yang jujur (dari database), bukan "hari ini" tiap kali Google datang
  const newest = (list: (string | undefined | null)[]) => list.map(date).filter((d): d is Date => !!d).sort((a, b) => b.getTime() - a.getTime())[0];
  const catalogDate = newest([settings.updated_at, ...products.map(p => p.updated_at)]);
  return [
    { url: siteUrl, lastModified: catalogDate, changeFrequency: 'weekly', priority: 1 },
    { url: `${siteUrl}/produk`, lastModified: catalogDate, changeFrequency: 'weekly', priority: 0.9 },
    ...Object.entries(categories).map(([slug, c]) => ({
      url: `${siteUrl}/kategori/${slug}`, lastModified: newest(products.filter(p => p.category === c.name).map(p => p.updated_at)) ?? catalogDate, changeFrequency: 'weekly' as const, priority: 0.9,
    })),
    ...products.map(p => ({
      url: `${siteUrl}/produk/${p.slug}`, lastModified: date(p.updated_at), changeFrequency: 'weekly' as const, priority: 0.8,
      ...(safeUrl(p.image_url) ? { images: [safeUrl(p.image_url)] } : {}),
    })),
    { url: `${siteUrl}/blog`, lastModified: newest(posts.map(p => p.updated_at || p.published_at)), changeFrequency: 'weekly', priority: 0.7 },
    ...posts.map(p => ({ url: `${siteUrl}/blog/${p.slug}`, lastModified: date(p.updated_at || p.published_at), changeFrequency: 'monthly' as const, priority: 0.6 })),
    { url: `${siteUrl}/tentang-kami`, changeFrequency: 'monthly', priority: 0.5 },
    { url: `${siteUrl}/syarat-ketentuan`, changeFrequency: 'yearly', priority: 0.3 },
    { url: `${siteUrl}/kebijakan-privasi`, changeFrequency: 'yearly', priority: 0.3 },
    { url: `${siteUrl}/kebijakan-pengembalian`, changeFrequency: 'yearly', priority: 0.3 },
  ];
}
