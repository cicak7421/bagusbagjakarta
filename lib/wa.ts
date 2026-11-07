import type { Product, SiteSettings, VariantOption } from '@/lib/types';
import { money } from '@/lib/format';

export { money };

export type WaSelection = {
  color?: VariantOption | null;
  motif?: VariantOption | null;
  size?: VariantOption | null;
  qty?: number;
  unit?: number;
  /** 'notify' = permintaan "ingatkan saya" saat stok habis */
  intent?: 'order' | 'notify' | 'custom';
};

const clean = (s: string) => s.replace(/[\r\n]+/g, ' ').slice(0, 120);

export function waLink(s: SiteSettings, p?: Product, sel: WaSelection = {}) {
  let text = s.whatsapp_message;
  if (p) {
    const lines: string[] = [];
    if (sel.intent === 'notify') lines.push(`Halo ${s.company_name}, tolong kabari saya kalau ${p.name} (${p.category}) sudah ready lagi.`);
    else if (sel.intent === 'custom') lines.push(`Halo ${s.company_name}, saya mau tanya produksi custom / pre-order untuk ${p.name} (${p.category}).`);
    else lines.push(`Halo ${s.company_name}, saya tertarik dengan ${p.name} (${p.category}).`);
    lines.push(`Ukuran: ${clean(sel.size?.name || p.size)}`);
    if (sel.color) lines.push(`Warna: ${clean(sel.color.name)}`);
    if (sel.motif) lines.push(`Motif: ${clean(sel.motif.name)}`);
    const qty = sel.qty ?? p.min_order;
    lines.push(`Jumlah: ${qty} pcs`);
    if (sel.unit && sel.intent !== 'notify') lines.push(`Estimasi: ${money(sel.unit)}/pcs (total ${money(sel.unit * qty)})`);
    lines.push(sel.intent === 'notify' ? 'Terima kasih!' : 'Mohon info harga final dan opsi custom-nya ya.');
    text = lines.join('\n');
  }
  return `https://wa.me/${s.whatsapp_number.replace(/\D/g, '')}?text=${encodeURIComponent(text)}`;
}
