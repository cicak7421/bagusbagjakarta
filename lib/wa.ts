import type { Product, SiteSettings } from '@/lib/types';
export const money = (n: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(n);
export function waLink(s: SiteSettings, p?: Product) {
  const text = p
    ? `Halo Tre Joy Ease, saya tertarik dengan ${p.name} (${p.category}).\nUkuran: ${p.size}\nJumlah: ${p.min_order}+ pcs\nMohon info harga dan opsi custom-nya ya.`
    : s.whatsapp_message;
  return `https://wa.me/${s.whatsapp_number.replace(/\D/g, '')}?text=${encodeURIComponent(text)}`;
}
