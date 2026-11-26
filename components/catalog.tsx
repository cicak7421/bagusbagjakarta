'use client';
import { useEffect, useMemo, useState } from 'react';
import { Search, SlidersHorizontal, X } from 'lucide-react';
import { THEMES, type CardProduct } from '@/lib/catalog';
import { ProductCard } from '@/components/product-card';

const PAGE = 24;
const SORTS = [
  { key: 'unggulan', label: 'Unggulan' },
  { key: 'murah', label: 'Harga terendah' },
  { key: 'mahal', label: 'Harga tertinggi' },
  { key: 'nama', label: 'Nama A-Z' },
  { key: 'stok', label: 'Stok terbanyak' },
] as const;
type SortKey = (typeof SORTS)[number]['key'];

/**
 * Katalog dengan pencarian, filter kategori/motif/stok, dan urutan.
 * `lockCategory` dipakai halaman kategori (filter kategori disembunyikan).
 * Pencarian dari header masuk lewat ?q= di alamat halaman.
 */
export default function Catalog({ products, lockCategory }: { products: CardProduct[]; lockCategory?: string }) {
  const [q, setQ] = useState('');
  const [cat, setCat] = useState(lockCategory ?? 'Semua');
  const [theme, setTheme] = useState('semua');
  const [ready, setReady] = useState(false);
  const [sort, setSort] = useState<SortKey>('unggulan');
  const [limit, setLimit] = useState(PAGE);
  const [open, setOpen] = useState(false);

  // Baca ?q= dan ?kategori= sekali saat halaman dibuka (halaman tetap statis & cepat)
  useEffect(() => {
    const sp = new URLSearchParams(location.search);
    const q0 = sp.get('q'); if (q0) setQ(q0.slice(0, 60));
    const c0 = sp.get('kategori'); if (!lockCategory && c0) setCat(c0);
  }, [lockCategory]);

  const base = useMemo(() => (lockCategory ? products.filter(p => p.category === lockCategory) : products), [products, lockCategory]);
  const cats = useMemo(() => ['Semua', ...Array.from(new Set(products.map(p => p.category)))], [products]);
  const themes = useMemo(() => THEMES.filter(t => base.some(p => p.theme === t.key)), [base]);

  const shown = useMemo(() => {
    const words = q.toLowerCase().split(/\s+/).filter(Boolean);
    const list = base.filter(p =>
      (lockCategory || cat === 'Semua' || p.category === cat)
      && (theme === 'semua' || p.theme === theme)
      && (!ready || (p.price > 0 && !p.soldOut))
      && words.every(w => `${p.name} ${p.sku} ${p.category} ${p.size}`.toLowerCase().includes(w)));
    const priced = (p: CardProduct) => (p.price > 0 ? p.price : Infinity);
    switch (sort) {
      case 'murah': return [...list].sort((a, b) => priced(a) - priced(b));
      case 'mahal': return [...list].sort((a, b) => b.price - a.price);
      case 'nama': return [...list].sort((a, b) => a.name.localeCompare(b.name, 'id'));
      case 'stok': return [...list].sort((a, b) => b.stock - a.stock);
      default: return [...list].sort((a, b) => a.order - b.order);
    }
  }, [base, q, cat, theme, ready, sort, lockCategory]);

  useEffect(() => setLimit(PAGE), [q, cat, theme, ready, sort]);
  const active = (q ? 1 : 0) + (!lockCategory && cat !== 'Semua' ? 1 : 0) + (theme !== 'semua' ? 1 : 0) + (ready ? 1 : 0);
  const reset = () => { setQ(''); setCat(lockCategory ?? 'Semua'); setTheme('semua'); setReady(false); };
  const count = (c: string) => (c === 'Semua' ? products.length : products.filter(p => p.category === c).length);

  return (
    <div className="cat-wrap">
      <div className="cat-bar">
        <label className="cat-search">
          <Search size={18} aria-hidden="true" />
          <input type="search" value={q} onChange={e => setQ(e.target.value.slice(0, 60))} placeholder="Cari nama, motif, atau kode SKU…" aria-label="Cari produk" />
          {q && <button type="button" onClick={() => setQ('')} aria-label="Hapus pencarian"><X size={16} /></button>}
        </label>
        <button type="button" className={open ? 'cat-toggle on' : 'cat-toggle'} onClick={() => setOpen(o => !o)} aria-expanded={open}>
          <SlidersHorizontal size={16} /> Filter{active > 0 && <em>{active}</em>}
        </button>
        <label className="cat-sort">
          <span>Urutkan</span>
          <select value={sort} onChange={e => setSort(e.target.value as SortKey)}>{SORTS.map(s => <option key={s.key} value={s.key}>{s.label}</option>)}</select>
        </label>
      </div>

      <div className="cat-layout">
        <aside className={open ? 'cat-side open' : 'cat-side'} aria-label="Filter produk">
          {!lockCategory && (
            <fieldset>
              <legend>Kategori</legend>
              {cats.map(c => (
                <button key={c} type="button" className={cat === c ? 'on' : ''} aria-pressed={cat === c} onClick={() => setCat(c)}>
                  <span>{c}</span><small>{count(c)}</small>
                </button>
              ))}
            </fieldset>
          )}
          <fieldset>
            <legend>Motif</legend>
            <button type="button" className={theme === 'semua' ? 'on' : ''} aria-pressed={theme === 'semua'} onClick={() => setTheme('semua')}><span>Semua motif</span></button>
            {themes.map(t => (
              <button key={t.key} type="button" className={theme === t.key ? 'on' : ''} aria-pressed={theme === t.key} onClick={() => setTheme(t.key)}>
                <span>{t.label}</span><small>{base.filter(p => p.theme === t.key).length}</small>
              </button>
            ))}
          </fieldset>
          <fieldset>
            <legend>Ketersediaan</legend>
            <label className="cat-check"><input type="checkbox" checked={ready} onChange={e => setReady(e.target.checked)} /> Ready stock saja</label>
          </fieldset>
          {active > 0 && <button type="button" className="cat-reset" onClick={reset}><X size={14} /> Hapus semua filter</button>}
        </aside>

        <div className="cat-main">
          <p className="cat-count" role="status">{shown.length.toLocaleString('id-ID')} produk{q && <> untuk “{q}”</>}</p>
          {shown.length ? (
            <>
              <div className="pgrid">{shown.slice(0, limit).map((p, i) => <ProductCard key={p.id} p={p} priority={i < 4} />)}</div>
              {shown.length > limit && <div className="cat-more"><button type="button" className="outline" onClick={() => setLimit(l => l + PAGE)}>Tampilkan lebih banyak ({(shown.length - limit).toLocaleString('id-ID')} lagi)</button></div>}
            </>
          ) : (
            <div className="empty"><p>Tidak ada produk yang cocok. Coba kata kunci lain atau hapus filter.</p><button type="button" className="outline" onClick={reset}>Hapus semua filter</button></div>
          )}
        </div>
      </div>
    </div>
  );
}
