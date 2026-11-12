import type { VariantOption } from '@/lib/types';
import { safeUrl } from '@/lib/safe';
import { swatchStyle } from '@/lib/variants';

/**
 * Lingkaran/kotak kecil berisi warna, pola CSS, atau foto motif.
 * preferImage: untuk motif, foto (kalau ada) dipakai sebagai swatch; untuk warna, hex yang dipakai.
 */
export function Swatch({ option, shape = 'round', preferImage = false }: { option: VariantOption; shape?: 'round' | 'square'; preferImage?: boolean }) {
  const img = safeUrl(option.image_url);
  const hasCss = !!(option.hex || option.pattern);
  const showImg = !!img && (preferImage || !hasCss);
  return (
    <span className={`swatch ${shape}`} style={showImg ? undefined : swatchStyle(option)} aria-hidden="true">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      {showImg && <img src={img} alt="" loading="lazy" decoding="async" />}
    </span>
  );
}
