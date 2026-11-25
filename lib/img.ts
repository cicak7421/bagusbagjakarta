/**
 * Helper gambar: lewatkan gambar remote (Supabase / Unsplash) lewat Next Image Optimizer
 * supaya dikirim sebagai AVIF/WebP dengan ukuran sesuai layar, bukan file asli yang besar.
 * Host harus sama dengan `images.remotePatterns` di next.config.mjs.
 */
const HOSTS = new Set<string>(['images.unsplash.com', 'i.imgur.com']);
try {
  if (process.env.NEXT_PUBLIC_SUPABASE_URL) HOSTS.add(new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).hostname);
} catch { /* env tidak valid → abaikan */ }

// Harus termasuk ukuran bawaan Next (imageSizes + deviceSizes)
const ALLOWED = [256, 384, 640, 750, 828, 1080, 1200, 1920];

function canOptimize(url: string) {
  if (!/^https:\/\//.test(url) || /\.(svg|gif)(\?|$)/i.test(url)) return false;
  try { return HOSTS.has(new URL(url).hostname); } catch { return false; }
}

export function optimizedSrc(url: string, w: number) {
  if (!canOptimize(url)) return url;
  const width = ALLOWED.find(x => x >= w) ?? ALLOWED[ALLOWED.length - 1];
  return `/_next/image?url=${encodeURIComponent(url)}&w=${width}&q=75`;
}

export function imgSrcSet(url: string, widths: number[]) {
  if (!canOptimize(url)) return undefined;
  return widths.map(w => `${optimizedSrc(url, w)} ${w}w`).join(', ');
}

/** Atribut src + srcSet + sizes siap sebar ke <img>. */
export function responsiveImg(url: string, widths: number[], sizes: string) {
  const srcSet = imgSrcSet(url, widths);
  return srcSet ? { src: optimizedSrc(url, widths[Math.floor(widths.length / 2)]), srcSet, sizes } : { src: url };
}
