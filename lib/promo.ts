import type { PromoPopup } from '@/lib/types';
import { safeUrl } from '@/lib/safe';
import { normalizeNavUrl } from '@/lib/nav';

export const DEFAULT_PROMO: PromoPopup = { enabled: false, image_url: '', title: '', text: '', button_label: '', button_url: '' };

const str = (v: unknown, max: number) => (typeof v === 'string' ? v.trim().slice(0, max) : '');

/** Rapikan data mentah (DB / form admin) jadi popup yang aman dirender. */
export function normalizePromo(raw: unknown): PromoPopup {
  if (!raw || typeof raw !== 'object') return DEFAULT_PROMO;
  const o = raw as Record<string, unknown>;
  const label = str(o.button_label, 24);
  const url = normalizeNavUrl(o.button_url);
  return {
    enabled: o.enabled === true,
    image_url: typeof o.image_url === 'string' ? safeUrl(o.image_url.trim()) : '',
    title: str(o.title, 80),
    text: str(o.text, 500),
    button_label: label && url ? label : '',
    button_url: label && url ? url : '',
  };
}

export const promoHasContent = (p: PromoPopup) => !!(p.image_url || p.title || p.text);

/** Kunci pendek dari isi popup: kalau admin mengubah isinya, popup muncul lagi walau pengunjung pernah menutup yang lama. */
export function promoKey(p: PromoPopup) {
  const src = [p.image_url, p.title, p.text, p.button_label, p.button_url].join('|');
  let h = 0;
  for (let i = 0; i < src.length; i++) h = (h * 31 + src.charCodeAt(i)) | 0;
  return String(h >>> 0);
}
