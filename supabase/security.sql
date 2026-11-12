-- =====================================================================
-- KEAMANAN ADMIN — jalankan SETELAH schema.sql dan blog.sql (aman diulang)
--
-- Masalah di versi lama: policy "authenticated ... using (true)" artinya
-- SIAPA PUN yang punya akun login Supabase (mis. lewat sign-up publik)
-- bisa mengubah/menghapus produk, pengaturan, artikel, dan file media.
-- Di sini akses tulis dibatasi hanya untuk user yang ada di tabel admin_users.
-- =====================================================================

create table if not exists public.admin_users (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);
alter table public.admin_users enable row level security;
revoke all on public.admin_users from anon, authenticated;
grant select on public.admin_users to authenticated;

drop policy if exists "admin can read own row" on public.admin_users;
create policy "admin can read own row" on public.admin_users
  for select to authenticated using (user_id = (select auth.uid()));
-- Tidak ada policy insert/update/delete → admin baru hanya bisa ditambah lewat SQL Editor.

create or replace function public.is_admin()
returns boolean
language sql stable security definer
set search_path = public
as $$ select exists (select 1 from public.admin_users where user_id = (select auth.uid())); $$;
revoke all on function public.is_admin() from public, anon;
grant execute on function public.is_admin() to authenticated;

-- ---- site_settings ----
drop policy if exists "authenticated manage site settings" on public.site_settings;
drop policy if exists "admin manage site settings" on public.site_settings;
create policy "admin manage site settings" on public.site_settings
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- ---- products (produk nonaktif hanya terlihat admin) ----
drop policy if exists "public can read products" on public.products;
drop policy if exists "authenticated can read products" on public.products;
drop policy if exists "authenticated manage products" on public.products;
drop policy if exists "admin manage products" on public.products;
-- PENTING: policy untuk anon TIDAK boleh memanggil is_admin() (anon tidak punya hak execute-nya →
-- seluruh query ditolak "permission denied" dan website jatuh ke data demo). Makanya dipisah.
create policy "public can read products" on public.products
  for select to anon using (is_active = true);
create policy "authenticated can read products" on public.products
  for select to authenticated using (is_active = true or public.is_admin());
create policy "admin manage products" on public.products
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- ---- blog_posts (jalankan blog.sql dulu) ----
do $$ begin
  if to_regclass('public.blog_posts') is not null then
    drop policy if exists "public can read published posts" on public.blog_posts;
    drop policy if exists "authenticated manage posts" on public.blog_posts;
    drop policy if exists "admin manage posts" on public.blog_posts;
    drop policy if exists "authenticated can read posts" on public.blog_posts;
    create policy "public can read published posts" on public.blog_posts
      for select to anon
      using (is_published = true and (published_at is null or published_at <= now()));
    create policy "authenticated can read posts" on public.blog_posts
      for select to authenticated
      using ((is_published = true and (published_at is null or published_at <= now())) or public.is_admin());
    create policy "admin manage posts" on public.blog_posts
      for all to authenticated using (public.is_admin()) with check (public.is_admin());
  end if;
end $$;

-- ---- storage (bucket media): baca publik, tulis hanya admin ----
drop policy if exists "public media read" on storage.objects;
drop policy if exists "authenticated media upload" on storage.objects;
drop policy if exists "authenticated media update" on storage.objects;
drop policy if exists "authenticated media delete" on storage.objects;
drop policy if exists "admin media upload" on storage.objects;
drop policy if exists "admin media update" on storage.objects;
drop policy if exists "admin media delete" on storage.objects;
create policy "public media read" on storage.objects for select to anon, authenticated using (bucket_id = 'media');
create policy "admin media upload" on storage.objects for insert to authenticated with check (bucket_id = 'media' and public.is_admin());
create policy "admin media update" on storage.objects for update to authenticated using (bucket_id = 'media' and public.is_admin()) with check (bucket_id = 'media' and public.is_admin());
create policy "admin media delete" on storage.objects for delete to authenticated using (bucket_id = 'media' and public.is_admin());

-- ---- DAFTARKAN ADMIN (GANTI email, lalu jalankan baris ini) ----
-- insert into public.admin_users(user_id)
--   select id from auth.users where email = 'GANTI_DENGAN_EMAIL_ADMIN'
--   on conflict do nothing;
