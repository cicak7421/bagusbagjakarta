'use client';
import { Plus, Trash2, Upload } from 'lucide-react';
import type { PatternKey, VariantOption } from '@/lib/types';
import { PATTERNS } from '@/lib/variants';
import { Swatch } from '@/components/swatch';

type Props = {
  kind: 'color' | 'motif' | 'size';
  items: VariantOption[];
  onChange: (next: VariantOption[]) => void;
  upload: (file: File) => Promise<string>;
};

export default function VariantEditor({ kind, items, onChange, upload }: Props) {
  const isColor = kind === 'color';
  const isSize = kind === 'size';
  const noun = isColor ? 'warna' : isSize ? 'ukuran' : 'motif';
  const patch = (i: number, d: Partial<VariantOption>) => onChange(items.map((o, j) => (j === i ? { ...o, ...d } : o)));
  const add = () => items.length < 24 && onChange([...items, isColor ? { name: 'Warna baru', hex: '#2b2b2f' } : isSize ? { name: '30 × 40 cm' } : { name: 'Motif baru', pattern: 'polos', hex: '#2f4a8a' }]);
  return (
    <div className="vedit">
      <div className="vhead"><b>Pilihan {noun}</b><button type="button" onClick={add}><Plus size={14} /> Tambah {noun}</button></div>
      {items.length === 0 && <p className="hint">Kosong — pembeli tidak melihat pilihan {noun}.</p>}
      {items.map((o, i) => (
        <div className={`vrow ${kind}`} key={i}>
          {isSize ? <span /> : <Swatch option={o} shape={isColor ? 'round' : 'square'} preferImage={!isColor} />}
          <input aria-label="Nama" placeholder={isSize ? 'mis. 30 × 40 cm' : undefined} value={o.name} maxLength={40} onChange={e => patch(i, { name: e.target.value })} />
          {!isSize && <input aria-label="Kode warna" type="color" value={o.hex || '#2b2b2f'} onChange={e => patch(i, { hex: e.target.value })} />}
          {!isColor && !isSize && (
            <select aria-label="Pola" value={o.pattern || 'polos'} onChange={e => patch(i, { pattern: e.target.value as PatternKey })}>
              {PATTERNS.map(p => <option key={p.key} value={p.key}>{p.label}</option>)}
            </select>
          )}
          <input aria-label="Stok varian (kosong = ikut stok produk)" type="number" min={0} placeholder="Stok" value={o.stock_qty ?? ''} onChange={e => patch(i, { stock_qty: e.target.value === '' ? null : Math.max(0, Math.floor(+e.target.value)) })} />
          {isSize
            ? <input aria-label="Harga per pcs untuk ukuran ini (kosong = ikut harga produk)" type="number" min={0} placeholder="Harga/pcs" value={o.price || ''} onChange={e => patch(i, { price: Math.max(0, Math.floor(+e.target.value) || 0) || null, price_add: 0 })} />
            : <input aria-label="Tambahan harga per pcs" type="number" min={0} placeholder="+Harga" value={o.price_add || ''} onChange={e => patch(i, { price_add: Math.max(0, Math.floor(+e.target.value) || 0) })} />}
          <label className={`upload${o.image_url ? ' has' : ''}`} title="Upload foto varian (tampil sebagai thumbnail & mengganti foto utama saat dipilih)">
            <Upload size={14} />
            <input type="file" accept="image/jpeg,image/png,image/webp,image/gif,image/avif" onChange={async e => { const f = e.target.files?.[0]; e.target.value = ''; if (f) { const u = await upload(f); if (u) patch(i, { image_url: u }); } }} />
          </label>
          <button type="button" className="danger" aria-label="Hapus" onClick={() => onChange(items.filter((_, j) => j !== i))}><Trash2 size={14} /></button>
          {o.image_url
            ? <small className="vimg">{/* eslint-disable-next-line @next/next/no-img-element */}<img src={o.image_url} alt="" />Foto varian terpasang — tampil di thumbnail · <button type="button" onClick={() => patch(i, { image_url: undefined })}>lepas</button></small>
            : <small className="vimg none">Belum ada foto — klik ikon upload agar varian ini punya foto & thumbnail di halaman produk.</small>}
        </div>
      ))}
    </div>
  );
}
