/**
 * Helper gambar.
 *
 * 1) Foto katalog SKU (folder storage `media/sku/`) sudah disiapkan dalam dua ukuran WebP:
 *    `sku/<nama>.webp` (maks 1000px) dan `sku/t/<nama>.webp` (thumbnail 480px).
 *    Keduanya dilayani langsung dari CDN storage: cepat, di-cache setahun, dan tidak memakai
 *    kuota Image Optimization Vercel.
 * 2) Gambar remote lain (upload admin, Unsplash, Imgur) dilewatkan ke Next Image Optimizer
 *    supaya dikirim sebagai AVIF/WebP sesuai ukuran layar. Host harus ada di `images.remotePatterns`.
 */
const HOSTS = new Set<string>(['images.unsplash.com', 'i.imgur.com']);
try {
  if (process.env.NEXT_PUBLIC_SUPABASE_URL) HOSTS.add(new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).hostname);
} catch { /* env tidak valid → abaikan */ }

// Harus termasuk ukuran bawaan Next (imageSizes + deviceSizes)
const ALLOWED = [256, 384, 640, 750, 828, 1080, 1200, 1920];

const SKU_RE = /\/storage\/v1\/object\/public\/media\/sku\/([a-z0-9]+-\d\.webp)$/;
const THUMB_W = 480;
const FULL_W = 1000;
const skuThumb = (url: string) => url.replace('/media/sku/', '/media/sku/t/');

function canOptimize(url: string) {
  if (!/^https:\/\//.test(url) || /\.(svg|gif)(\?|$)/i.test(url)) return false;
  try { return HOSTS.has(new URL(url).hostname); } catch { return false; }
}

export function optimizedSrc(url: string, w: number) {
  if (SKU_RE.test(url)) return w <= THUMB_W ? skuThumb(url) : url;
  if (!canOptimize(url)) return url;
  const width = ALLOWED.find(x => x >= w) ?? ALLOWED[ALLOWED.length - 1];
  return `/_next/image?url=${encodeURIComponent(url)}&w=${width}&q=75`;
}

export function imgSrcSet(url: string, widths: number[]) {
  if (SKU_RE.test(url)) return `${skuThumb(url)} ${THUMB_W}w, ${url} ${FULL_W}w`;
  if (!canOptimize(url)) return undefined;
  return widths.map(w => `${optimizedSrc(url, w)} ${w}w`).join(', ');
}

/** Atribut src + srcSet + sizes siap sebar ke <img>. */
export function responsiveImg(url: string, widths: number[], sizes: string) {
  const srcSet = imgSrcSet(url, widths);
  if (!srcSet) return { src: url };
  return { src: optimizedSrc(url, SKU_RE.test(url) ? THUMB_W : widths[Math.floor(widths.length / 2)]), srcSet, sizes };
}
