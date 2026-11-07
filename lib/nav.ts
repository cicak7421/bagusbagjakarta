import type { NavLink, SiteSettings } from '@/lib/types';
import { safeUrl } from '@/lib/safe';

export const MAX_NAV_LINKS = 8;

/** Menu bawaan (dipakai kalau admin belum mengatur menu). */
export const DEFAULT_NAV_LINKS: NavLink[] = [
  { label: 'Produk', url: '/#produk' },
  { label: 'Custom', url: '/#custom' },
  { label: 'Tentang', url: '/#about' },
  { label: 'FAQ', url: '/#faq' },
  { label: 'Blog', url: '/blog' },
  { label: 'Kontak', url: '/#kontak' },
];

/**
 * Rapikan input URL dari admin.
 *  "#faq" → "/#faq", "/blog/x" tetap, "https://…" tetap, "wa.me/62…" → "https://wa.me/62…".
 * Mengembalikan '' kalau tidak valid / berbahaya (javascript:, data:, dll).
 */
export function normalizeNavUrl(input: unknown): string {
  if (typeof input !== 'string') return '';
  const v = input.trim();
  if (!v) return '';
  if (v.startsWith('#')) return v.length > 1 ? `/${v}` : '';
  if (/^[a-z][a-z0-9+.-]*:/i.test(v)) return safeUrl(v);          // punya skema → hanya http(s) yang lolos
  if (v.startsWith('/')) return safeUrl(v);                        // path internal
  if (/^[^\s/]+\.[^\s/]+/.test(v)) return safeUrl(`https://${v}`); // "domain.com/…" tanpa skema
  return '';
}

/** Ubah data mentah (DB / admin) jadi daftar menu yang aman dirender. */
export function normalizeNavLinks(raw: unknown): NavLink[] {
  if (!Array.isArray(raw)) return DEFAULT_NAV_LINKS;
  return raw
    .map((x): NavLink | null => {
      if (!x || typeof x !== 'object') return null;
      const o = x as Record<string, unknown>;
      const label = typeof o.label === 'string' ? o.label.trim().slice(0, 24) : '';
      const url = normalizeNavUrl(o.url);
      return label && url ? { label, url, new_tab: o.new_tab === true } : null;
    })
    .filter((x): x is NavLink => x !== null)
    .slice(0, MAX_NAV_LINKS);
}

export const getNavLinks = (s: Pick<SiteSettings, 'nav_links'>) => normalizeNavLinks(s.nav_links);

/** Atribut <a>: buka di tab baru kalau diminta (atau link luar yang diminta tab baru). */
export const navAnchorProps = (l: NavLink) =>
  l.new_tab ? { target: '_blank', rel: 'noopener noreferrer' } : {};
