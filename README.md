# Tre Joy Ease Indonesia — Goodie Bag Store

Toko online B2B/reseller (Next.js 16 + Supabase): katalog dengan varian warna/motif/ukuran, **keranjang & checkout**, **akun customer**, **pesanan + cek status**, pembayaran **QRIS via Midtrans**, panel admin (produk, pesanan, konten, blog), dan pemesanan via WhatsApp untuk order custom/besar.

## Setup
1. `cp .env.example .env.local` lalu isi variabelnya (lihat bagian **Environment variables**).
2. Supabase → SQL Editor, jalankan **berurutan**: `supabase/schema.sql` → `supabase/sizes.sql` → `supabase/blog.sql` → `supabase/nav-links.sql` → `supabase/promo-popup.sql` → `supabase/page-sections.sql` → `supabase/security.sql` → `supabase/orders.sql`.
3. Supabase → Auth → buat user admin (email/password), lalu jalankan baris `insert into public.admin_users ...` di akhir `security.sql` (ganti emailnya).
4. `npm install` → `npm run dev` → buka `/admin`.

> Setiap kali menjalankan ulang file SQL lain, jalankan lagi `security.sql` lalu `orders.sql` sesudahnya.

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
- **Checklist di dashboard Supabase**: aktifkan MFA untuk admin & leaked-password protection, set Site URL dan Redirect URLs.

## Environment variables
| Nama | Tempat | Keterangan |
| --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | publik | Koneksi Supabase (aman terlihat di browser, dijaga RLS). |
| `NEXT_PUBLIC_SITE_URL` | publik | Alamat website, dipakai canonical/sitemap. |
| `SUPABASE_SECRET_KEY` | **rahasia** | Supabase → Project Settings → API Keys → Secret key. Dipakai server untuk mencatat pembayaran. |
| `MIDTRANS_SERVER_KEY` | **rahasia** | Midtrans → Settings → Access Keys → Server Key. |
| `MIDTRANS_IS_PRODUCTION` | server | `true` hanya untuk Server Key produksi. Kosong = sandbox. |

Yang **rahasia** tidak boleh diberi awalan `NEXT_PUBLIC_` dan tidak boleh di-commit. Isi di Vercel → Settings → Environment Variables, lalu **Redeploy**.

## Toko online: akun, keranjang, pesanan
- **Customer**: `/akun/daftar`, `/akun/masuk`, `/akun/lupa-password`. Halaman `/akun` berisi riwayat pesanan dan data alamat; `/akun/pesanan/NOMOR` berisi status, rincian, resi, dan pembayaran.
- **Keranjang** disimpan di browser. Saat checkout yang dikirim ke server hanya id produk, varian, jumlah, dan alamat.
- **Harga, stok, dan total dihitung ulang di database** oleh fungsi `create_order()` (lihat `supabase/orders.sql`). Stok langsung dikurangi saat pesanan dibuat dan dikembalikan otomatis kalau pesanan dibatalkan.
- **Admin → Pesanan**: daftar + filter + cari, isi ongkir (sebelum dibayar), kurir & resi, ubah status (diproses → dikirim → selesai), tandai lunas manual (transfer bank), batalkan.
- Checkout bisa dimatikan tanpa deploy: `update site_settings set checkout_enabled = false;`
- Supabase → Authentication: *Allow new users to sign up* harus **ON** (customer mendaftar sendiri). Admin tetap hanya user di tabel `admin_users`. Isi **Site URL** dan **Redirect URLs** dengan domain website.

## Pembayaran QRIS (Midtrans)
1. Isi `SUPABASE_SECRET_KEY` dan `MIDTRANS_SERVER_KEY` di Vercel, lalu Redeploy. Tanpa dua key ini website tetap jalan: pesanan dibuat, pembayaran dikonfirmasi admin lewat WhatsApp/transfer.
2. Dashboard Midtrans → Settings → Configuration → **Payment Notification URL**: `https://DOMAIN/api/midtrans/notification`.
3. Pastikan metode **QRIS** aktif di akun Midtrans (Core API).
4. Uji di sandbox: buat pesanan, klik *Bayar dengan QRIS*, lalu bayar lewat simulator QRIS Midtrans dengan URL gambar QR.
5. Produksi: ganti ke Server Key produksi dan set `MIDTRANS_IS_PRODUCTION=true`.

Pengamanan pembayaran: nominal selalu dari database; Server Key hanya di server; status lunas hanya dari notifikasi yang signature SHA-512-nya valid **dan** dicek ulang ke API Midtrans; nominal dibandingkan dengan total pesanan; notifikasi ganda tidak berpengaruh; halaman pesanan juga mengecek status langsung ke Midtrans kalau notifikasi terlambat. QRIS dibatasi Rp 10.000.000 per transaksi; di atas itu diarahkan ke transfer bank.

## Performa & SEO
- Halaman publik statis dengan ISR 5 menit; panel admin memicu pembaruan langsung saat menyimpan (`/api/revalidate`).
- Beranda adalah server component; JavaScript hanya untuk filter katalog, bar pintasan, popup, dan keranjang.
- Sitemap memakai tanggal ubah asli dari database, robots menutup area akun/checkout/API, ikon + manifest, JSON-LD Organization/Product/Breadcrumb/FAQ.
- Halaman kepercayaan: `/tentang-kami`, `/syarat-ketentuan`, `/kebijakan-privasi`, `/kebijakan-pengembalian` (isi kebijakan perlu ditinjau pemilik usaha).

## Catatan
`@next/font` mengunduh Plus Jakarta Sans saat build — butuh internet (normal di Vercel).
