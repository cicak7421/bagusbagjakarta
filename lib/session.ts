import { createClient } from '@/lib/supabase/server';

/** User yang sedang login (diverifikasi ke server Auth), atau null. Hanya untuk halaman/route dinamis. */
export async function getSessionUser() {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY) return { supabase: null, user: null };
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  return { supabase, user };
}

/** Tolak request POST yang datang dari website lain (lapisan tambahan anti-CSRF selain cookie SameSite). */
export function sameOrigin(request: Request) {
  const origin = request.headers.get('origin');
  if (!origin) return request.headers.get('sec-fetch-site') === 'same-origin';
  try { return new URL(origin).host === (request.headers.get('x-forwarded-host') || request.headers.get('host')); } catch { return false; }
}

export const noStore = { 'Cache-Control': 'no-store', 'X-Robots-Tag': 'noindex' };
