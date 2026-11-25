import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

/**
 * Gerbang area yang butuh login (Next.js 16: file "proxy" menggantikan "middleware").
 *
 * /admin  : hanya user yang terdaftar di admin_users. Customer biasa ditolak.
 * /akun, /checkout : hanya customer yang sudah login (kecuali halaman masuk/daftar/lupa password).
 * Semua respons di area ini: no-store + noindex. Sesi login diperpanjang otomatis di sini.
 * Penjagaan sebenarnya tetap ada di database (RLS); ini lapisan UX/defense-in-depth.
 */
const PUBLIC_ACCOUNT_PAGES = new Set(['/akun/masuk', '/akun/daftar', '/akun/lupa-password']);

export async function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const isAdminArea = pathname === '/admin' || pathname.startsWith('/admin/');
  const isAdminLogin = pathname === '/admin/login';
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  const harden = (res: NextResponse) => {
    res.headers.set('Cache-Control', 'no-store');
    res.headers.set('X-Robots-Tag', 'noindex, nofollow');
    return res;
  };
  const to = (path: string) => harden(NextResponse.redirect(new URL(path, request.url)));

  // Env belum diisi → jangan pernah membuka area tertutup.
  if (!url || !key) {
    if (isAdminArea) return isAdminLogin ? harden(NextResponse.next()) : to('/admin/login');
    return PUBLIC_ACCOUNT_PAGES.has(pathname) ? harden(NextResponse.next()) : to('/');
  }

  let response = NextResponse.next({ request });
  const supabase = createServerClient(url, key, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
      },
    },
  });

  const { data: { user } } = await supabase.auth.getUser(); // getUser() memverifikasi token ke server Auth

  if (!isAdminArea) {
    if (!user && !PUBLIC_ACCOUNT_PAGES.has(pathname)) return to(`/akun/masuk?next=${encodeURIComponent(pathname + search)}`);
    return harden(response);
  }

  let isAdmin = false;
  if (user) {
    const { data } = await supabase.from('admin_users').select('user_id').eq('user_id', user.id).maybeSingle();
    isAdmin = !!data;
  }
  if (isAdminLogin) return user && isAdmin ? to('/admin') : harden(response);
  if (!user) return to('/admin/login');
  if (!isAdmin) return to('/admin/login?denied=1');
  return harden(response);
}

export const config = { matcher: ['/admin', '/admin/:path*', '/akun', '/akun/:path*', '/checkout'] };
