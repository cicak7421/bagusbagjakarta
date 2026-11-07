/**
 * Helper keamanan kecil yang dipakai di storefront & admin.
 * Semua data dari database/admin dianggap "tidak tepercaya" sebelum dirender.
 */

/** Hanya izinkan http(s). Mencegah `javascript:` / `data:` masuk ke href/src. */
export function safeUrl(input: unknown, fallback = ''): string {
  if (typeof input !== 'string') return fallback;
  const v = input.trim();
  if (!v) return fallback;
  if (v.startsWith('/') && !v.startsWith('//')) return v; // path internal
  try {
    const u = new URL(v);
    return u.protocol === 'https:' || u.protocol === 'http:' ? u.toString() : fallback;
  } catch {
    return fallback;
  }
}

/** Hex warna #rgb / #rrggbb saja, selain itu dibuang. */
export function safeHex(input: unknown): string | undefined {
  return typeof input === 'string' && /^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(input.trim()) ? input.trim() : undefined;
}

export const slugify = (s: string) =>
  s.toLowerCase().normalize('NFKD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');

/** Ubah angka dari input jadi integer >= min (NaN / negatif aman). */
export const toInt = (v: unknown, min = 0) => {
  const n = Math.floor(Number(v));
  return Number.isFinite(n) ? Math.max(min, n) : min;
};

/** Ekstensi file dari MIME type (bukan dari nama file yang bisa dipalsukan). */
export const IMAGE_EXT: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/gif': 'gif',
  'image/avif': 'avif',
};
export const MAX_UPLOAD_BYTES = 5 * 1024 * 1024;
