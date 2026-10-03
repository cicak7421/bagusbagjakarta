import { createClient } from '@/lib/supabase/server';
import type { BlogPost } from '@/lib/types';

export async function getPosts(): Promise<BlogPost[]> {
  try {
    const supabase = await createClient();
    const { data } = await supabase.from('blog_posts').select('*').eq('is_published', true).lte('published_at', new Date().toISOString()).order('published_at', { ascending: false });
    return data ?? [];
  } catch { return []; }
}
export const readingTime = (text: string) => Math.max(1, Math.round(text.trim().split(/\s+/).length / 200));
export const fmtDate = (iso: string | null) => iso ? new Intl.DateTimeFormat('id-ID', { dateStyle: 'long' }).format(new Date(iso)) : '';
