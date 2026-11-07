/** Satu menu di navbar. `url` boleh: /#produk (scroll), /blog/slug (halaman), atau https://… (link luar). */
export type NavLink = { label: string; url: string; new_tab?: boolean };

/** Popup promosi yang muncul saat website dibuka. Semua isi (kecuali enabled) opsional, minimal gambar atau teks. */
export type PromoPopup = { enabled: boolean; image_url: string; title: string; text: string; button_label: string; button_url: string };

export type SiteSettings = {
  id?: string;
  company_name: string;
  tagline: string;
  about: string;
  hero_title: string;
  hero_subtitle: string;
  hero_image_url: string;
  hero_video_url: string;
  address: string;
  google_maps_url: string;
  whatsapp_number: string;
  whatsapp_message: string;
  payment_info: string;
  nav_links?: NavLink[] | null;
  promo_popup?: PromoPopup | null;
  /** Konten section Cara Pesan / Custom / FAQ (jsonb mentah dari DB; rapikan dengan normalizeSections). */
  page_sections?: unknown;
  updated_at?: string;
};

/** Pola motif bawaan (digambar pakai CSS, jadi tidak butuh foto). */
export type PatternKey = 'polos' | 'garis' | 'polkadot' | 'kotak' | 'zigzag' | 'diagonal';

/**
 * Satu pilihan varian (satu warna ATAU satu motif).
 * - Warna  : pakai `hex` untuk swatch bulat.
 * - Motif  : pakai `image_url` (foto motif) atau `pattern` + `hex` (pola CSS).
 * - `stock_qty` kosong/null  => ikut stok produk.
 * - `price_add` = tambahan harga per pcs untuk pilihan ini (boleh 0).
 * - `image_url` juga dipakai mengganti foto utama saat dipilih.
 */
export type VariantOption = {
  name: string;
  hex?: string;
  pattern?: PatternKey;
  image_url?: string;
  stock_qty?: number | null;
  price_add?: number;
  /** Khusus UKURAN: harga per pcs untuk ukuran ini (menggantikan harga produk). Kosong = pakai harga produk. */
  price?: number | null;
};

export type Product = {
  id: string;
  name: string;
  slug: string;
  category: 'Spunbond' | 'Paperbag' | 'Coolerbag';
  description: string;
  size: string;
  price: number;
  min_order: number;
  stock_qty: number;
  image_url: string;
  is_customizable: boolean;
  is_active: boolean;
  sort_order: number;
  colors: VariantOption[];
  motifs: VariantOption[];
  /** Pilihan ukuran (mis. 25 × 35 cm, 30 × 40 cm). Kosong = pakai kolom `size` produk saja. */
  sizes: VariantOption[];
};

export type BlogPost = {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  cover_image_url: string;
  category: string;
  author: string;
  meta_title: string;
  meta_description: string;
  is_published: boolean;
  published_at: string | null;
  created_at?: string;
  updated_at?: string;
};
