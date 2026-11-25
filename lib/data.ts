import { cache } from 'react';
import { createPublicClient } from '@/lib/supabase/public';
import type { Product, SiteSettings, VariantOption } from '@/lib/types';
import { normalizeProduct } from '@/lib/variants';
import { demoSettings } from '@/lib/demo-settings';
import { normalizeSections } from '@/lib/sections';

export { demoSettings };

/** Halaman publik di-cache lalu diperbarui otomatis tiap N detik (dan langsung saat admin menyimpan). */
export const REVALIDATE_SECONDS = 300;

const c = (name: string, hex: string, extra: Partial<VariantOption> = {}): VariantOption => ({ name, hex, ...extra });
const m = (name: string, pattern: VariantOption['pattern'], hex: string, extra: Partial<VariantOption> = {}): VariantOption => ({ name, pattern, hex, ...extra });

const demoProducts: Product[] = [
  {
    id: '1', name: 'Spunbond Basic', slug: 'spunbond-basic', category: 'Spunbond',
    description: 'Ringan, ekonomis, cocok untuk event, promosi, dan reseller.', size: '25 × 35 cm', price: 6500, min_order: 100, stock_qty: 1200,
    image_url: 'https://images.unsplash.com/photo-1601593346740-925612772716?auto=format&fit=crop&w=900&q=80',
    is_customizable: true, is_active: true, sort_order: 1,
    colors: [c('Hitam', '#2b2b2f'), c('Putih', '#f4f4f2'), c('Merah', '#c8321f', { stock_qty: 240 }), c('Biru Navy', '#1f3a73'), c('Hijau Sage', '#8fa886', { stock_qty: 0 })],
    motifs: [],
    sizes: [{ name: '25 × 35 cm' }, { name: '30 × 40 cm', price_add: 1500 }, { name: '35 × 45 cm', price_add: 3000 }],
  },
  {
    id: '2', name: 'Paperbag Premium', slug: 'paperbag-premium', category: 'Paperbag',
    description: 'Tampilan premium dengan area cetak yang luas untuk branding.', size: '24 × 10 × 32 cm', price: 12500, min_order: 100, stock_qty: 680,
    image_url: 'https://images.unsplash.com/photo-1605733513597-a8f8341084e6?auto=format&fit=crop&w=900&q=80',
    is_customizable: true, is_active: true, sort_order: 2,
    colors: [c('Kraft', '#b88a5a'), c('Putih', '#f7f7f5'), c('Hitam', '#222226')],
    motifs: [m('Polos', 'polos', '#d8c7ae'), m('Garis', 'garis', '#2f4a8a'), m('Polkadot', 'polkadot', '#c8321f', { price_add: 500 }), m('Kotak', 'kotak', '#2b2b2f', { price_add: 500 })],
    sizes: [],
  },
  {
    id: '3', name: 'Coolerbag Daily', slug: 'coolerbag-daily', category: 'Coolerbag',
    description: 'Bag insulated untuk makanan, minuman, hampers, dan corporate gift.', size: '22 × 15 × 18 cm', price: 28500, min_order: 50, stock_qty: 320,
    image_url: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=900&q=80',
    is_customizable: true, is_active: true, sort_order: 3,
    colors: [c('Silver', '#c9ccd1'), c('Hitam', '#2b2b2f'), c('Biru', '#4f7bd1')],
    motifs: [m('Polos', 'polos', '#d9d9de'), m('Diagonal', 'diagonal', '#1f3a73', { price_add: 1000 })],
    sizes: [],
  },
];

/**
 * Data publik untuk storefront. Dibungkus cache() supaya generateMetadata + halaman
 * cukup satu kali query per render. Tidak memakai cookies → halaman bisa statis/ISR.
 * `live` = false artinya database tidak terjangkau dan yang tampil adalah data demo
 * (checkout otomatis dimatikan supaya tidak ada pesanan untuk produk demo).
 */
export const getData = cache(async () => {
  let settings: SiteSettings = demoSettings;
  let products = demoProducts;
  let live = false;
  try {
    const supabase = createPublicClient();
    if (supabase) {
      const [s, p] = await Promise.all([
        supabase.from('site_settings').select('*').limit(1).maybeSingle(),
        supabase.from('products').select('*').eq('is_active', true).order('sort_order'),
      ]);
      if (s.data) settings = { ...demoSettings, ...s.data };
      if (p.data?.length) { products = p.data.map(row => normalizeProduct(row as Record<string, unknown>)); live = true; }
    }
  } catch {
    /* Supabase belum di-setup / sedang gangguan → tampilkan data demo */
  }
  const sections = normalizeSections(settings.page_sections);
  // Checkout online aktif hanya kalau database pesanan sudah dipasang (kolom checkout_enabled dari supabase/orders.sql)
  const checkoutEnabled = live && settings.checkout_enabled === true;
  return { settings, products, sections, checkoutEnabled };
});
