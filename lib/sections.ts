import type { SiteSettings } from '@/lib/types';
import { safeUrl } from '@/lib/safe';
import { normalizeNavUrl } from '@/lib/nav';

/* ===================================================================
 * Konten section "Cara Pesan", "Custom", dan "FAQ" yang bisa diedit di admin.
 * Disimpan di kolom `site_settings.page_sections` (jsonb). Semua data dari DB
 * dianggap tidak tepercaya → dirapikan lewat normalize*() sebelum dirender.
 * =================================================================== */

export type ImgPos = 'top' | 'bottom' | 'left' | 'right';
export type ImgSize = 'sm' | 'md' | 'lg' | 'full';
export type ImgRatio = 'auto' | '1:1' | '4:3' | '16:9' | '3:4';
export type ImgFit = 'cover' | 'contain';

/** Foto + cara menempatkannya. Dipakai di section, kartu, langkah, dan item FAQ. */
export type SectionImage = { url: string; alt: string; pos: ImgPos; size: ImgSize; ratio: ImgRatio; fit: ImgFit };

export const IMG_POSITIONS: { key: ImgPos; label: string }[] = [
  { key: 'top', label: 'Atas' }, { key: 'bottom', label: 'Bawah' }, { key: 'left', label: 'Kiri' }, { key: 'right', label: 'Kanan' },
];
export const IMG_SIZES: { key: ImgSize; label: string }[] = [
  { key: 'sm', label: 'Kecil' }, { key: 'md', label: 'Sedang' }, { key: 'lg', label: 'Besar' }, { key: 'full', label: 'Penuh' },
];
export const IMG_RATIOS: { key: ImgRatio; label: string }[] = [
  { key: 'auto', label: 'Otomatis (ikut foto)' }, { key: '1:1', label: 'Kotak 1:1' }, { key: '4:3', label: 'Landscape 4:3' }, { key: '16:9', label: 'Lebar 16:9' }, { key: '3:4', label: 'Potret 3:4' },
];
export const IMG_FITS: { key: ImgFit; label: string }[] = [
  { key: 'cover', label: 'Penuhi bingkai (dipotong)' }, { key: 'contain', label: 'Tampilkan utuh' },
];

export const ICONS = ['package', 'palette', 'truck', 'message', 'shield', 'sparkles', 'clock', 'heart', 'star', 'card', 'ruler', 'none'] as const;
export type IconKey = (typeof ICONS)[number];
export const ICON_LABELS: Record<IconKey, string> = {
  package: 'Paket', palette: 'Palet warna', truck: 'Pengiriman', message: 'Chat', shield: 'Garansi', sparkles: 'Kilau',
  clock: 'Waktu', heart: 'Hati', star: 'Bintang', card: 'Pembayaran', ruler: 'Ukuran', none: 'Tanpa ikon',
};

export type HowCard = { icon: IconKey; title: string; text: string; link_label: string; link_url: string; image: SectionImage | null };
export type HowSection = { enabled: boolean; title: string; subtitle: string; columns: 1 | 2 | 3; cards: HowCard[]; image: SectionImage | null };

export type CustomStep = { title: string; text: string; image: SectionImage | null };
export type CustomSection = { enabled: boolean; title: string; text: string; checks: string[]; columns: 2 | 3 | 4; steps: CustomStep[]; image: SectionImage | null };

export type FaqItem = { q: string; a: string; image: SectionImage | null };
export type FaqSection = { enabled: boolean; title: string; subtitle: string; open_first: boolean; items: FaqItem[]; image: SectionImage | null };

export type PageSections = { howto: HowSection; custom: CustomSection; faq: FaqSection };

export const LIMITS = { cards: 6, steps: 8, faq: 30, checks: 8 } as const;

/** Token di jawaban FAQ yang diganti otomatis dengan teks "payment info" dari Pengaturan Website. */
export const PAYMENT_TOKEN = '{{payment_info}}';

/* ---------------- default (sama dengan tampilan sebelumnya) ---------------- */

export const defaultImage = (url = ''): SectionImage => ({ url, alt: '', pos: 'top', size: 'md', ratio: '4:3', fit: 'cover' });

export const DEFAULT_HOWTO: HowSection = {
  enabled: true,
  title: 'Pesan goodie bag lebih mudah dan terpercaya.',
  subtitle: 'Dua cara pesan sesuai kebutuhan bisnis kamu, semuanya dibantu langsung oleh tim kami lewat WhatsApp.',
  columns: 2,
  cards: [
    { icon: 'package', title: 'Ready Stock.', text: 'Pilih produk, cek stok dan harga, lalu pesan langsung. Cocok untuk reseller dan kebutuhan yang butuh cepat.', link_label: 'Lihat katalog', link_url: '/#produk', image: null },
    { icon: 'palette', title: 'Custom Branding.', text: 'Pasang logo, motif, dan ukuran sesuai brand kamu. Kami bantu dari konsultasi sampai pengiriman.', link_label: 'Lebih lanjut', link_url: '/#custom', image: null },
  ],
  image: null,
};

export const DEFAULT_CUSTOM: CustomSection = {
  enabled: true,
  title: 'Pasang logo brand kamu di setiap tas.',
  text: 'Dari pemilihan bahan sampai motif cetak, kami bantu ubah kebutuhan reseller, event, corporate, dan retail jadi produk siap produksi.',
  checks: ['Custom ukuran', 'Custom motif', 'Private label'],
  columns: 4,
  steps: [
    { title: 'Konsultasi', text: 'Ceritakan jenis tas, jumlah, dan tujuan penggunaannya.', image: null },
    { title: 'Pilih spesifikasi', text: 'Bahan, ukuran, dan desain yang pas dengan budget kamu.', image: null },
    { title: 'Produksi', text: 'Pesanan diproses sesuai spesifikasi yang disepakati.', image: null },
    { title: 'Pengiriman', text: 'Goodie bag dikirim ke lokasi kamu.', image: null },
  ],
  image: null,
};

export const DEFAULT_FAQ: FaqSection = {
  enabled: true,
  title: 'Pertanyaan sebelum order',
  subtitle: 'Jawaban singkat seputar minimal order, custom, cara memesan, dan pembayaran.',
  open_first: false,
  items: [
    { q: 'Berapa minimal order goodie bag?', a: 'Minimal order (MOQ) berbeda tiap produk dan tertera jelas di kartu produk, mulai dari 50 pcs. Untuk kebutuhan di bawah MOQ, silakan konsultasi lewat WhatsApp.', image: null },
    { q: 'Apakah goodie bag bisa dicustom dengan logo dan motif?', a: 'Bisa. Spunbond, paperbag, dan coolerbag dapat disesuaikan ukuran, motif, dan logo brand kamu, termasuk untuk private label.', image: null },
    { q: 'Bagaimana cara memesan?', a: 'Pilih produk, klik tombol WhatsApp, lalu tim kami membantu cek stok, harga, dan detail custom sampai pesanan disepakati.', image: null },
    { q: 'Bagaimana metode pembayarannya?', a: PAYMENT_TOKEN, image: null },
  ],
  image: null,
};

export const defaultSections = (): PageSections => structuredClone({ howto: DEFAULT_HOWTO, custom: DEFAULT_CUSTOM, faq: DEFAULT_FAQ });

/* ---------------- normalisasi ---------------- */

const obj = (v: unknown): Record<string, unknown> | null => (v && typeof v === 'object' && !Array.isArray(v) ? (v as Record<string, unknown>) : null);
const str = (v: unknown, max: number) => (typeof v === 'string' ? v.trim().slice(0, max) : '');
/** Untuk teks panjang: jangan di-trim di tengah, hanya batasi panjang. */
const long = (v: unknown, max: number) => (typeof v === 'string' ? v.replace(/\r\n/g, '\n').slice(0, max).trim() : '');
const pick = <T extends string>(v: unknown, allowed: readonly T[], fallback: T): T => (typeof v === 'string' && (allowed as readonly string[]).includes(v) ? (v as T) : fallback);
const bool = (v: unknown, fallback: boolean) => (typeof v === 'boolean' ? v : fallback);

export function normalizeImage(raw: unknown): SectionImage | null {
  const o = obj(raw);
  if (!o) return null;
  const url = typeof o.url === 'string' ? safeUrl(o.url.trim()) : '';
  if (!url) return null;
  return {
    url,
    alt: str(o.alt, 160),
    pos: pick(o.pos, ['top', 'bottom', 'left', 'right'] as const, 'top'),
    size: pick(o.size, ['sm', 'md', 'lg', 'full'] as const, 'md'),
    ratio: pick(o.ratio, ['auto', '1:1', '4:3', '16:9', '3:4'] as const, '4:3'),
    fit: pick(o.fit, ['cover', 'contain'] as const, 'cover'),
  };
}

const keepImage = normalizeImage;

function list<T>(raw: unknown, fallback: T[], max: number, map: (x: unknown) => T | null): T[] {
  if (!Array.isArray(raw)) return fallback;
  return raw.slice(0, max).map(map).filter((x): x is T => x !== null);
}

export function normalizeHowto(raw: unknown): HowSection {
  const o = obj(raw);
  if (!o) return structuredClone(DEFAULT_HOWTO);
  const cols = Number(o.columns);
  return {
    enabled: bool(o.enabled, true),
    title: str(o.title, 140),
    subtitle: long(o.subtitle, 400),
    columns: cols === 1 || cols === 3 ? cols : 2,
    cards: list(o.cards, DEFAULT_HOWTO.cards, LIMITS.cards, x => {
      const c = obj(x);
      if (!c) return null;
      const label = str(c.link_label, 32);
      const url = c.link_url ? normalizeNavUrl(c.link_url) : '';
      return {
        icon: pick(c.icon, ICONS, 'none'),
        title: str(c.title, 80),
        text: long(c.text, 500),
        link_label: label && url ? label : '',
        link_url: label && url ? url : '',
        image: keepImage(c.image),
      };
    }).filter(c => c.title || c.text || c.image),
    image: keepImage(o.image),
  };
}

export function normalizeCustom(raw: unknown): CustomSection {
  const o = obj(raw);
  if (!o) return structuredClone(DEFAULT_CUSTOM);
  const cols = Number(o.columns);
  return {
    enabled: bool(o.enabled, true),
    title: str(o.title, 140),
    text: long(o.text, 700),
    checks: list<string>(o.checks, DEFAULT_CUSTOM.checks, LIMITS.checks, x => { const s = str(x, 40); return s || null; }),
    columns: cols === 2 || cols === 3 ? cols : 4,
    steps: list(o.steps, DEFAULT_CUSTOM.steps, LIMITS.steps, x => {
      const s = obj(x);
      if (!s) return null;
      return { title: str(s.title, 80), text: long(s.text, 400), image: keepImage(s.image) };
    }).filter(s => s.title || s.text || s.image),
    image: keepImage(o.image),
  };
}

export function normalizeFaq(raw: unknown): FaqSection {
  const o = obj(raw);
  if (!o) return structuredClone(DEFAULT_FAQ);
  return {
    enabled: bool(o.enabled, true),
    title: str(o.title, 140),
    subtitle: long(o.subtitle, 400),
    open_first: bool(o.open_first, false),
    items: list(o.items, DEFAULT_FAQ.items, LIMITS.faq, x => {
      const f = obj(x);
      if (!f) return null;
      return { q: str(f.q, 200), a: long(f.a, 3000), image: keepImage(f.image) };
    }).filter(f => f.q && (f.a || f.image)),
    image: keepImage(o.image),
  };
}

export function normalizeSections(raw: unknown): PageSections {
  const o = obj(raw) ?? {};
  return { howto: normalizeHowto(o.howto), custom: normalizeCustom(o.custom), faq: normalizeFaq(o.faq) };
}

/** Ganti token {{payment_info}} di teks FAQ. */
export const fillTokens = (text: string, s: Pick<SiteSettings, 'payment_info'>) => text.split(PAYMENT_TOKEN).join(s.payment_info || '');
