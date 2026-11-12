-- Pilihan ukuran per produk. Jalankan SEKALI di Supabase -> SQL Editor (aman diulang),
-- SEBELUM memakai panel admin versi baru (kalau tidak, tombol simpan produk akan gagal).
alter table public.products add column if not exists sizes jsonb not null default '[]'::jsonb;
alter table public.products drop constraint if exists products_variants_array;
alter table public.products add constraint products_variants_array check (
  jsonb_typeof(colors) = 'array' and jsonb_typeof(motifs) = 'array' and jsonb_typeof(sizes) = 'array'
  and jsonb_array_length(colors) <= 24 and jsonb_array_length(motifs) <= 24 and jsonb_array_length(sizes) <= 24
);
