import { createClient } from '@supabase/supabase-js';

/**
 * Client TANPA cookie untuk data publik (katalog, pengaturan, blog).
 * Karena tidak menyentuh cookies(), halaman publik bisa di-cache (ISR) dan jauh lebih cepat.
 * Hanya bisa membaca apa yang diizinkan RLS untuk role "anon".
 */
export function createPublicClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false } });
}
