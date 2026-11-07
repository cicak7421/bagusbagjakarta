'use client';
import { useState, type ReactNode } from 'react';
import { ChevronDown, ChevronUp, ExternalLink, Image as ImageIcon, Plus, RotateCcw, Save, Trash2, Upload } from 'lucide-react';
import { MediaLayout, SectionIcon } from '@/components/page-sections';
import {
  DEFAULT_CUSTOM, DEFAULT_FAQ, DEFAULT_HOWTO, ICONS, ICON_LABELS, IMG_FITS, IMG_POSITIONS, IMG_RATIOS, IMG_SIZES, LIMITS, PAYMENT_TOKEN,
  defaultImage,
  type CustomSection, type FaqSection, type HowSection, type IconKey, type ImgPos, type PageSections, type SectionImage,
} from '@/lib/sections';
import { safeUrl } from '@/lib/safe';
import { normalizeNavUrl } from '@/lib/nav';

type Upload = (file: File) => Promise<string>;
const swap = <T,>(a: T[], i: number, j: number) => { if (j < 0 || j >= a.length) return a; const n = [...a]; [n[i], n[j]] = [n[j], n[i]]; return n; };
const setAt = <T,>(a: T[], i: number, d: Partial<T>) => a.map((x, j) => (j === i ? { ...x, ...d } : x));

/* ------------------------------------------------------------------ */
/* Validasi sebelum simpan: pesan error yang jelas, bukan data hilang diam-diam */
export function validateSections(s: PageSections): string | null {
  const imgs: [string, SectionImage | null][] = [
    ['Cara Pesan — foto section', s.howto.image], ['Custom — foto section', s.custom.image], ['FAQ — foto section', s.faq.image],
    ...s.howto.cards.map((c, i): [string, SectionImage | null] => [`Cara Pesan — kartu ${i + 1}`, c.image]),
    ...s.custom.steps.map((c, i): [string, SectionImage | null] => [`Custom — langkah ${i + 1}`, c.image]),
    ...s.faq.items.map((c, i): [string, SectionImage | null] => [`FAQ — pertanyaan ${i + 1}`, c.image]),
  ];
  for (const [where, im] of imgs) if (im && im.url.trim() && !safeUrl(im.url.trim())) return `${where}: link foto tidak valid. Upload foto atau pakai link https://…`;
  for (const [i, c] of s.howto.cards.entries()) {
    const label = c.link_label.trim(); const url = c.link_url.trim();
    if (!label && !url) continue;
    if (!label) return `Cara Pesan — kartu ${i + 1}: isi teks tautan, atau kosongkan link-nya.`;
    if (!url) return `Cara Pesan — kartu ${i + 1}: isi link tujuan, atau kosongkan teks tautannya.`;
    if (!normalizeNavUrl(url)) return `Cara Pesan — kartu ${i + 1}: link tidak valid. Pakai /#produk, /blog/nama-artikel, atau https://…`;
  }
  for (const [i, f] of s.faq.items.entries()) {
    const q = f.q.trim(); const a = f.a.trim() || f.image?.url.trim();
    if (!q && !a) continue;
    if (!q) return `FAQ — pertanyaan ${i + 1}: pertanyaan belum diisi.`;
    if (!a) return `FAQ — pertanyaan "${q.slice(0, 40)}": jawaban belum diisi.`;
  }
  return null;
}

/* ------------------------------------------------------------------ */
function PosIcon({ pos }: { pos: ImgPos }) {
  const r = { top: [3, 3, 22, 8], bottom: [3, 13, 22, 8], left: [3, 3, 9, 18], right: [16, 3, 9, 18] }[pos];
  return (
    <svg width="28" height="24" viewBox="0 0 28 24" aria-hidden="true">
      <rect x=".75" y=".75" width="26.5" height="22.5" rx="4" fill="none" stroke="currentColor" strokeWidth="1.5" opacity=".45" />
      <rect x={r[0]} y={r[1]} width={r[2]} height={r[3]} rx="2" fill="currentColor" />
    </svg>
  );
}

function Seg<T extends string>({ label, value, options, onChange, icon }: { label: string; value: T; options: { key: T; label: string }[]; onChange: (v: T) => void; icon?: (k: T) => ReactNode }) {
  return (
    <div className="seg">
      <span className="seglabel">{label}</span>
      <div className="segbtns" role="group" aria-label={label}>
        {options.map(o => <button key={o.key} type="button" className={o.key === value ? 'on' : ''} aria-pressed={o.key === value} onClick={() => onChange(o.key)}>{icon?.(o.key)}<span>{o.label}</span></button>)}
      </div>
    </div>
  );
}

/** Foto + semua pengaturan tata letaknya + pratinjau langsung (memakai komponen yang sama dengan website). */
function ImageField({ label, hint, value, onChange, upload, body, center }: {
  label: string; hint?: string; value: SectionImage | null; onChange: (v: SectionImage | null) => void; upload: Upload; body: ReactNode; center?: boolean;
}) {
  const [busy, setBusy] = useState(false);
  const set = (d: Partial<SectionImage>) => onChange({ ...(value ?? defaultImage()), ...d });
  const pick = async (f?: File) => {
    if (!f) return;
    setBusy(true);
    try { const u = await upload(f); if (u) set({ url: u }); } finally { setBusy(false); }
  };
  const safe = value ? safeUrl(value.url) : '';
  return (
    <div className="imgfield">
      <div className="imgfield-title"><b>{label}</b>{hint && <small>{hint}</small>}</div>
      <div className="imgfield-row">
        <div className="imgfield-thumb">{safe ? /* eslint-disable-next-line @next/next/no-img-element */ <img src={safe} alt="" /> : <ImageIcon size={22} />}</div>
        <div className="imgfield-actions">
          <label className="upload wide">{busy ? <span className="spin" /> : <Upload size={15} />} {value?.url ? 'Ganti foto' : 'Upload foto'}
            <input type="file" accept="image/jpeg,image/png,image/webp,image/gif,image/avif" disabled={busy} onChange={e => { const f = e.target.files?.[0]; e.target.value = ''; pick(f); }} />
          </label>
          {value && <button type="button" className="navadd" onClick={() => onChange(null)}><Trash2 size={14} /> Hapus foto</button>}
        </div>
      </div>
      {value && (
        <div className="imgfield-opts">
          <label className="sf">Atau tempel link gambar<input type="text" inputMode="url" placeholder="https://…" value={value.url} onChange={e => set({ url: e.target.value })} /></label>
          <label className="sf">Deskripsi foto (opsional, untuk SEO & pembaca layar)<input type="text" maxLength={160} value={value.alt} onChange={e => set({ alt: e.target.value })} /></label>
          <Seg label="Posisi foto" value={value.pos} options={IMG_POSITIONS} onChange={pos => set({ pos })} icon={k => <PosIcon pos={k} />} />
          <Seg label="Ukuran foto" value={value.size} options={IMG_SIZES} onChange={size => set({ size })} />
          <div className="sf2">
            <label className="sf">Bentuk bingkai<select value={value.ratio} onChange={e => set({ ratio: e.target.value as SectionImage['ratio'] })}>{IMG_RATIOS.map(o => <option key={o.key} value={o.key}>{o.label}</option>)}</select></label>
            <label className="sf">Isi bingkai<select value={value.fit} onChange={e => set({ fit: e.target.value as SectionImage['fit'] })}>{IMG_FITS.map(o => <option key={o.key} value={o.key}>{o.label}</option>)}</select></label>
          </div>
          {safe ? (
            <div className="imgpreview">
              <small>Pratinjau tata letak. Di layar sempit (HP), posisi kiri/kanan otomatis menjadi atas/bawah.</small>
              <div className="imgpreview-box"><MediaLayout image={{ ...value, url: safe }} align={center ? 'center' : 'start'}>{body}</MediaLayout></div>
            </div>
          ) : <p className="hint">Upload foto atau tempel link untuk melihat pratinjau.</p>}
        </div>
      )}
    </div>
  );
}

/** Satu item daftar yang bisa dibuka-tutup, digeser, dan dihapus. */
function ItemShell({ n, title, open, onToggle, onMove, onRemove, last, children }: {
  n: number; title: string; open: boolean; onToggle: (o: boolean) => void; onMove: (d: -1 | 1) => void; onRemove: () => void; last: boolean; children: ReactNode;
}) {
  return (
    <details className="sitem" open={open} onToggle={e => { const o = (e.currentTarget as HTMLDetailsElement).open; if (o !== open) onToggle(o); }}>
      <summary>
        <span className="sitem-n">{n}</span>
        <span className="sitem-t">{title || <em>(belum diisi)</em>}</span>
        <span className="sitem-btns" onClick={e => e.preventDefault()}>
          <button type="button" aria-label="Naikkan" disabled={n === 1} onClick={() => onMove(-1)}><ChevronUp size={15} /></button>
          <button type="button" aria-label="Turunkan" disabled={last} onClick={() => onMove(1)}><ChevronDown size={15} /></button>
          <button type="button" className="danger" aria-label="Hapus" onClick={onRemove}><Trash2 size={14} /></button>
        </span>
      </summary>
      <div className="sitem-body">{children}</div>
    </details>
  );
}

const Enabled = ({ value, onChange, what }: { value: boolean; onChange: (v: boolean) => void; what: string }) => (
  <label className="check sec-enabled"><input type="checkbox" checked={value} onChange={e => onChange(e.target.checked)} /> Tampilkan section {what} di website</label>
);

const LINK_SUGGESTIONS = ['/#produk', '/#custom', '/#faq', '/#kontak', '/blog'];

/* ------------------------------ CARA PESAN ------------------------------ */
function HowEditor({ s, onChange, upload }: { s: HowSection; onChange: (v: HowSection) => void; upload: Upload }) {
  const [open, setOpen] = useState(0);
  const patch = (d: Partial<HowSection>) => onChange({ ...s, ...d });
  const setCards = (cards: HowSection['cards']) => patch({ cards });
  return (
    <div className="sec-editor">
      <Enabled value={s.enabled} onChange={enabled => patch({ enabled })} what="Cara Pesan" />
      <label className="sf">Judul<input type="text" maxLength={140} value={s.title} onChange={e => patch({ title: e.target.value })} /></label>
      <label className="sf">Teks pengantar<textarea rows={2} maxLength={400} value={s.subtitle} onChange={e => patch({ subtitle: e.target.value })} /></label>
      <label className="sf narrow">Kartu per baris (desktop)<select value={s.columns} onChange={e => patch({ columns: Number(e.target.value) as HowSection['columns'] })}><option value={1}>1 kartu</option><option value={2}>2 kartu</option><option value={3}>3 kartu</option></select></label>

      <h3 className="sec-h">Kartu cara pesan <small>{s.cards.length}/{LIMITS.cards}</small></h3>
      <datalist id="howlinks">{LINK_SUGGESTIONS.map(u => <option key={u} value={u} />)}</datalist>
      {s.cards.length === 0 && <p className="hint">Belum ada kartu.</p>}
      {s.cards.map((c, i) => (
        <ItemShell key={i} n={i + 1} title={c.title} open={open === i} onToggle={o => setOpen(o ? i : open === i ? -1 : open)} last={i === s.cards.length - 1}
          onMove={d => { setCards(swap(s.cards, i, i + d)); setOpen(i + d); }} onRemove={() => { setCards(s.cards.filter((_, j) => j !== i)); setOpen(-1); }}>
          <div className="sf2">
            <label className="sf">Judul kartu<input type="text" maxLength={80} value={c.title} onChange={e => setCards(setAt(s.cards, i, { title: e.target.value }))} /></label>
            <label className="sf">Ikon
              <span className="iconpick"><span className="iconprev"><SectionIcon name={c.icon} size={22} /></span>
                <select value={c.icon} onChange={e => setCards(setAt(s.cards, i, { icon: e.target.value as IconKey }))}>{ICONS.map(k => <option key={k} value={k}>{ICON_LABELS[k]}</option>)}</select></span>
            </label>
          </div>
          <label className="sf">Isi kartu<textarea rows={3} maxLength={500} value={c.text} onChange={e => setCards(setAt(s.cards, i, { text: e.target.value }))} /></label>
          <div className="sf2">
            <label className="sf">Teks tautan (opsional)<input type="text" maxLength={32} placeholder="Lihat katalog" value={c.link_label} onChange={e => setCards(setAt(s.cards, i, { link_label: e.target.value }))} /></label>
            <label className="sf">Link tujuan<input type="text" list="howlinks" placeholder="/#produk atau https://…" value={c.link_url} onChange={e => setCards(setAt(s.cards, i, { link_url: e.target.value }))} /></label>
          </div>
          <ImageField label="Foto kartu (opsional)" value={c.image} upload={upload} onChange={image => setCards(setAt(s.cards, i, { image }))}
            body={<div className="pv"><b>{c.title || 'Judul kartu'}</b><p>{c.text || 'Isi kartu…'}</p></div>} />
        </ItemShell>
      ))}
      <button type="button" className="navadd" disabled={s.cards.length >= LIMITS.cards} onClick={() => { setCards([...s.cards, { icon: 'package', title: 'Kartu baru', text: '', link_label: '', link_url: '', image: null }]); setOpen(s.cards.length); }}><Plus size={14} /> Tambah kartu</button>

      <h3 className="sec-h">Foto untuk seluruh section</h3>
      <ImageField label="Foto section (opsional)" hint="Mis. banner atau foto tim di atas / di samping kartu." value={s.image} upload={upload} onChange={image => patch({ image })} center
        body={<div className="pv center"><b>{s.title || 'Judul section'}</b><p>{s.subtitle || 'Teks pengantar…'}</p><div className="pvcards"><i /><i /></div></div>} />
    </div>
  );
}

/* -------------------------------- CUSTOM -------------------------------- */
function CustomEditor({ s, onChange, upload }: { s: CustomSection; onChange: (v: CustomSection) => void; upload: Upload }) {
  const [open, setOpen] = useState(0);
  const patch = (d: Partial<CustomSection>) => onChange({ ...s, ...d });
  const setSteps = (steps: CustomSection['steps']) => patch({ steps });
  return (
    <div className="sec-editor">
      <Enabled value={s.enabled} onChange={enabled => patch({ enabled })} what="Custom" />
      <label className="sf">Judul<input type="text" maxLength={140} value={s.title} onChange={e => patch({ title: e.target.value })} /></label>
      <label className="sf">Teks pengantar<textarea rows={3} maxLength={700} value={s.text} onChange={e => patch({ text: e.target.value })} /></label>
      <label className="sf">Poin keunggulan (satu poin per baris, maks. {LIMITS.checks})
        <textarea rows={4} value={s.checks.join('\n')} onChange={e => patch({ checks: e.target.value.split('\n').slice(0, LIMITS.checks).map(x => x.slice(0, 40)) })} placeholder={'Custom ukuran\nCustom motif\nPrivate label'} />
      </label>
      <label className="sf narrow">Langkah per baris (desktop)<select value={s.columns} onChange={e => patch({ columns: Number(e.target.value) as CustomSection['columns'] })}><option value={2}>2 langkah</option><option value={3}>3 langkah</option><option value={4}>4 langkah</option></select></label>

      <h3 className="sec-h">Langkah-langkah <small>{s.steps.length}/{LIMITS.steps}</small></h3>
      {s.steps.length === 0 && <p className="hint">Belum ada langkah.</p>}
      {s.steps.map((st, i) => (
        <ItemShell key={i} n={i + 1} title={st.title} open={open === i} onToggle={o => setOpen(o ? i : open === i ? -1 : open)} last={i === s.steps.length - 1}
          onMove={d => { setSteps(swap(s.steps, i, i + d)); setOpen(i + d); }} onRemove={() => { setSteps(s.steps.filter((_, j) => j !== i)); setOpen(-1); }}>
          <label className="sf">Judul langkah<input type="text" maxLength={80} value={st.title} onChange={e => setSteps(setAt(s.steps, i, { title: e.target.value }))} /></label>
          <label className="sf">Keterangan<textarea rows={3} maxLength={400} value={st.text} onChange={e => setSteps(setAt(s.steps, i, { text: e.target.value }))} /></label>
          <ImageField label="Foto langkah (opsional)" value={st.image} upload={upload} onChange={image => setSteps(setAt(s.steps, i, { image }))}
            body={<div className="pv"><b>{i + 1}. {st.title || 'Judul langkah'}</b><p>{st.text || 'Keterangan…'}</p></div>} />
        </ItemShell>
      ))}
      <button type="button" className="navadd" disabled={s.steps.length >= LIMITS.steps} onClick={() => { setSteps([...s.steps, { title: 'Langkah baru', text: '', image: null }]); setOpen(s.steps.length); }}><Plus size={14} /> Tambah langkah</button>

      <h3 className="sec-h">Foto untuk seluruh section</h3>
      <ImageField label="Foto section (opsional)" hint="Mis. contoh hasil custom, foto produksi, atau mockup logo." value={s.image} upload={upload} onChange={image => patch({ image })} center
        body={<div className="pv"><b>{s.title || 'Judul section'}</b><p>{s.text || 'Teks pengantar…'}</p><div className="pvcards"><i /><i /><i /></div></div>} />
    </div>
  );
}

/* --------------------------------- FAQ --------------------------------- */
function FaqEditor({ s, onChange, upload }: { s: FaqSection; onChange: (v: FaqSection) => void; upload: Upload }) {
  const [open, setOpen] = useState(-1);
  const patch = (d: Partial<FaqSection>) => onChange({ ...s, ...d });
  const setItems = (items: FaqSection['items']) => patch({ items });
  return (
    <div className="sec-editor">
      <Enabled value={s.enabled} onChange={enabled => patch({ enabled })} what="FAQ" />
      <label className="sf">Judul<input type="text" maxLength={140} value={s.title} onChange={e => patch({ title: e.target.value })} /></label>
      <label className="sf">Teks pengantar<textarea rows={2} maxLength={400} value={s.subtitle} onChange={e => patch({ subtitle: e.target.value })} /></label>
      <label className="check"><input type="checkbox" checked={s.open_first} onChange={e => patch({ open_first: e.target.checked })} /> Buka pertanyaan pertama secara otomatis</label>

      <h3 className="sec-h">Daftar pertanyaan <small>{s.items.length}/{LIMITS.faq}</small></h3>
      {s.items.length === 0 && <p className="hint">Belum ada pertanyaan.</p>}
      {s.items.map((f, i) => (
        <ItemShell key={i} n={i + 1} title={f.q} open={open === i} onToggle={o => setOpen(o ? i : open === i ? -1 : open)} last={i === s.items.length - 1}
          onMove={d => { setItems(swap(s.items, i, i + d)); setOpen(i + d); }} onRemove={() => { setItems(s.items.filter((_, j) => j !== i)); setOpen(-1); }}>
          <label className="sf">Pertanyaan<input type="text" maxLength={200} value={f.q} onChange={e => setItems(setAt(s.items, i, { q: e.target.value }))} /></label>
          <label className="sf">Jawaban
            <textarea rows={4} maxLength={3000} value={f.a} onChange={e => setItems(setAt(s.items, i, { a: e.target.value }))} />
          </label>
          <div className="tokenrow">
            <small>Enter = baris baru. Tulis <code>{PAYMENT_TOKEN}</code> untuk otomatis memakai teks &quot;payment info&quot; dari Pengaturan Website.</small>
            <button type="button" className="navadd" onClick={() => setItems(setAt(s.items, i, { a: f.a ? `${f.a}\n${PAYMENT_TOKEN}` : PAYMENT_TOKEN }))}>Sisipkan info pembayaran</button>
          </div>
          <ImageField label="Foto di dalam jawaban (opsional)" value={f.image} upload={upload} onChange={image => setItems(setAt(s.items, i, { image }))}
            body={<div className="pv"><p>{f.a || 'Jawaban…'}</p></div>} />
        </ItemShell>
      ))}
      <button type="button" className="navadd" disabled={s.items.length >= LIMITS.faq} onClick={() => { setItems([...s.items, { q: '', a: '', image: null }]); setOpen(s.items.length); }}><Plus size={14} /> Tambah pertanyaan</button>

      <h3 className="sec-h">Foto untuk seluruh section</h3>
      <ImageField label="Foto section (opsional)" hint="Mis. ilustrasi atau foto tim customer service." value={s.image} upload={upload} onChange={image => patch({ image })} center
        body={<div className="pv center"><b>{s.title || 'Judul section'}</b><p>{s.subtitle || 'Teks pengantar…'}</p><div className="pvlist"><i /><i /><i /></div></div>} />
    </div>
  );
}

/* --------------------------------- WADAH --------------------------------- */
const TABS = [
  { key: 'howto', label: 'Cara Pesan', anchor: '/#carapesan' },
  { key: 'custom', label: 'Custom', anchor: '/#custom' },
  { key: 'faq', label: 'FAQ', anchor: '/#faq' },
] as const;

export default function SectionsAdmin({ sections, onChange, upload, onSave, saving, dirty }: {
  sections: PageSections; onChange: (s: PageSections) => void; upload: Upload; onSave: () => void; saving: boolean; dirty: boolean;
}) {
  const [tab, setTab] = useState<(typeof TABS)[number]['key']>('howto');
  const cur = TABS.find(t => t.key === tab)!;
  const reset = () => {
    if (!confirm(`Kembalikan section ${cur.label} ke teks bawaan? Foto dan perubahanmu di section ini akan dihapus (baru berlaku setelah klik Simpan).`)) return;
    onChange({ ...sections, howto: tab === 'howto' ? structuredClone(DEFAULT_HOWTO) : sections.howto, custom: tab === 'custom' ? structuredClone(DEFAULT_CUSTOM) : sections.custom, faq: tab === 'faq' ? structuredClone(DEFAULT_FAQ) : sections.faq });
  };
  return (
    <div className="panel sections-admin">
      <h2>Konten Halaman</h2>
      <p className="hint">Ubah teks, tambah foto, dan atur tata letak foto untuk tiga bagian di halaman utama. Pratinjau di tiap foto memakai tampilan yang sama dengan website. Perubahan baru tampil di website setelah klik <b>Simpan perubahan</b>.</p>
      <div className="sec-tabs" role="tablist" aria-label="Pilih bagian halaman">
        {TABS.map(t => <button key={t.key} type="button" role="tab" aria-selected={tab === t.key} className={tab === t.key ? 'on' : ''} onClick={() => setTab(t.key)}>{t.label}{!sections[t.key].enabled && <em>disembunyikan</em>}</button>)}
      </div>
      {tab === 'howto' && <HowEditor s={sections.howto} upload={upload} onChange={howto => onChange({ ...sections, howto })} />}
      {tab === 'custom' && <CustomEditor s={sections.custom} upload={upload} onChange={custom => onChange({ ...sections, custom })} />}
      {tab === 'faq' && <FaqEditor s={sections.faq} upload={upload} onChange={faq => onChange({ ...sections, faq })} />}
      <div className="savebar">
        <div className="savebar-info">{dirty ? <span className="dirtytag">Belum disimpan</span> : <small>Semua perubahan tersimpan</small>}</div>
        <button type="button" className="navadd" onClick={reset}><RotateCcw size={14} /> Reset section ini</button>
        <a className="navadd" href={cur.anchor} target="_blank" rel="noopener noreferrer"><ExternalLink size={14} /> Lihat di website</a>
        <button type="button" className="primary" onClick={onSave} disabled={saving}>{saving ? <><span className="spin" /> Menyimpan…</> : <><Save size={16} /> Simpan perubahan</>}</button>
      </div>
    </div>
  );
}
