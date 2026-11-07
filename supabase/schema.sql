-- =====================================================================
-- Tre Joy Ease — skema lengkap (aman dijalankan berulang / idempotent)
-- Jalankan di Supabase SQL Editor. Setelah itu jalankan supabase/blog.sql
-- dan terakhir supabase/security.sql (wajib, untuk membatasi akses admin).
-- =====================================================================
create extension if not exists pgcrypto;

create table if not exists public.site_settings (
  id uuid primary key default gen_random_uuid(),
  company_name text not null default 'PT Tre Joy Ease Indonesia',
  tagline text not null default '',
  about text not null default '',
  hero_title text not null default '',
  hero_subtitle text not null default '',
  hero_image_url text not null default '',
  hero_video_url text not null default '',
  address text not null default '',
  google_maps_url text not null default '',
  whatsapp_number text not null default '',
  whatsapp_message text not null default '',
  payment_info text not null default '',
  updated_at timestamptz not null default now()
);

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  category text not null check (category in ('Spunbond','Paperbag','Coolerbag')),
  description text not null default '',
  size text not null default '',
  price numeric(14,2) not null default 0,
  min_order integer not null default 1,
  stock_qty integer not null default 0,
  image_url text not null default '',
  is_customizable boolean not null default true,
  is_active boolean not null default true,
  sort_order integer not null default 0,
  colors jsonb not null default '[]'::jsonb,
  motifs jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Untuk project lama: tambah kolom varian + batasan data (aman diulang)
alter table public.site_settings add column if not exists nav_links jsonb;
alter table public.site_settings add column if not exists promo_popup jsonb;
alter table public.site_settings add column if not exists page_sections jsonb;
alter table public.products add column if not exists colors jsonb not null default '[]'::jsonb;
alter table public.products add column if not exists motifs jsonb not null default '[]'::jsonb;
alter table public.products add column if not exists sizes jsonb not null default '[]'::jsonb;
do $$ begin
  alter table public.products add constraint products_price_nonneg check (price >= 0);
  exception when duplicate_object then null; end $$;
do $$ begin
  alter table public.products add constraint products_stock_nonneg check (stock_qty >= 0);
  exception when duplicate_object then null; end $$;
do $$ begin
  alter table public.products add constraint products_moq_min check (min_order >= 1);
  exception when duplicate_object then null; end $$;
do $$ begin
  alter table public.products add constraint products_slug_format check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$');
  exception when duplicate_object then null; end $$;
do $$ begin
  alter table public.products add constraint products_variants_array check (jsonb_typeof(colors) = 'array' and jsonb_typeof(motifs) = 'array' and jsonb_array_length(colors) <= 24 and jsonb_array_length(motifs) <= 24);
  exception when duplicate_object then null; end $$;

insert into public.site_settings(company_name,tagline,about,hero_title,hero_subtitle,address,google_maps_url,whatsapp_number,whatsapp_message,payment_info)
select 'PT Tre Joy Ease Indonesia','Partner goodie bag untuk bisnis yang terus bergerak.','Kami membantu reseller, event organizer, corporate, dan retail mendapatkan goodie bag yang rapi, konsisten, dan fleksibel untuk kebutuhan branding.','Goodie Bag yang Bikin Brand Lebih Diingat.','Ready stock untuk gerak cepat. Custom untuk kebutuhan branding yang lebih personal.','Jakarta, Indonesia','https://maps.google.com/?q=Jakarta, Indonesia','6281234567890','Halo Tre Joy Ease, saya ingin konsultasi produk goodie bag.','Pembayaran dikonfirmasi melalui WhatsApp. Admin akan mengirim detail rekening/metode pembayaran setelah pesanan disepakati.'
where not exists (select 1 from public.site_settings);

insert into public.products(name,slug,category,description,size,price,min_order,stock_qty,image_url,sort_order,colors,motifs)
select * from (values
 ('Spunbond Basic','spunbond-basic','Spunbond','Ringan, ekonomis, cocok untuk event, promosi, dan reseller.','25 × 35 cm',6500,100,1200,'https://images.unsplash.com/photo-1601593346740-925612772716?auto=format&fit=crop&w=900&q=80',1,
   '[{"name":"Hitam","hex":"#2b2b2f"},{"name":"Putih","hex":"#f4f4f2"},{"name":"Merah","hex":"#c8321f","stock_qty":240},{"name":"Biru Navy","hex":"#1f3a73"},{"name":"Hijau Sage","hex":"#8fa886","stock_qty":0}]'::jsonb,'[]'::jsonb),
 ('Paperbag Premium','paperbag-premium','Paperbag','Tampilan premium dengan area cetak yang luas untuk branding.','24 × 10 × 32 cm',12500,100,680,'https://images.unsplash.com/photo-1605733513597-a8f8341084e6?auto=format&fit=crop&w=900&q=80',2,
   '[{"name":"Kraft","hex":"#b88a5a"},{"name":"Putih","hex":"#f7f7f5"},{"name":"Hitam","hex":"#222226"}]'::jsonb,
   '[{"name":"Polos","pattern":"polos","hex":"#d8c7ae"},{"name":"Garis","pattern":"garis","hex":"#2f4a8a"},{"name":"Polkadot","pattern":"polkadot","hex":"#c8321f","price_add":500},{"name":"Kotak","pattern":"kotak","hex":"#2b2b2f","price_add":500}]'::jsonb),
 ('Coolerbag Daily','coolerbag-daily','Coolerbag','Bag insulated untuk makanan, minuman, hampers, dan corporate gift.','22 × 15 × 18 cm',28500,50,320,'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=900&q=80',3,
   '[{"name":"Silver","hex":"#c9ccd1"},{"name":"Hitam","hex":"#2b2b2f"},{"name":"Biru","hex":"#4f7bd1"}]'::jsonb,
   '[{"name":"Polos","pattern":"polos","hex":"#d9d9de"},{"name":"Diagonal","pattern":"diagonal","hex":"#1f3a73","price_add":1000}]'::jsonb)
) as v(name,slug,category,description,size,price,min_order,stock_qty,image_url,sort_order,colors,motifs)
where not exists (select 1 from public.products);

-- RLS: publik hanya boleh MEMBACA. Izin tulis untuk admin ada di security.sql
-- (sebelum security.sql dijalankan, panel admin belum bisa menyimpan = aman by default).
alter table public.site_settings enable row level security;
alter table public.products enable row level security;
revoke all on public.site_settings from anon, authenticated;
revoke all on public.products from anon, authenticated;
grant select on public.site_settings, public.products to anon, authenticated;
grant insert, update, delete on public.site_settings, public.products to authenticated;
drop policy if exists "public can read site settings" on public.site_settings;
create policy "public can read site settings" on public.site_settings for select to anon, authenticated using (true);
drop policy if exists "public can read products" on public.products;
create policy "public can read products" on public.products for select to anon, authenticated using (is_active = true);

-- Bucket media: hanya gambar, hasil kompres maks 5 MB, file asli bebas (SVG sengaja TIDAK diizinkan → cegah XSS lewat upload)
insert into storage.buckets(id, name, public, file_size_limit, allowed_mime_types)
values ('media','media', true, 5242880, array['image/jpeg','image/png','image/webp','image/gif','image/avif'])
on conflict (id) do update set file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "public media read" on storage.objects;
create policy "public media read" on storage.objects for select to anon, authenticated using (bucket_id = 'media');
