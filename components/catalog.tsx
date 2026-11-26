'use client';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ArrowUpDown, MessageCircle, Search, SlidersHorizontal, X } from 'lucide-react';
import { THEMES, type CardProduct } from '@/lib/catalog';
import { money } from '@/lib/format';
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

type Band = { key: string; label: string; n: number; test: (price: number) => boolean };
const round500 = (n: number) => Math.round(n / 500) * 500;
const num = (n: number) => n.toLocaleString('id-ID');

/** Ilustrasi keadaan kosong (sama dengan EmptyArt di site-chrome; disalin supaya kerangka toko tidak ikut ke bundle browser). */
function EmptyBag() {
  return (
    <svg className="empty-art" viewBox="0 0 120 120" width="120" height="120" fill="none" aria-hidden="true" focusable="false">
      <ellipse cx="60" cy="108" rx="34" ry="4" fill="var(--surface-3)" />
      <path d="M42 46V36a18 18 0 0 1 36 0v10" stroke="var(--brand)" strokeWidth="3.5" strokeLinecap="round" />
      <path d="M27 44h66a5 5 0 0 1 5 4.5l4.4 50A9 9 0 0 1 93.4 108H26.6a9 9 0 0 1-9-9.5l4.4-50a5 5 0 0 1 5-4.5Z" fill="var(--surface)" stroke="var(--line-strong)" strokeWidth="2.5" strokeLinejoin="round" />
      <circle cx="42" cy="80" r="4.5" fill="var(--sun)" />
      <circle cx="60" cy="84" r="4.5" fill="var(--sun)" />
      <circle cx="78" cy="80" r="4.5" fill="var(--sun)" />
    </svg>
  );
}

/**
 * Katalog dengan pencarian, filter harga/motif/stok, dan urutan.
 * - `lockCategory` dipakai halaman kategori (produk sudah dikunci ke satu kategori).
 * - Pindah kategori dilakukan lewat tab di atas katalog; `?kategori=` di alamat halaman tetap didukung dan tampil sebagai chip.
 * - Pencarian dari header masuk lewat `?q=`.
 * - Di layar kecil, filter tampil sebagai lembar bawah (Esc atau ketuk area gelap untuk menutup).
 * - `waHref` (opsional): link WhatsApp untuk keadaan "tidak ada hasil".
 */
export default function Catalog({ products, lockCategory, waHref }: { products: CardProduct[]; lockCategory?: string; waHref?: string }) {
  const [q, setQ] = useState('');
  const [cat, setCat] = useState(lockCategory ?? 'Semua');
  const [theme, setTheme] = useState('semua');
  const [price, setPrice] = useState('semua');
  const [ready, setReady] = useState(false);
  const [sort, setSort] = useState<SortKey>('unggulan');
  const [limit, setLimit] = useState(PAGE);
  const [open, setOpen] = useState(false);
  const toggleBtn = useRef<HTMLButtonElement>(null);
  const closeBtn = useRef<HTMLButtonElement>(null);
  const sheet = useRef<HTMLElement>(null);

  // Baca ?q= dan ?kategori= sekali saat halaman dibuka (halaman tetap statis & cepat)
  useEffect(() => {
    const sp = new URLSearchParams(location.search);
    const q0 = sp.get('q'); if (q0) setQ(q0.slice(0, 60));
    const c0 = sp.get('kategori'); if (!lockCategory && c0) setCat(c0);
  }, [lockCategory]);

  // Layar kecil: tab kategori bisa lebih lebar dari layar. Geser barisnya (bukan halamannya) supaya tab aktif terlihat.
  useEffect(() => {
    const cur = document.querySelector<HTMLElement>('.catpage .tabs [aria-current="page"]');
    const bar = cur?.parentElement;
    if (!cur || !bar || bar.scrollWidth <= bar.clientWidth) return;
    bar.scrollLeft += cur.getBoundingClientRect().left - bar.getBoundingClientRect().left - (bar.clientWidth - cur.offsetWidth) / 2;
  }, []);

  const base = useMemo(() => (lockCategory ? products.filter(p => p.category === lockCategory) : products), [products, lockCategory]);
  const themes = useMemo(() => [
    ...THEMES.filter(t => base.some(p => p.theme === t.key)).map(t => ({ key: t.key, label: t.label })),
    ...(base.some(p => p.theme === 'lainnya') ? [{ key: 'lainnya', label: 'Motif lainnya' }] : []),
  ], [base]);

  // Tiga rentang harga dihitung dari data: batasnya sepertiga dan dua pertiga harga, dibulatkan ke Rp 500.
  const bands = useMemo<Band[]>(() => {
    const prices = base.map(p => p.price).filter(n => n > 0).sort((a, b) => a - b);
    if (prices.length < 6) return [];
    const lo = round500(prices[Math.floor(prices.length / 3)]);
    const hi = round500(prices[Math.floor((prices.length * 2) / 3)]);
    if (!(lo < hi)) return [];
    const list: Omit<Band, 'n'>[] = [
      { key: 'rendah', label: `Di bawah ${money(lo)}`, test: n => n < lo },
      { key: 'tengah', label: `${money(lo)} sampai ${money(hi)}`, test: n => n >= lo && n <= hi },
      { key: 'atas', label: `Di atas ${money(hi)}`, test: n => n > hi },
    ];
    const counted = list.map(b => ({ ...b, n: base.filter(p => p.price > 0 && b.test(p.price)).length })).filter(b => b.n > 0);
    return counted.length > 1 ? counted : [];
  }, [base]);
  const band = bands.find(b => b.key === price);

  const shown = useMemo(() => {
    const words = q.toLowerCase().split(/\s+/).filter(Boolean);
    const list = base.filter(p =>
      (lockCategory || cat === 'Semua' || p.category === cat)
      && (theme === 'semua' || p.theme === theme)
      && (!band || (p.price > 0 && band.test(p.price)))
      && (!ready || (p.price > 0 && !p.soldOut))
      && words.every(w => `${p.name} ${p.sku} ${p.category} ${p.size}`.toLowerCase().includes(w)));
    const priced = (p: CardProduct) => (p.price > 0 ? p.price : Infinity);
    switch (sort) {
      case 'murah': return [...list].sort((a, b) => priced(a) - priced(b));
      case 'mahal': return [...list].sort((a, b) => b.price - a.price);
      case 'nama': return [...list].sort((a, b) => a.name.localeCompare(b.name, 'id'));
      case 'stok': return [...list].sort((a, b) => b.stock - a.stock);
      // Unggulan: urutan dari admin, produk yang stoknya habis didorong ke akhir
      default: return [...list].sort((a, b) => (Number(a.soldOut) - Number(b.soldOut)) || (a.order - b.order));
    }
  }, [base, q, cat, theme, band, ready, sort, lockCategory]);

  useEffect(() => setLimit(PAGE), [q, cat, theme, price, ready, sort]);

  const reset = () => { setQ(''); setCat(lockCategory ?? 'Semua'); setTheme('semua'); setPrice('semua'); setReady(false); };
  const applied = [
    ...(q ? [{ key: 'q', label: `“${q}”`, clear: () => setQ('') }] : []),
    ...(!lockCategory && cat !== 'Semua' ? [{ key: 'kategori', label: cat, clear: () => setCat('Semua') }] : []),
    ...(band ? [{ key: 'harga', label: band.label, clear: () => setPrice('semua') }] : []),
    ...(theme !== 'semua' ? [{ key: 'motif', label: themes.find(t => t.key === theme)?.label ?? theme, clear: () => setTheme('semua') }] : []),
    ...(ready ? [{ key: 'ready', label: 'Ready stock', clear: () => setReady(false) }] : []),
  ];
  const active = applied.length;

  // Lembar filter (layar kecil): kunci gulir, Esc menutup, fokus dijaga di dalam lembar dan kembali ke tombol Filter.
  const closeSheet = useCallback(() => { setOpen(false); toggleBtn.current?.focus(); }, []);
  useEffect(() => {
    if (!open) return;
    const root = document.documentElement;
    const prevOverflow = root.style.overflow;
    root.style.overflow = 'hidden';
    closeBtn.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { closeSheet(); return; }
      if (e.key !== 'Tab' || !sheet.current) return;
      const items = sheet.current.querySelectorAll<HTMLElement>('button:not([disabled]),input,a[href]');
      if (!items.length) return;
      const first = items[0], last = items[items.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    };
    const desktop = window.matchMedia('(min-width:900px)');
    const onResize = () => { if (desktop.matches) setOpen(false); };
    document.addEventListener('keydown', onKey);
    desktop.addEventListener('change', onResize);
    return () => {
      root.style.overflow = prevOverflow;
      document.removeEventListener('keydown', onKey);
      desktop.removeEventListener('change', onResize);
    };
  }, [open, closeSheet]);

  const total = shown.length;
  const visible = Math.min(limit, total);
  const next = Math.min(PAGE, total - visible);

  return (
    <div className="cat-wrap">
      <div className="cat-bar">
        <label className="cat-search">
          <Search size={18} aria-hidden="true" />
          <input type="search" value={q} onChange={e => setQ(e.target.value.slice(0, 60))} placeholder="Cari nama atau SKU" aria-label="Cari produk" enterKeyHint="search" />
          {q && <button type="button" onClick={() => setQ('')} aria-label="Hapus pencarian"><X size={16} aria-hidden="true" /></button>}
        </label>

        <div className="cat-status">
          <p className="cat-count" role="status">{num(total)} produk</p>
          {applied.map(f => (
            <button key={f.key} type="button" className="chip chip-x" onClick={f.clear} aria-label={`Hapus filter ${f.label}`}>
              <span>{f.label}</span><X size={14} aria-hidden="true" />
            </button>
          ))}
          {active > 1 && <button type="button" className="linkbtn cat-clear" onClick={reset}>Hapus semua</button>}
        </div>

        <div className="cat-tools">
          <button ref={toggleBtn} type="button" className="btn btn-outline btn-sm cat-toggle" onClick={() => setOpen(true)} aria-haspopup="dialog" aria-expanded={open} aria-controls="cat-filter">
            <SlidersHorizontal size={16} aria-hidden="true" /> Filter{active > 0 && <em>{active}<span className="vh"> aktif</span></em>}
          </button>
          <label className="cat-sort">
            <span>Urutkan</span>
            <ArrowUpDown size={16} aria-hidden="true" />
            <select value={sort} onChange={e => setSort(e.target.value as SortKey)}>{SORTS.map(s => <option key={s.key} value={s.key}>{s.label}</option>)}</select>
          </label>
        </div>
      </div>

      <div className="cat-layout">
        {open && <div className="cat-overlay" aria-hidden="true" onClick={closeSheet} />}
        <aside id="cat-filter" ref={sheet} className={open ? 'cat-side open' : 'cat-side'} role={open ? 'dialog' : undefined} aria-modal={open ? true : undefined} aria-label="Filter produk">
          <div className="cat-sheet-head">
            <h2>Filter</h2>
            <button ref={closeBtn} type="button" className="btn btn-icon btn-icon--bare" onClick={closeSheet} aria-label="Tutup filter"><X size={20} aria-hidden="true" /></button>
          </div>
          <div className="cat-sheet-body">
            {bands.length > 0 && (
              <fieldset>
                <legend>Harga per pcs</legend>
                <button type="button" className={price === 'semua' ? 'on' : ''} aria-pressed={price === 'semua'} onClick={() => setPrice('semua')}><span>Semua harga</span></button>
                {bands.map(b => (
                  <button key={b.key} type="button" className={price === b.key ? 'on' : ''} aria-pressed={price === b.key} onClick={() => setPrice(b.key)}>
                    <span>{b.label}</span><small>{num(b.n)}</small>
                  </button>
                ))}
              </fieldset>
            )}
            {themes.length > 1 && (
              <fieldset>
                <legend>Motif</legend>
                <button type="button" className={theme === 'semua' ? 'on' : ''} aria-pressed={theme === 'semua'} onClick={() => setTheme('semua')}><span>Semua motif</span></button>
                {themes.map(t => (
                  <button key={t.key} type="button" className={theme === t.key ? 'on' : ''} aria-pressed={theme === t.key} onClick={() => setTheme(t.key)}>
                    <span>{t.label}</span><small>{num(base.filter(p => p.theme === t.key).length)}</small>
                  </button>
                ))}
              </fieldset>
            )}
            <fieldset>
              <legend>Ketersediaan</legend>
              <label className="cat-check"><input type="checkbox" checked={ready} onChange={e => setReady(e.target.checked)} /> Ready stock saja</label>
            </fieldset>
            {active > 0 && <button type="button" className="linkbtn danger cat-reset" onClick={reset}><X size={14} aria-hidden="true" /> Hapus semua filter</button>}
          </div>
          <div className="cat-sheet-foot">
            <button type="button" className="btn btn-primary btn-block" onClick={closeSheet}>Tampilkan {num(total)} produk</button>
          </div>
        </aside>

        <div className="cat-main">
          {total ? (
            <>
              <div className="pgrid">{shown.slice(0, limit).map((p, i) => <ProductCard key={p.id} p={p} priority={i === 0 ? 'high' : i < 4} />)}</div>
              {total > PAGE && (
                <div className="cat-more">
                  <p>Menampilkan {num(visible)} dari {num(total)} produk</p>
                  <div className="cat-progress" aria-hidden="true"><i style={{ transform: `scaleX(${visible / total})` }} /></div>
                  {next > 0 && <button type="button" className="btn btn-outline" onClick={() => setLimit(l => l + PAGE)}>Tampilkan {num(next)} lagi</button>}
                </div>
              )}
            </>
          ) : (
            <div className="emptystate">
              <EmptyBag />
              <h2>Belum ada produk yang cocok</h2>
              <p>Coba kata kunci lain atau kurangi filter.</p>
              <div className="btnrow">
                <button type="button" className="btn btn-outline" onClick={reset}>Hapus semua filter</button>
                {waHref && <a className="btn btn-wa-outline" href={waHref} target="_blank" rel="noopener noreferrer"><MessageCircle size={18} aria-hidden="true" /> Tanya stok atau custom via WhatsApp</a>}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
