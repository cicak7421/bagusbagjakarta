-- Jalankan di Supabase SQL Editor (aman dijalankan berulang)
create table if not exists public.blog_posts (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  slug text not null unique,
  excerpt text not null default '',
  content text not null default '',
  cover_image_url text not null default '',
  category text not null default '',
  author text not null default 'Tim Tre Joy Ease',
  meta_title text not null default '',
  meta_description text not null default '',
  is_published boolean not null default false,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.blog_posts enable row level security;
revoke all on public.blog_posts from anon, authenticated;
grant select on public.blog_posts to anon, authenticated;
grant insert, update, delete on public.blog_posts to authenticated;
drop policy if exists "public can read published posts" on public.blog_posts;
drop policy if exists "authenticated manage posts" on public.blog_posts;
create policy "public can read published posts" on public.blog_posts for select to anon, authenticated
  using ((is_published = true and (published_at is null or published_at <= now())) or (select auth.uid()) is not null);
create policy "authenticated manage posts" on public.blog_posts for all to authenticated using (true) with check (true);

insert into public.blog_posts (title, slug, excerpt, content, category, meta_title, meta_description, is_published, published_at)
select 'Cara Memilih Goodie Bag untuk Event dan Promosi Brand', 'cara-memilih-goodie-bag-untuk-event',
 'Panduan singkat memilih bahan, ukuran, dan jumlah goodie bag agar sesuai budget dan citra brand.',
 E'Goodie bag adalah hal pertama yang dibawa pulang peserta event. Pilihan yang tepat membuat brand kamu lebih diingat.\n\n## 1. Tentukan tujuan penggunaan\n\nApakah untuk seminar, pameran, hampers, atau dijual kembali? Tujuan menentukan bahan dan ukuran yang dibutuhkan.\n\n## 2. Pilih bahan yang sesuai\n\n- **Spunbond**: ringan dan ekonomis, cocok untuk jumlah besar.\n- **Paperbag**: tampilan rapi dan premium untuk toko atau hampers.\n- **Coolerbag**: untuk makanan dan minuman yang perlu tetap dingin.\n\n## 3. Sesuaikan ukuran dan jumlah\n\nPastikan isi muat dengan nyaman. Cek juga minimal order (MOQ) tiap produk sebelum menghitung budget.\n\n## 4. Siapkan desain dan logo\n\nSiapkan logo dalam resolusi tinggi. Tim kami bisa membantu menyesuaikan motif dan penempatan logo.\n\nButuh rekomendasi? Konsultasikan kebutuhanmu lewat WhatsApp.',
 'Tips', 'Cara Memilih Goodie Bag untuk Event | Tre Joy Ease', 'Panduan memilih goodie bag spunbond, paperbag, atau coolerbag untuk event dan promosi brand: bahan, ukuran, jumlah, dan desain.', true, now()
where not exists (select 1 from public.blog_posts);
