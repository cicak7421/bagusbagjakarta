import type { MetadataRoute } from 'next';
import { siteUrl } from '@/lib/site';
import { getData } from '@/lib/data';
import { getPosts } from '@/lib/blog';
import { categories } from '@/lib/categories';
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [{ products }, posts] = await Promise.all([getData(), getPosts()]);
  return [
    { url: siteUrl, lastModified: new Date(), changeFrequency: 'weekly', priority: 1 },
    ...Object.keys(categories).map(c => ({ url: `${siteUrl}/kategori/${c}`, lastModified: new Date(), changeFrequency: 'weekly' as const, priority: 0.9 })),
    { url: `${siteUrl}/blog`, lastModified: new Date(), changeFrequency: 'weekly' as const, priority: 0.7 },
    ...posts.map(p => ({ url: `${siteUrl}/blog/${p.slug}`, lastModified: new Date(p.updated_at || p.published_at || Date.now()), changeFrequency: 'monthly' as const, priority: 0.6 })),
    ...products.map(p => ({ url: `${siteUrl}/produk/${p.slug}`, lastModified: new Date(), changeFrequency: 'weekly' as const, priority: 0.8 })),
  ];
}
