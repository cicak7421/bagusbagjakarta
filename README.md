# Tre Joy Ease Indonesia — Goodie Bag Store

Storefront B2B/reseller (Next.js 16 + Supabase): katalog, pilihan **warna & motif** ala iBox, stok per varian, checkout via WhatsApp, admin panel, blog. **Bayar langsung via Mitra Trans: segera hadir** (UI sudah disiapkan, nonaktif).

## Setup
1. `cp .env.example .env.local` lalu isi 4 variabel.
2. Supabase → SQL Editor, jalankan **berurutan**: `supabase/schema.sql` → `supabase/sizes.sql` → `supabase/blog.sql` → `supabase/nav-links.sql` → `supabase/promo-popup.sql` → `supabase/page-sections.sql` → `supabase/security.sql`.
3. Supabase → Auth → buat user admin (email/password), lalu jalankan baris `insert into public.admin_users ...` di akhir `security.sql` (ganti emailnya).
4. `npm install` → `npm run dev` → buka `/admin`.

> Selalu jalankan `security.sql` **paling akhir** setiap kali menjalankan ulang file SQL lain.

## Menu navigasi & notifikasi admin
- **Admin → Website → Menu Navigasi**: ubah nama, link, urutan, dan "Tab baru" untuk tiap menu navbar. Link boleh `/#produk` (scroll ke bagian), `/blog/slug-artikel`, atau `https://…`.
- Menu "Custom" bawaan membuka artikel `/blog/custom-goodie-bag` di tab baru (dibuat oleh `supabase/nav-links.sql`, isinya bisa diedit di Admin → Blog).
- Setiap simpan/hapus di admin menampilkan notifikasi **Berhasil/Gagal** (pojok kanan atas), tombol berubah "Menyimpan…", dan penyimpanan yang diam-diam ditolak database (mis. akun belum terdaftar admin) kini dilaporkan sebagai error.

## Konten Halaman (Cara Pesan, Custom, FAQ)
**Admin → Konten Halaman** punya tiga tab: *Cara Pesan*, *Custom*, dan *FAQ*. Di tiap tab kamu bisa:
- mengubah judul, teks, ikon, link tombol, poin, langkah, dan pertanyaan/jawaban; menambah, menghapus, dan menggeser urutan;
- menyisipkan **foto** di tiga tingkat: seluruh section, tiap kartu/langkah, dan tiap jawaban FAQ;
- mengatur **tata letak foto**: posisi (atas/bawah/kiri/kanan), ukuran, bentuk bingkai (1:1, 4:3, 16:9, 3:4, otomatis), dan isi bingkai (dipotong/utuh), lengkap dengan pratinjau langsung;
- menyembunyikan section, atau mengembalikannya ke teks bawaan.

Di HP, posisi kiri/kanan otomatis menjadi atas/bawah. Di jawaban FAQ, tulis `{{payment_info}}` untuk memakai teks "payment info" dari Pengaturan Website. Butuh `supabase/page-sections.sql`; kalau belum dijalankan, website memakai teks bawaan dan admin akan memberi tahu saat menyimpan.

## Tampilan HP / Android
- Halaman produk: foto beralih halus (foto lama tetap tampil sampai foto baru selesai dimuat), semua foto varian dimuat di latar belakang, label pilihan tampil di atas foto, dan bar bawah menampilkan thumbnail pilihan (ketuk untuk kembali ke foto besar).
- Menu hamburger di semua halaman, bar pintasan bawah bisa digeser dan otomatis menyorot bagian aktif, target sentuh minimal 44px.

## Popup promosi
**Admin → Website → Popup Promosi**: aktifkan, upload gambar, isi judul/teks/tombol (semua opsional), lalu "Simpan perubahan". Popup muncul otomatis saat website dibuka dan ditutup dengan tombol X (atau klik area gelap / Esc). Tersedia tombol Pratinjau. Butuh `supabase/promo-popup.sql`.

## Fitur baru
- **Warna**: swatch bulat, centang saat dipilih, coret jika stok habis.
- **Motif**: foto motif *atau* pola CSS bawaan (polos, garis, polkadot, kotak, zigzag, diagonal) — tanpa perlu upload.
- Per varian: stok sendiri (kosong = ikut stok produk), tambahan harga/pcs, foto yang mengganti foto utama.
- Jumlah dengan MOQ + estimasi total; pesan WhatsApp otomatis memuat warna, motif, jumlah.
- Stok habis → tombol "Stok habis" + **Ingatkan saya** (WhatsApp). Mobile: bar bawah harga + tombol.
- Admin: editor warna/motif per produk, edit slug, aktif/nonaktif, urutan, bisa-custom.

## Keamanan (yang diperbaiki)
- **RLS**: dulu semua user login bisa edit/hapus apa pun. Sekarang hanya user di `admin_users` (`is_admin()`), termasuk storage & blog.
- **Bug redirect loop** di middleware untuk `/admin/login` diperbaiki; `proxy.ts` (Next 16) juga mengecek admin, `no-store`, `noindex`.
- Security headers + CSP (`next.config.mjs`): anti-clickjacking, nosniff, HSTS, dll.
- Upload: hanya JPG/PNG/WebP/GIF/AVIF (SVG ditolak); gambar dikompres otomatis di browser (resize maks 1600px + WebP, tanpa batas ukuran file asli); bucket tetap membatasi hasil akhir 5 MB, ekstensi dari MIME bukan nama file; dibatasi juga di bucket.
- Validasi DB: harga/stok ≥ 0, MOQ ≥ 1, format slug, varian harus array ≤ 24.
- URL dari database difilter (`safeUrl`) — blokir `javascript:`; warna divalidasi hex.
- Login: pesan error generik, jeda bertahap. Dependency di-pin (bukan `latest`).
- **Checklist di dashboard Supabase**: matikan *Allow new users to sign up*, aktifkan MFA & leaked-password protection, set Site URL.

## Mitra Trans (nanti)
Lihat komentar di `lib/payments.ts`: hitung harga ulang di server, secret hanya env server, status lunas hanya dari webhook yang diverifikasi, simpan order `pending` + idempotency key. Tambahkan host Mitra Trans ke `connect-src`/`form-action` di CSP saat itu.

## Catatan
`@next/font` mengunduh Plus Jakarta Sans saat build — butuh internet (normal di Vercel).
