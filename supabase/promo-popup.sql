-- =====================================================================
-- Popup promosi yang bisa diatur dari Admin → Website → Popup Promosi
-- Jalankan di Supabase SQL Editor (aman dijalankan berulang). Tidak mengubah RLS.
-- Isi kolom: {enabled, image_url, title, text, button_label, button_url}
-- =====================================================================
alter table public.site_settings add column if not exists promo_popup jsonb;
