import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

/**
 * Gerbang /admin (Next.js 16: file "proxy" menggantikan "middleware").
 *  - Belum login            → /admin/login
 *  - Login tapi BUKAN admin → keluar & kembali ke /admin/login?denied=1
 *  - Halaman login          → tidak diredirect ke dirinya sendiri (bug lama: redirect loop)
 *  - Semua respons admin    → no-store, noindex
 * Penjagaan sebenarnya tetap ada di database (RLS + is_admin()); ini lapisan UX/defense-in-depth.
 */
export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isLogin = pathname === '/admin/login';
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  const harden = (res: NextResponse) => {
    res.headers.set('Cache-Control', 'no-store');
    res.headers.set('X-Robots-Tag', 'noindex, nofollow');
    return res;
  };

  // Env belum diisi → jangan pernah membuka admin.
  if (!url || !key) return isLogin ? harden(NextResponse.next()) : harden(NextResponse.redirect(new URL('/admin/login', request.url)));

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

  let isAdmin = false;
  if (user) {
    const { data } = await supabase.from('admin_users').select('user_id').eq('user_id', user.id).maybeSingle();
    isAdmin = !!data;
  }

  if (isLogin) {
    if (user && isAdmin) return harden(NextResponse.redirect(new URL('/admin', request.url)));
    return harden(response);
  }
  if (!user) return harden(NextResponse.redirect(new URL('/admin/login', request.url)));
  if (!isAdmin) {
    const res = NextResponse.redirect(new URL('/admin/login?denied=1', request.url));
    return harden(res);
  }
  return harden(response);
}

export const config = { matcher: ['/admin', '/admin/:path*'] };
