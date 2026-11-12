import type { SiteSettings } from '@/lib/types';

/**
 * Bangun URL embed peta (dengan titik/pin) dari pengaturan.
 * Urutan: link embed Google → koordinat di link (!3d!4d atau @lat,lng) → ?q= di link → nama /place/… → alamat.
 * Link pendek (maps.app.goo.gl / goo.gl/maps) tidak bisa dibaca tanpa membuka server Google,
 * jadi untuk itu dipakai alamat — isi alamat selengkap mungkin agar pin muncul.
 */
export function mapEmbedSrc(s: Pick<SiteSettings, 'google_maps_url' | 'address'>): string {
  const embed = (q: string) => `https://www.google.com/maps?q=${encodeURIComponent(q)}&output=embed`;
  const raw = (s.google_maps_url || '').trim();
  try {
    const u = new URL(raw);
    const host = u.hostname.replace(/^www\./, '');
    const isGoogle = host === 'google.com' || host === 'maps.google.com' || /^google\.[a-z.]+$/.test(host);
    if (isGoogle) {
      if (u.pathname.startsWith('/maps/embed')) return u.toString();
      const d = raw.match(/!3d(-?\d+(?:\.\d+)?)!4d(-?\d+(?:\.\d+)?)/);
      if (d) return embed(`${d[1]},${d[2]}`);
      const at = raw.match(/@(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)/);
      if (at) return embed(`${at[1]},${at[2]}`);
      const q = u.searchParams.get('q') || u.searchParams.get('query');
      if (q) return embed(q);
      const place = u.pathname.match(/\/maps\/place\/([^/]+)/);
      if (place) return embed(decodeURIComponent(place[1].replace(/\+/g, ' ')));
    }
  } catch { /* link kosong/tidak valid → pakai alamat */ }
  return embed(s.address);
}
