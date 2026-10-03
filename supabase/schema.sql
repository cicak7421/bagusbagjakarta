create extension if not exists pgcrypto;
create table if not exists public.site_settings (id uuid primary key default gen_random_uuid(),company_name text not null default 'PT Tre Joy Ease Indonesia',tagline text not null default '',about text not null default '',hero_title text not null default '',hero_subtitle text not null default '',hero_image_url text not null default '',hero_video_url text not null default '',address text not null default '',google_maps_url text not null default '',whatsapp_number text not null default '',whatsapp_message text not null default '',payment_info text not null default '',updated_at timestamptz not null default now());
create table if not exists public.products (id uuid primary key default gen_random_uuid(),name text not null,slug text not null unique,category text not null check (category in ('Spunbond','Paperbag','Coolerbag')),description text not null default '',size text not null default '',price numeric(14,2) not null default 0,min_order integer not null default 1,stock_qty integer not null default 0,image_url text not null default '',is_customizable boolean not null default true,is_active boolean not null default true,sort_order integer not null default 0,created_at timestamptz not null default now(),updated_at timestamptz not null default now());
alter table public.site_settings enable row level security; alter table public.products enable row level security;
revoke all on public.site_settings from anon, authenticated; revoke all on public.products from anon, authenticated; grant select on public.site_settings, public.products to anon, authenticated; grant insert,update,delete on public.site_settings, public.products to authenticated;
create policy "public can read site settings" on public.site_settings for select to anon,authenticated using (true);
create policy "public can read products" on public.products for select to anon,authenticated using (is_active=true or (select auth.uid()) is not null);
create policy "authenticated manage site settings" on public.site_settings for all to authenticated using (true) with check (true);
create policy "authenticated manage products" on public.products for all to authenticated using (true) with check (true);
insert into public.site_settings(company_name,tagline,about,hero_title,hero_subtitle,address,google_maps_url,whatsapp_number,whatsapp_message,payment_info) select 'PT Tre Joy Ease Indonesia','Partner goodie bag untuk bisnis yang terus bergerak.','Kami membantu reseller, event organizer, corporate, dan retail mendapatkan goodie bag yang rapi, konsisten, dan fleksibel untuk kebutuhan branding.','Goodie Bag yang Bikin Brand Lebih Diingat.','Ready stock untuk gerak cepat. Custom untuk kebutuhan branding yang lebih personal.','Jakarta, Indonesia','https://maps.google.com/?q=Jakarta, Indonesia','6281234567890','Halo Tre Joy Ease, saya ingin konsultasi produk goodie bag.','Pembayaran dikonfirmasi melalui WhatsApp. Admin akan mengirim detail rekening/metode pembayaran setelah pesanan disepakati.' where not exists(select 1 from public.site_settings);
insert into public.products(name,slug,category,description,size,price,min_order,stock_qty,image_url,sort_order) select * from (values ('Spunbond Basic','spunbond-basic','Spunbond','Ringan, ekonomis, cocok untuk event, promosi, dan reseller.','25 × 35 cm',6500,100,1200,'https://images.unsplash.com/photo-1601593346740-925612772716?auto=format&fit=crop&w=900&q=80',1),('Paperbag Premium','paperbag-premium','Paperbag','Tampilan premium dengan area cetak yang luas untuk branding.','24 × 10 × 32 cm',12500,100,680,'https://images.unsplash.com/photo-1605733513597-a8f8341084e6?auto=format&fit=crop&w=900&q=80',2),('Coolerbag Daily','coolerbag-daily','Coolerbag','Bag insulated untuk makanan, minuman, hampers, dan corporate gift.','22 × 15 × 18 cm',28500,50,320,'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=900&q=80',3)) as v(name,slug,category,description,size,price,min_order,stock_qty,image_url,sort_order) where not exists(select 1 from public.products);
insert into storage.buckets(id,name,public) values('media','media',true) on conflict(id) do nothing;
create policy "public media read" on storage.objects for select to anon,authenticated using(bucket_id='media');
create policy "authenticated media upload" on storage.objects for insert to authenticated with check(bucket_id='media');
create policy "authenticated media update" on storage.objects for update to authenticated using(bucket_id='media') with check(bucket_id='media');
create policy "authenticated media delete" on storage.objects for delete to authenticated using(bucket_id='media');
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
