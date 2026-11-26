import type { Product } from '@/lib/types';
import { productSoldOut, startingPrice } from '@/lib/variants';
import { safeUrl } from '@/lib/safe';

/** Data ringkas satu produk untuk kartu katalog (ringan dikirim ke browser). */
export type CardProduct = {
  id: string;
  sku: string;
  name: string;
  slug: string;
  category: Product['category'];
  image: string;
  image2: string;
  price: number;
  from: boolean;
  sizes: number;
  size: string;
  stock: number;
  soldOut: boolean;
  moq: number;
  theme: string;
  order: number;
};

/** Tema motif, ditebak dari nama produk. Urutan menentukan prioritas kalau cocok lebih dari satu. */
export const THEMES: { key: string; label: string; match: RegExp }[] = [
  { key: 'polos', label: 'Polos', match: /\b(polos|gradasi|metalik)\b/i },
  { key: 'bunga', label: 'Bunga', match: /\b(floral|flower|bunga|mawar|lily|tulip|flamingo|forest|fuji|lukisan)\b/i },
  { key: 'batik', label: 'Batik & Etnik', match: /\b(batik|etnik|mandala|geometri|houndstooth|monogram|leopard|kotak|garis|classic)\b/i },
  { key: 'karakter', label: 'Karakter & Lucu', match: /\b(karakter|bear|beruang|unicorn|dino|capy|capybara|girl|kelinci|animal|smile|cherry|happy everyday|satchel|love|beach)\b/i },
  { key: 'ulangtahun', label: 'Ulang Tahun', match: /\b(birthday|hologram)\b/i },
  { key: 'musiman', label: 'Natal, Imlek, Lebaran', match: /\b(christmas|imlek|idul fitri|kucing hoki)\b/i },
  { key: 'marble', label: 'Marble & Premium', match: /\b(marble|tide|rich|nice|pita|kraft)\b/i },
];
export const themeOf = (name: string) => THEMES.find(t => t.match.test(name))?.key ?? 'lainnya';

export function toCard(p: Product): CardProduct {
  const sizes = p.sizes ?? [];
  const prices = sizes.map(s => s.price || p.price).filter(n => n > 0);
  const extra = (p.images ?? []).map(u => safeUrl(u)).filter(Boolean);
  return {
    id: p.id, sku: p.sku ?? '', name: p.name, slug: p.slug, category: p.category,
    image: safeUrl(p.image_url), image2: extra[0] ?? '',
    price: startingPrice(p), from: prices.length > 1 && Math.min(...prices) < Math.max(...prices),
    sizes: sizes.length, size: p.size,
    stock: sizes.length ? Math.max(...sizes.map(s => s.stock_qty ?? p.stock_qty)) : p.stock_qty,
    soldOut: productSoldOut(p), moq: p.min_order, theme: themeOf(p.name), order: p.sort_order,
  };
}

/** Produk tanpa harga = "tanya harga": tidak bisa checkout, diarahkan ke WhatsApp. */
export const isInquiry = (p: { price: number }) => !(p.price > 0);
