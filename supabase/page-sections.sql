-- =====================================================================
-- Konten section "Cara Pesan", "Custom", dan "FAQ" yang bisa diedit dari
-- Admin → Konten Halaman (teks, foto, dan tata letak foto).
-- Jalankan di Supabase SQL Editor (aman dijalankan berulang). Tidak mengubah RLS,
-- jadi tidak perlu menjalankan ulang security.sql.
--
-- Isi kolom (jsonb): { howto: {...}, custom: {...}, faq: {...} }
-- Kalau kolom masih kosong (NULL), website memakai teks bawaan.
-- =====================================================================
alter table public.site_settings add column if not exists page_sections jsonb;
do $$ begin
  alter table public.site_settings add constraint site_settings_page_sections_obj
    check (page_sections is null or (jsonb_typeof(page_sections) = 'object' and pg_column_size(page_sections) < 200000));
  exception when duplicate_object then null; end $$;
