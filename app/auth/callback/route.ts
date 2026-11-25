import { NextResponse, type NextRequest } from 'next/server';
import type { EmailOtpType } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/server';
import { safeNext } from '@/lib/orders';

/**
 * Tujuan link dari email Supabase (verifikasi pendaftaran & reset password).
 * Menukar kode/token sekali pakai menjadi sesi login, lalu mengarahkan ke halaman internal.
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;
  const next = safeNext(searchParams.get('next'));
  const code = searchParams.get('code');
  const tokenHash = searchParams.get('token_hash');
  const type = searchParams.get('type') as EmailOtpType | null;
  const fail = NextResponse.redirect(new URL('/akun/masuk?e=link', origin));
  try {
    const supabase = await createClient();
    if (code) {
      const { error } = await supabase.auth.exchangeCodeForSession(code);
      if (error) return fail;
    } else if (tokenHash && type) {
      const { error } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type });
      if (error) return fail;
    } else return fail;
  } catch { return fail; }
  const res = NextResponse.redirect(new URL(next, origin));
  res.headers.set('Cache-Control', 'no-store');
  return res;
}
