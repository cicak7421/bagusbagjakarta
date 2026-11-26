const isDev = process.env.NODE_ENV !== 'production';
const supabaseHost = process.env.NEXT_PUBLIC_SUPABASE_URL ? new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).origin : '';

// CSP: Next.js butuh 'unsafe-inline' untuk script hidrasi bawaan (tanpa nonce).
// Sisanya diketatkan: tidak boleh di-iframe, tidak ada <object>, form hanya ke diri sendiri.
const csp = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ''}`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https:",
  "media-src 'self' https:",
  "font-src 'self' data:",
  `connect-src 'self' ${supabaseHost} ${supabaseHost ? supabaseHost.replace('https://', 'wss://') : ''} ${isDev ? 'ws:' : ''}`.trim(),
  'frame-src https://www.google.com https://maps.google.com',
  "frame-ancestors 'none'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  ...(isDev ? [] : ['upgrade-insecure-requests']),
].join('; ');

/** @type {import('next').NextConfig} */
const nextConfig = {
  poweredByHeader: false,
  reactStrictMode: true,
  compress: true,
  // Gambar remote dikecilkan & dikonversi ke AVIF/WebP oleh Next (lihat lib/img.ts)
  images: {
    formats: ['image/avif', 'image/webp'],
    minimumCacheTTL: 60 * 60 * 24 * 30,
    remotePatterns: [
      ...(supabaseHost ? [{ protocol: 'https', hostname: new URL(supabaseHost).hostname }] : []),
      { protocol: 'https', hostname: 'images.unsplash.com' },
      { protocol: 'https', hostname: 'i.imgur.com' },
    ],
  },
  // CSS sengaja TIDAK disisipkan ke HTML (experimental.inlineCss mati): lembar gaya toko besar dan dipakai
  // semua halaman, jadi lebih hemat sebagai file statis yang di-cache sekali daripada terulang di tiap dokumen
  // (dengan inlineCss tiap halaman membawa CSS dua kali: di <style> dan di payload RSC).
  // Domain lama dialihkan permanen ke domain resmi supaya Google hanya mengindeks satu alamat.
  // /api tidak ikut dialihkan (webhook pembayaran tidak mengikuti redirect).
  async redirects() {
    return [
      {
        source: '/:path((?!api/).*)',
        has: [{ type: 'host', value: 'bagusbagjakarta.vercel.app' }],
        destination: 'https://trejoyease.vercel.app/:path',
        permanent: true,
      },
    ];
  },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'Content-Security-Policy', value: csp },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(), payment=(self), usb=()' },
          { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
          { key: 'Cross-Origin-Opener-Policy', value: 'same-origin' },
        ],
      },
    ];
  },
};
export default nextConfig;
