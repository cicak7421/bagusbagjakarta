import { createClient } from '@supabase/supabase-js';

/**
 * Client dengan SECRET key (melewati RLS). HANYA untuk route handler di server
 * (membuat tagihan & webhook pembayaran). Jangan pernah di-import dari komponen client.
 * Env: SUPABASE_SECRET_KEY (atau nama lama SUPABASE_SERVICE_ROLE_KEY) — tanpa awalan NEXT_PUBLIC_.
 */
export function createAdminClient() {
  if (typeof window !== 'undefined') throw new Error('createAdminClient hanya boleh dipakai di server');
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false } });
}
