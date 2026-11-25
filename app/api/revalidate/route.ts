import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { getSessionUser, noStore, sameOrigin } from '@/lib/session';

export const dynamic = 'force-dynamic';

/**
 * Dipanggil panel admin setelah menyimpan: halaman publik yang di-cache langsung dibuat ulang,
 * jadi perubahan produk/pengaturan tampil saat itu juga (tanpa menunggu 5 menit).
 * Hanya admin yang boleh memicunya.
 */
export async function POST(request: Request) {
  if (!sameOrigin(request)) return NextResponse.json({ error: 'forbidden' }, { status: 403, headers: noStore });
  const { supabase, user } = await getSessionUser();
  if (!supabase || !user) return NextResponse.json({ error: 'unauthorized' }, { status: 401, headers: noStore });
  const { data } = await supabase.from('admin_users').select('user_id').eq('user_id', user.id).maybeSingle();
  if (!data) return NextResponse.json({ error: 'forbidden' }, { status: 403, headers: noStore });
  revalidatePath('/', 'layout');
  return NextResponse.json({ ok: true }, { headers: noStore });
}
