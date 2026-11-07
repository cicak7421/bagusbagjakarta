-- =====================================================================
-- FIX: website tidak mengikuti database kalau pengunjung belum login.
-- Penyebab: policy baca produk memanggil is_admin(), padahal role "anon" tidak boleh
-- menjalankan fungsi itu -> query pengunjung ditolak -> website menampilkan data demo.
-- Jalankan file ini sekali di Supabase -> SQL Editor.
-- =====================================================================
drop policy if exists "public can read products" on public.products;
drop policy if exists "authenticated can read products" on public.products;
create policy "public can read products" on public.products
  for select to anon using (is_active = true);
create policy "authenticated can read products" on public.products
  for select to authenticated using (is_active = true or public.is_admin());

do $$ begin
  if to_regclass('public.blog_posts') is not null then
    drop policy if exists "public can read published posts" on public.blog_posts;
    drop policy if exists "authenticated can read posts" on public.blog_posts;
    create policy "public can read published posts" on public.blog_posts
      for select to anon
      using (is_published = true and (published_at is null or published_at <= now()));
    create policy "authenticated can read posts" on public.blog_posts
      for select to authenticated
      using ((is_published = true and (published_at is null or published_at <= now())) or public.is_admin());
  end if;
end $$;
