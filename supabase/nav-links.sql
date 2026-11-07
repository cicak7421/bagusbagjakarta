-- =====================================================================
-- Menu navigasi yang bisa diatur dari admin + artikel "Custom"
-- Jalankan di Supabase SQL Editor (aman dijalankan berulang / idempotent).
-- Prasyarat: schema.sql dan blog.sql sudah pernah dijalankan.
-- Tidak mengubah policy/RLS, jadi tidak perlu menjalankan ulang security.sql.
-- =====================================================================

-- 1) Kolom menu navigasi (array JSON: [{label, url, new_tab}], maks 8 menu)
alter table public.site_settings add column if not exists nav_links jsonb;
do $$ begin
  alter table public.site_settings add constraint site_settings_nav_links_array
    check (nav_links is null or (jsonb_typeof(nav_links) = 'array' and jsonb_array_length(nav_links) <= 8));
  exception when duplicate_object then null; end $$;

-- 2) Isi menu awal HANYA jika belum pernah diatur (tidak menimpa pengaturan admin)
update public.site_settings
set nav_links = '[
  {"label":"Produk","url":"/#produk","new_tab":false},
  {"label":"Custom","url":"/blog/custom-goodie-bag","new_tab":true},
  {"label":"Tentang","url":"/#about","new_tab":false},
  {"label":"FAQ","url":"/#faq","new_tab":false},
  {"label":"Blog","url":"/blog","new_tab":false},
  {"label":"Kontak","url":"/#kontak","new_tab":false}
]'::jsonb
where nav_links is null;

-- 3) Artikel tujuan menu "Custom" (bisa diedit penuh dari Admin → Blog)
insert into public.blog_posts (title, slug, excerpt, content, cover_image_url, category, meta_title, meta_description, is_published, published_at)
select
  'Goodie Bag Custom: Logo, Motif, dan Ukuran Sesuai Brand Kamu',
  'custom-goodie-bag',
  'Semua yang perlu kamu tahu tentang goodie bag custom: pilihan bahan, logo, motif, ukuran, sampai alur pemesanannya.',
  $article$Goodie bag custom membuat brand kamu ikut dibawa pulang oleh setiap orang yang menerimanya. Tim Tre Joy Ease membantu mengubah kebutuhan reseller, event, corporate, dan retail menjadi produk yang siap diproduksi.

## Apa saja yang bisa dicustom?

- **Logo brand**: dicetak sesuai desain dan penempatan yang kamu mau.
- **Motif**: pilih motif bawaan seperti garis, polkadot, kotak, atau diagonal, atau kirim motif sendiri.
- **Ukuran**: sesuaikan dengan isi tas, dari tas kecil untuk souvenir sampai tas besar untuk hampers.
- **Warna**: pilih warna yang cocok dengan identitas brand.
- **Private label**: tas dengan merek kamu sendiri untuk dijual kembali.

## Pilihan bahan

- **Spunbond**: ringan dan ekonomis, cocok untuk jumlah besar seperti event dan promosi.
- **Paperbag**: tampilan rapi dan premium, area cetak luas untuk branding toko atau hampers.
- **Coolerbag**: insulated, cocok untuk makanan, minuman, dan corporate gift.

## Alur pemesanan custom

1. **Konsultasi**: ceritakan jenis tas, jumlah, dan tujuan penggunaannya.
2. **Pilih spesifikasi**: tentukan bahan, ukuran, warna, dan desain yang pas dengan budget.
3. **Produksi**: pesanan diproses sesuai spesifikasi yang sudah disepakati.
4. **Pengiriman**: goodie bag dikirim ke lokasi kamu.

## Yang perlu disiapkan

- Logo dalam resolusi tinggi (lebih baik file vektor seperti AI, CDR, atau PDF).
- Perkiraan jumlah pesanan. Minimal order (MOQ) berbeda tiap produk dan tertera di katalog.
- Referensi warna, motif, atau ukuran jika sudah ada.

Harga dan estimasi waktu produksi bergantung pada jenis tas, jumlah, dan tingkat kustomisasi, jadi konsultasikan kebutuhanmu lewat WhatsApp agar kami bisa memberi penawaran yang tepat.$article$,
  'https://images.unsplash.com/photo-1594223274512-ad4803739b7c?auto=format&fit=crop&w=1800&q=85',
  'Custom',
  'Goodie Bag Custom: Logo, Motif, Ukuran | Tre Joy Ease',
  'Info lengkap goodie bag custom: pilihan bahan spunbond, paperbag, coolerbag, logo, motif, ukuran, dan alur pemesanan.',
  true, now()
where not exists (select 1 from public.blog_posts where slug = 'custom-goodie-bag');
