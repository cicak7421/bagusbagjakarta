'use client';
import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { NavLink, Product, SiteSettings } from '@/lib/types';
import { LogOut, Save, Plus, Trash2, Upload, Settings, Package, Image as ImageIcon, ExternalLink, FileText, ChevronUp, ChevronDown, LayoutTemplate } from 'lucide-react';
import BlogAdmin from '@/components/blog-admin';
import VariantEditor from '@/components/variant-editor';
import { IMAGE_EXT, MAX_UPLOAD_BYTES, safeUrl, slugify, toInt } from '@/lib/safe';
import { compressImage, formatBytes } from '@/lib/compress-image';
import { demoSettings } from '@/lib/demo-settings';
import { normalizeOptions, normalizeSizes } from '@/lib/variants';
import { MAX_NAV_LINKS, normalizeNavLinks, normalizeNavUrl } from '@/lib/nav';
import { Toasts, useToasts } from '@/components/toast';
import { DEFAULT_PROMO, normalizePromo, promoHasContent } from '@/lib/promo';
import { PromoModal } from '@/components/promo-popup';
import SectionsAdmin, { validateSections } from '@/components/sections-admin';
import { defaultSections, normalizeSections, type PageSections } from '@/lib/sections';

const SITE_FIELDS = ['company_name', 'tagline', 'hero_title', 'hero_subtitle', 'address', 'google_maps_url', 'whatsapp_number', 'whatsapp_message'] as const;

/** Ubah error Supabase jadi kalimat yang bisa langsung ditindaklanjuti. */
function explain(err: unknown): string {
  const msg = err instanceof Error ? err.message : typeof err === 'object' && err && 'message' in err ? String((err as { message: unknown }).message) : String(err);
  if (/promo_popup/.test(msg)) return 'Kolom popup belum ada di database. Jalankan file supabase/promo-popup.sql di Supabase SQL Editor, lalu coba lagi.';
  if (/page_sections/.test(msg)) return 'Kolom konten halaman belum ada di database. Jalankan file supabase/page-sections.sql di Supabase SQL Editor, lalu coba lagi.';
  if (/nav_links/.test(msg)) return 'Kolom menu belum ada di database. Jalankan file supabase/nav-links.sql di Supabase SQL Editor, lalu coba lagi.';
  if (/row-level security|permission denied/i.test(msg)) return 'Ditolak database: akun ini belum terdaftar sebagai admin. Jalankan baris insert admin_users di supabase/security.sql.';
  if (/jwt|not authenticated|session/i.test(msg)) return 'Sesi login habis. Silakan login ulang lalu coba simpan lagi.';
  if (/failed to fetch|network/i.test(msg)) return 'Tidak bisa terhubung ke server. Cek koneksi internet lalu coba lagi.';
  if (/duplicate/i.test(msg)) return 'Slug sudah dipakai data lain. Ganti dengan slug berbeda.';
  return msg || 'Terjadi kesalahan yang tidak diketahui.';
}

const NAV_SUGGESTIONS = ['/#produk', '/#custom', '/#about', '/#faq', '/#kontak', '/blog'];

export default function AdminPanel() {
  const [tab, setTab] = useState<'site' | 'pages' | 'products' | 'blog'>('site');
  const [settings, setSettings] = useState<SiteSettings>(demoSettings);
  const [products, setProducts] = useState<Product[]>([]);
  const [posts, setPosts] = useState<{ slug: string; title: string }[]>([]);
  const [busy, setBusy] = useState<string | null>(null);
  const [previewPromo, setPreviewPromo] = useState(false);
  const [dirty, setDirty] = useState<Set<string>>(new Set());
  const [sections, setSections] = useState<PageSections>(() => defaultSections());
  const [sectionsDirty, setSectionsDirty] = useState(false);
  const { items: toasts, notify, dismiss } = useToasts();
  const [supabase] = useState(() => createClient());

  useEffect(() => {
    (async () => {
      try {
        const [s, p, b] = await Promise.all([
          supabase.from('site_settings').select('*').limit(1).maybeSingle(),
          supabase.from('products').select('*').order('sort_order'),
          supabase.from('blog_posts').select('slug,title').order('created_at', { ascending: false }),
        ]);
        if (s.error) notify(`Gagal memuat pengaturan website: ${explain(s.error)}`, 'error');
        if (p.error) notify(`Gagal memuat produk: ${explain(p.error)}`, 'error');
        if (s.data) {
          // page_sections disimpan terpisah (tab Konten Halaman) supaya tidak ikut tertimpa saat menyimpan Pengaturan Website
          const { page_sections: rawSections, ...siteRow } = s.data as Record<string, unknown> & { page_sections?: unknown };
          setSettings({ ...demoSettings, ...(siteRow as unknown as SiteSettings), nav_links: normalizeNavLinks(siteRow.nav_links), promo_popup: normalizePromo(siteRow.promo_popup) });
          setSections(normalizeSections(rawSections));
        }
        if (p.data) setProducts(p.data.map(r => ({ ...r, colors: normalizeOptions(r.colors), motifs: normalizeOptions(r.motifs), sizes: normalizeSizes(r.sizes) })));
        if (b.data) setPosts(b.data);
      } catch (e) { notify(`Gagal memuat data: ${explain(e)}`, 'error'); }
    })();
  }, [supabase, notify]);

  const patch = (id: string, d: Partial<Product>) => { setProducts(x => x.map(q => (q.id === id ? { ...q, ...d } : q))); setDirty(s => new Set(s).add(id)); };
  const clean_ = (id: string) => setDirty(s => { const n = new Set(s); n.delete(id); return n; });

  // Peringatan kalau menutup halaman saat masih ada produk yang belum disimpan
  useEffect(() => {
    if (!dirty.size && !sectionsDirty) return;
    const h = (e: BeforeUnloadEvent) => { e.preventDefault(); e.returnValue = ''; };
    window.addEventListener('beforeunload', h);
    return () => window.removeEventListener('beforeunload', h);
  }, [dirty, sectionsDirty]);

  async function upload(file: File, folder: string, where = 'ikon simpan (disket) pada produk ini') {
    if (!IMAGE_EXT[file.type]) { notify('Format gambar harus JPG, PNG, WebP, GIF, atau AVIF.', 'error'); return ''; }
    try {
      // Kompres otomatis di browser — tidak ada batas ukuran file asli.
      const r = await compressImage(file, { maxDim: folder === 'variants' ? 800 : 1600 });
      if (r.finalBytes > MAX_UPLOAD_BYTES) { notify('Gambar terlalu besar untuk dikompres. Coba gambar lain.', 'error'); return ''; }
      const ext = r.ext || IMAGE_EXT[file.type];
      const type = r.type || file.type;
      const key = `${folder}/${crypto.randomUUID()}.${ext}`;
      const { error } = await supabase.storage.from('media').upload(key, r.file, { upsert: false, contentType: type, cacheControl: '31536000' });
      if (error) { notify(`Upload gagal: ${explain(error)}`, 'error'); return ''; }
      const info = r.compressed ? ` (dikompres otomatis ${formatBytes(r.originalBytes)} → ${formatBytes(r.finalBytes)})` : '';
      notify(`Gambar berhasil diupload${info}, tapi BELUM tersimpan. Klik ` + where + ' agar tampil di website.', 'info');
      return supabase.storage.from('media').getPublicUrl(key).data.publicUrl;
    } catch (e) { notify(`Upload gagal: ${explain(e)}`, 'error'); return ''; }
  }

  async function saveSite() {
    if (busy) return;
    const clean = { ...settings, whatsapp_number: settings.whatsapp_number.replace(/\D/g, ''), google_maps_url: safeUrl(settings.google_maps_url), hero_image_url: safeUrl(settings.hero_image_url), hero_video_url: safeUrl(settings.hero_video_url) };
    if (clean.whatsapp_number.length < 8) return notify('Nomor WhatsApp tidak valid (pakai format 62812…).', 'error');

    // Validasi menu navigasi: baris yang benar-benar kosong dibuang, sisanya wajib lengkap & valid.
    const navLinks: NavLink[] = [];
    for (const [i, l] of (settings.nav_links ?? []).entries()) {
      const label = l.label.trim();
      if (!label && !l.url.trim()) continue;
      if (!label) return notify(`Menu #${i + 1}: nama menu wajib diisi.`, 'error');
      const url = normalizeNavUrl(l.url);
      if (!url) return notify(`Menu "${label}": link tidak valid. Pakai /#produk, /blog/nama-artikel, atau https://…`, 'error');
      navLinks.push({ label: label.slice(0, 24), url, new_tab: !!l.new_tab });
    }

    // Validasi popup promosi
    const pr = settings.promo_popup ?? DEFAULT_PROMO;
    const btnLabel = pr.button_label.trim();
    const btnUrl = pr.button_url.trim() ? normalizeNavUrl(pr.button_url) : '';
    if (pr.button_url.trim() && !btnUrl) return notify('Popup promosi: link tombol tidak valid. Pakai /#produk, /blog/nama-artikel, atau https://…', 'error');
    if (btnLabel && !btnUrl) return notify('Popup promosi: isi link tombol, atau kosongkan teks tombolnya.', 'error');
    if (btnUrl && !btnLabel) return notify('Popup promosi: isi teks tombol, atau kosongkan link tombolnya.', 'error');
    const promo = normalizePromo({ ...pr, enabled: pr.enabled });
    if (promo.enabled && !promoHasContent(promo)) return notify('Popup promosi aktif tapi masih kosong. Upload gambar atau isi teks dulu.', 'error');

    setBusy('site');
    try {
      const { data, error } = await supabase.from('site_settings')
        .upsert({ ...clean, nav_links: navLinks, promo_popup: promo, id: clean.id || undefined, updated_at: new Date().toISOString() }).select().maybeSingle();
      if (error) return notify(`Gagal menyimpan: ${explain(error)}`, 'error');
      if (!data) return notify('Gagal menyimpan: database tidak mengubah data apa pun. Pastikan akun ini terdaftar sebagai admin (security.sql).', 'error');
      setSettings({ ...clean, id: data.id ?? clean.id, nav_links: navLinks, promo_popup: promo });
      notify('Pengaturan website tersimpan dan sudah tampil di website.', 'success');
    } catch (e) { notify(`Gagal menyimpan: ${explain(e)}`, 'error'); }
    finally { setBusy(null); }
  }

  async function saveSections() {
    if (busy) return;
    const problem = validateSections(sections);
    if (problem) return notify(problem, 'error');
    if (!settings.id) return notify('Pengaturan website belum ada di database. Buka tab Website, klik Simpan perubahan sekali, lalu coba lagi.', 'error');
    const clean = normalizeSections(sections);
    setBusy('sections');
    try {
      const { data, error } = await supabase.from('site_settings').update({ page_sections: clean, updated_at: new Date().toISOString() }).eq('id', settings.id).select('id');
      if (error) return notify(`Gagal menyimpan konten halaman: ${explain(error)}`, 'error');
      if (!data?.length) return notify('Gagal menyimpan: database tidak mengubah data apa pun. Pastikan akun ini terdaftar sebagai admin (security.sql).', 'error');
      setSections(clean); setSectionsDirty(false);
      notify('Konten halaman tersimpan dan sudah tampil di website.', 'success');
    } catch (e) { notify(`Gagal menyimpan konten halaman: ${explain(e)}`, 'error'); }
    finally { setBusy(null); }
  }

  async function saveProduct(p: Product) {
    if (busy) return;
    const slug = slugify(p.slug || p.name);
    if (!p.name.trim() || !slug) return notify('Nama dan slug produk wajib diisi.', 'error');
    const row = {
      ...p, slug, name: p.name.trim(),
      price: Math.max(0, Number(p.price) || 0), stock_qty: toInt(p.stock_qty), min_order: toInt(p.min_order, 1),
      image_url: safeUrl(p.image_url), colors: normalizeOptions(p.colors), motifs: normalizeOptions(p.motifs), sizes: normalizeSizes(p.sizes), updated_at: new Date().toISOString(),
    };
    setBusy(`product:${p.id}`);
    try {
      const { data, error } = await supabase.from('products').upsert(row).select('id');
      if (error) return notify(`Gagal menyimpan produk "${row.name}": ${explain(error)}`, 'error');
      if (!data?.length) return notify(`Produk "${row.name}" tidak tersimpan: database tidak mengubah data apa pun. Pastikan akun ini terdaftar sebagai admin.`, 'error');
      patch(p.id, row); clean_(p.id); notify(`Produk "${row.name}" tersimpan dan sudah tampil di website.`, 'success');
    } catch (e) { notify(`Gagal menyimpan produk: ${explain(e)}`, 'error'); }
    finally { setBusy(null); }
  }

  async function remove(p: Product) {
    if (busy || !confirm(`Hapus produk "${p.name}" permanen?`)) return;
    setBusy(`product:${p.id}`);
    try {
      const { data, error } = await supabase.from('products').delete().eq('id', p.id).select('id');
      if (error) return notify(`Gagal menghapus produk: ${explain(error)}`, 'error');
      // Produk baru yang belum pernah disimpan memang tidak ada di database → tetap boleh dibuang dari daftar.
      setProducts(x => x.filter(q => q.id !== p.id)); clean_(p.id);
      notify(data?.length ? `Produk "${p.name}" dihapus.` : `Produk "${p.name}" dibuang dari daftar (belum pernah disimpan).`, 'success');
    } catch (e) { notify(`Gagal menghapus produk: ${explain(e)}`, 'error'); }
    finally { setBusy(null); }
  }

  // ---- Popup promosi ----
  const promo = settings.promo_popup ?? DEFAULT_PROMO;
  const setPromo = (d: Partial<typeof DEFAULT_PROMO>) => setSettings(s => ({ ...s, promo_popup: { ...(s.promo_popup ?? DEFAULT_PROMO), ...d } }));

  // ---- Menu navigasi ----
  const links = settings.nav_links ?? [];
  const setLinks = (next: NavLink[]) => setSettings(s => ({ ...s, nav_links: next }));
  const patchLink = (i: number, d: Partial<NavLink>) => setLinks(links.map((l, j) => (j === i ? { ...l, ...d } : l)));
  const moveLink = (i: number, dir: -1 | 1) => { const j = i + dir; if (j < 0 || j >= links.length) return; const n = [...links]; [n[i], n[j]] = [n[j], n[i]]; setLinks(n); };

  const add = () => setProducts(x => [...x, { id: crypto.randomUUID(), name: 'Produk Baru', slug: 'produk-baru-' + Date.now(), category: 'Spunbond', description: 'Deskripsi produk.', size: '25 × 35 cm', price: 0, min_order: 100, stock_qty: 0, image_url: '', is_customizable: true, is_active: false, sort_order: x.length + 1, colors: [], motifs: [], sizes: [] }]);

  return (
    <main className="admin">
      <aside>
        <div className="brand"><span className="brandmark">T</span><span>Tre Joy Ease <b>Admin</b></span></div>
        <div className="sidegroup">
          <button className={tab === 'site' ? 'sel' : ''} onClick={() => setTab('site')}><Settings /> Website</button>
          <button className={tab === 'pages' ? 'sel' : ''} onClick={() => setTab('pages')}><LayoutTemplate /> Konten Halaman</button>
          <button className={tab === 'products' ? 'sel' : ''} onClick={() => setTab('products')}><Package /> Produk & Stok</button>
          <button className={tab === 'blog' ? 'sel' : ''} onClick={() => setTab('blog')}><FileText /> Blog</button>
          <a href="/" target="_blank" rel="noopener noreferrer"><ExternalLink /> Lihat Website</a>
        </div>
        <button className="logout" onClick={async () => { await supabase.auth.signOut(); location.href = '/admin/login'; }}><LogOut /> Logout</button>
      </aside>
      <section className="admincontent">
        <header><div><span className="kicker">CONTROL CENTER</span><h1>{tab === 'site' ? 'Pengaturan Website' : tab === 'pages' ? 'Konten Halaman' : tab === 'blog' ? 'Artikel Blog' : 'Katalog Produk'}</h1></div></header>
        {tab === 'blog' ? <BlogAdmin notify={notify} /> : tab === 'pages' ? (
          <SectionsAdmin sections={sections} onChange={s => { setSections(s); setSectionsDirty(true); }} upload={f => upload(f, 'sections', 'tombol "Simpan perubahan" di bawah')} onSave={saveSections} saving={busy === 'sections'} dirty={sectionsDirty} />
        ) : tab === 'site' ? (
          <div className="panel">
            <h2>Konten & Media</h2><p className="hint">Semua field di bawah bisa diubah tanpa edit HTML.</p>
            <div className="formgrid">{SITE_FIELDS.map(k => <label key={k}>{k.replaceAll('_', ' ')}<input value={settings[k]} onChange={e => setSettings({ ...settings, [k]: e.target.value })} /></label>)}</div>
            <label>about<textarea value={settings.about} onChange={e => setSettings({ ...settings, about: e.target.value })} /></label>
            <label>payment info<textarea value={settings.payment_info} onChange={e => setSettings({ ...settings, payment_info: e.target.value })} /></label>
            <div className="mediafields">
              <label>Hero image URL<input value={settings.hero_image_url} onChange={e => setSettings({ ...settings, hero_image_url: e.target.value })} /></label>
              <label>Hero video URL (MP4)<input value={settings.hero_video_url} onChange={e => setSettings({ ...settings, hero_video_url: e.target.value })} /></label>
            </div>
            <h2 style={{ marginTop: 8 }}>Popup Promosi</h2>
            <p className="hint">Muncul otomatis saat pengunjung membuka website, dan bisa ditutup dengan tombol X. Gambar dan teks bersifat opsional, isi salah satu atau keduanya. Setelah ditutup, popup tidak muncul lagi selama pengunjung masih di sesi yang sama, dan muncul lagi kalau kamu mengganti isinya.</p>
            <div className="promoedit">
              <label className="check"><input type="checkbox" checked={promo.enabled} onChange={e => setPromo({ enabled: e.target.checked })} /> Tampilkan popup promosi di website</label>
              <div className="promoimg">
                {promo.image_url ? <img src={promo.image_url} alt="Pratinjau gambar popup" /> : <div className="promoempty">Belum ada gambar</div>}
                <div className="promoimgbtns">
                  <label className="upload wide"><Upload size={15} /> {promo.image_url ? 'Ganti gambar' : 'Upload gambar'}<input type="file" accept="image/jpeg,image/png,image/webp,image/gif,image/avif" onChange={async e => { const f = e.target.files?.[0]; e.target.value = ''; if (!f) return; const url = await upload(f, 'promo', 'tombol "Simpan perubahan" di bawah'); if (url) setPromo({ image_url: url }); }} /></label>
                  {promo.image_url && <button type="button" className="navadd" onClick={() => setPromo({ image_url: '' })}><Trash2 size={14} /> Hapus gambar</button>}
                </div>
              </div>
              <div className="promofields">
                <label>Judul (opsional)<input type="text" maxLength={80} placeholder="Diskon 20% untuk order pertama" value={promo.title} onChange={e => setPromo({ title: e.target.value })} /></label>
                <label>Teks (opsional)<textarea maxLength={500} rows={3} placeholder="Tulis detail promo di sini…" value={promo.text} onChange={e => setPromo({ text: e.target.value })} /></label>
                <div className="promo2">
                  <label>Teks tombol (opsional)<input type="text" maxLength={24} placeholder="Lihat promo" value={promo.button_label} onChange={e => setPromo({ button_label: e.target.value })} /></label>
                  <label>Link tombol<input type="text" placeholder="/#produk atau https://…" list="navurls" value={promo.button_url} onChange={e => setPromo({ button_url: e.target.value })} /></label>
                </div>
              </div>
              <button type="button" className="navadd" onClick={() => setPreviewPromo(true)} disabled={!promoHasContent(normalizePromo(promo))}><ExternalLink size={14} /> Pratinjau popup</button>
            </div>
            {previewPromo && <PromoModal promo={normalizePromo({ ...promo, enabled: true })} onClose={() => setPreviewPromo(false)} />}
            <h2 style={{ marginTop: 8 }}>Menu Navigasi</h2>
            <p className="hint">Atur menu di bagian atas website. Isi link dengan <code>/#produk</code> untuk scroll ke bagian halaman, <code>/blog/nama-artikel</code> untuk membuka artikel, atau <code>https://…</code> untuk link luar. Centang &quot;Tab baru&quot; supaya link terbuka di tab baru.</p>
            <datalist id="navurls">{NAV_SUGGESTIONS.map(u => <option key={u} value={u} />)}{posts.map(p => <option key={p.slug} value={`/blog/${p.slug}`} label={p.title} />)}</datalist>
            <div className="navedit">
              {links.length === 0 && <p className="hint">Belum ada menu — navbar akan kosong.</p>}
              {links.map((l, i) => (
                <div className="navrow" key={i}>
                  <input type="text" aria-label={`Nama menu ${i + 1}`} placeholder="Nama menu" maxLength={24} value={l.label} onChange={e => patchLink(i, { label: e.target.value })} />
                  <input type="text" aria-label={`Link menu ${i + 1}`} placeholder="/blog/custom-goodie-bag" list="navurls" value={l.url} onChange={e => patchLink(i, { url: e.target.value })} />
                  <label className="check"><input type="checkbox" checked={!!l.new_tab} onChange={e => patchLink(i, { new_tab: e.target.checked })} /> Tab baru</label>
                  <div className="mini">
                    <button type="button" aria-label="Naikkan" disabled={i === 0} onClick={() => moveLink(i, -1)}><ChevronUp size={15} /></button>
                    <button type="button" aria-label="Turunkan" disabled={i === links.length - 1} onClick={() => moveLink(i, 1)}><ChevronDown size={15} /></button>
                    <button type="button" className="danger" aria-label="Hapus menu" onClick={() => setLinks(links.filter((_, j) => j !== i))}><Trash2 size={14} /></button>
                  </div>
                </div>
              ))}
              <button type="button" className="navadd" disabled={links.length >= MAX_NAV_LINKS} onClick={() => setLinks([...links, { label: '', url: '', new_tab: false }])}><Plus size={14} /> Tambah menu</button>
            </div>
            <button className="primary" onClick={saveSite} disabled={busy === 'site'}>{busy === 'site' ? <><span className="spin" /> Menyimpan…</> : <><Save size={16} /> Simpan perubahan</>}</button>
          </div>
        ) : (
          <div>
            <div className="toolbar"><button className="primary" onClick={add}><Plus size={17} /> Tambah produk</button></div>
            <div className="productadmin">
              {products.map(p => (
                <div className="productrow" key={p.id}>
                  <div className="thumb">{p.image_url ? /* eslint-disable-next-line @next/next/no-img-element */ <img src={safeUrl(p.image_url)} alt="" /> : <ImageIcon />}</div>
                  <div className="fields">
                    <label className="f2">Nama<input value={p.name} onChange={e => patch(p.id, { name: e.target.value })} /></label>
                    <label>Kategori<select value={p.category} onChange={e => patch(p.id, { category: e.target.value as Product['category'] })}><option>Spunbond</option><option>Paperbag</option><option>Coolerbag</option></select></label>
                    <label>Ukuran<input value={p.size} onChange={e => patch(p.id, { size: e.target.value })} /></label>
                    <label>Harga/pcs<input type="number" min={0} value={p.price} onChange={e => patch(p.id, { price: +e.target.value })} /></label>
                    <label>Stok<input type="number" min={0} value={p.stock_qty} onChange={e => patch(p.id, { stock_qty: +e.target.value })} /></label>
                    <label>MOQ<input type="number" min={1} value={p.min_order} onChange={e => patch(p.id, { min_order: +e.target.value })} /></label>
                    <label className="f3">Slug (URL)<input value={p.slug} onChange={e => patch(p.id, { slug: e.target.value })} /></label>
                    <label className="f3">Image URL<input placeholder="https://…" value={p.image_url} onChange={e => patch(p.id, { image_url: e.target.value })} /></label>
                    <label className="f3">Deskripsi<textarea value={p.description} onChange={e => patch(p.id, { description: e.target.value })} /></label>
                    <div className="f3 toggles">
                      <label className="check"><input type="checkbox" checked={p.is_active} onChange={e => patch(p.id, { is_active: e.target.checked })} /> Tampil di website</label>
                      <label className="check"><input type="checkbox" checked={p.is_customizable} onChange={e => patch(p.id, { is_customizable: e.target.checked })} /> Bisa custom</label>
                      <label className="check">Urutan <input type="number" value={p.sort_order} onChange={e => patch(p.id, { sort_order: +e.target.value })} style={{ width: 70 }} /></label>
                    </div>
                    <div className="f3"><VariantEditor kind="color" items={p.colors} onChange={colors => patch(p.id, { colors })} upload={f => upload(f, 'variants')} /></div>
                    <div className="f3"><VariantEditor kind="size" items={p.sizes ?? []} onChange={sizes => patch(p.id, { sizes })} upload={f => upload(f, 'variants')} /></div>
                    <div className="f3"><VariantEditor kind="motif" items={p.motifs} onChange={motifs => patch(p.id, { motifs })} upload={f => upload(f, 'variants')} /></div>
                  </div>
                  <div className="rowactions">
                    {dirty.has(p.id) && <small className="dirtytag">Belum disimpan</small>}
                    <button className={dirty.has(p.id) ? 'dirtysave' : ''} onClick={() => saveProduct(p)} disabled={busy === `product:${p.id}`} aria-label="Simpan produk">{busy === `product:${p.id}` ? <span className="spin" /> : <Save size={15} />}</button>
                    <label className="upload" aria-label="Upload foto produk"><Upload size={15} /><input type="file" accept="image/jpeg,image/png,image/webp,image/gif,image/avif" onChange={async e => { const f = e.target.files?.[0]; e.target.value = ''; if (!f) return; const url = await upload(f, 'products'); if (url) patch(p.id, { image_url: url }); }} /></label>
                    <button className="danger" onClick={() => remove(p)} disabled={busy === `product:${p.id}`} aria-label="Hapus produk"><Trash2 size={15} /></button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </section>
      <Toasts items={toasts} dismiss={dismiss} />
    </main>
  );
}
