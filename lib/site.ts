/**
 * Alamat resmi website (dipakai canonical, sitemap, robots, JSON-LD).
 * Domain lama bagusbagjakarta.vercel.app sudah dialihkan ke domain ini (lihat next.config.mjs),
 * jadi nilai env lama yang masih menunjuk ke sana diabaikan.
 * Kalau nanti pakai domain sendiri: ganti DEFAULT_SITE_URL di sini (atau set NEXT_PUBLIC_SITE_URL di Vercel).
 */
export const DEFAULT_SITE_URL = 'https://trejoyease.vercel.app';
export const OLD_HOSTS = ['bagusbagjakarta.vercel.app'];

const fromEnv = (process.env.NEXT_PUBLIC_SITE_URL || '').trim().replace(/\/+$/, '');
export const siteUrl = fromEnv && !OLD_HOSTS.some(h => fromEnv.includes(h)) ? fromEnv : DEFAULT_SITE_URL;
