import type { CSSProperties } from 'react';
import type { PatternKey, Product, VariantOption } from '@/lib/types';
import { safeHex, safeUrl, toInt } from '@/lib/safe';

export const PATTERNS: { key: PatternKey; label: string }[] = [
  { key: 'polos', label: 'Polos' },
  { key: 'garis', label: 'Garis' },
  { key: 'polkadot', label: 'Polkadot' },
  { key: 'kotak', label: 'Kotak' },
  { key: 'zigzag', label: 'Zigzag' },
  { key: 'diagonal', label: 'Diagonal' },
];
const PATTERN_KEYS = new Set<string>(PATTERNS.map(p => p.key));

/** Bersihkan data varian dari DB (kolom jsonb bebas isi) jadi bentuk yang aman. */
export function normalizeOptions(raw: unknown, max = 24): VariantOption[] {
  if (!Array.isArray(raw)) return [];
  const out: VariantOption[] = [];
  for (const r of raw.slice(0, max)) {
    if (!r || typeof r !== 'object') continue;
    const o = r as Record<string, unknown>;
    const name = typeof o.name === 'string' ? o.name.trim().slice(0, 40) : '';
    if (!name) continue;
    const stock = o.stock_qty === null || o.stock_qty === undefined || o.stock_qty === '' ? null : toInt(o.stock_qty);
    out.push({
      name,
      hex: safeHex(o.hex),
      pattern: typeof o.pattern === 'string' && PATTERN_KEYS.has(o.pattern) ? (o.pattern as PatternKey) : undefined,
      image_url: safeUrl(o.image_url) || undefined,
      stock_qty: stock,
      price_add: toInt(o.price_add),
      price: o.price === null || o.price === undefined || o.price === '' ? null : toInt(o.price) || null,
    });
  }
  return out;
}

/** Ukuran: harga per ukuran = harga penuh (bukan tambahan). Data lama yang memakai price_add dianggap harga penuh. */
export function normalizeSizes(raw: unknown): VariantOption[] {
  return normalizeOptions(raw).map(o => ({ ...o, price: o.price ?? (o.price_add || null), price_add: 0 }));
}

export function normalizeProduct(p: Record<string, unknown>): Product {
  return {
    ...(p as unknown as Product),
    price: Number(p.price) || 0,
    min_order: toInt(p.min_order, 1),
    stock_qty: toInt(p.stock_qty),
    colors: normalizeOptions(p.colors),
    motifs: normalizeOptions(p.motifs),
    sizes: normalizeSizes(p.sizes),
  };
}

/**
 * Stok efektif: stok ukuran (kalau diisi) menggantikan stok produk; warna & motif membatasi lagi (ambil yang terkecil).
 */
export function effectiveStock(p: Product, color?: VariantOption | null, motif?: VariantOption | null, size?: VariantOption | null) {
  const base = typeof size?.stock_qty === 'number' ? size.stock_qty : p.stock_qty;
  const caps = [color?.stock_qty, motif?.stock_qty].filter((n): n is number => typeof n === 'number');
  return caps.length ? Math.min(base, ...caps) : base;
}

/** Harga per pcs: harga ukuran (kalau diisi) atau harga produk, ditambah tambahan warna & motif. */
export const unitPrice = (p: Product, color?: VariantOption | null, motif?: VariantOption | null, size?: VariantOption | null) =>
  (size?.price || p.price) + (color?.price_add || 0) + (motif?.price_add || 0);

/** Harga terendah yang tersedia (untuk "mulai dari" di katalog). */
export const startingPrice = (p: Product) => {
  const prices = (p.sizes ?? []).map(s => s.price || p.price).filter(n => n > 0);
  return prices.length ? Math.min(...prices) : p.price;
};

/** Produk dianggap habis jika semua ukuran habis, atau stok produk 0 (tanpa ukuran), atau SEMUA pilihan di satu grup habis. */
export function productSoldOut(p: Product) {
  const sizes = p.sizes ?? [];
  if (sizes.length ? sizes.every(s => (s.stock_qty ?? p.stock_qty) <= 0) : p.stock_qty <= 0) return true;
  const allOut = (list: VariantOption[]) => list.length > 0 && list.every(o => o.stock_qty === 0);
  return allOut(p.colors) || allOut(p.motifs);
}

/** Style swatch (warna / pola CSS). Nilai hex sudah tervalidasi di normalizeOptions. */
export function swatchStyle(o: VariantOption): CSSProperties {
  const c = o.hex || '#d9d9de';
  const line = 'rgba(0,0,0,.28)';
  switch (o.pattern) {
    case 'garis': return { backgroundColor: '#fff', backgroundImage: `repeating-linear-gradient(90deg, ${c} 0 6px, transparent 6px 12px)` };
    case 'diagonal': return { backgroundColor: '#fff', backgroundImage: `repeating-linear-gradient(45deg, ${c} 0 5px, transparent 5px 10px)` };
    case 'polkadot': return { backgroundColor: '#fff', backgroundImage: `radial-gradient(${c} 28%, transparent 30%)`, backgroundSize: '12px 12px' };
    case 'kotak': return { backgroundColor: '#fff', backgroundImage: `linear-gradient(${c} 50%, transparent 50%), linear-gradient(90deg, ${c} 50%, transparent 50%)`, backgroundSize: '14px 14px', backgroundBlendMode: 'multiply' };
    case 'zigzag': return { backgroundColor: c, backgroundImage: `linear-gradient(135deg, #fff 25%, transparent 25%), linear-gradient(225deg, #fff 25%, transparent 25%)`, backgroundSize: '12px 12px' };
    case 'polos': return { backgroundColor: c, boxShadow: `inset 0 0 0 1px ${line}` };
    default: return { backgroundColor: c };
  }
}

/** Warna teks kontras (untuk centang di atas swatch). */
export function isLight(hex?: string) {
  const h = safeHex(hex);
  if (!h) return true;
  const v = h.length === 4 ? h.slice(1).split('').map(x => x + x).join('') : h.slice(1);
  const [r, g, b] = [0, 2, 4].map(i => parseInt(v.slice(i, i + 2), 16));
  return (r * 299 + g * 587 + b * 114) / 1000 > 150;
}
