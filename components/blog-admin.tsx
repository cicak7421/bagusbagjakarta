'use client';
import { useEffect, useState } from 'react';
import { ArrowLeft, ExternalLink, ImagePlus, Plus, Save, Trash2, Upload } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import type { BlogPost } from '@/lib/types';
import type { Notify } from '@/components/toast';
import { compressImage, formatBytes } from '@/lib/compress-image';
import { IMAGE_EXT } from '@/lib/safe';

const slugify = (s: string) => s.toLowerCase().normalize('NFKD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
const toLocal = (iso: string | null) => iso ? new Date(new Date(iso).getTime() - new Date(iso).getTimezoneOffset() * 60000).toISOString().slice(0, 16) : '';
const blank = (): BlogPost => ({ id: crypto.randomUUID(), title: '', slug: '', excerpt: '', content: '', cover_image_url: '', category: 'Tips', author: 'Tim Tre Joy Ease', meta_title: '', meta_description: '', is_published: false, published_at: null });

export default function BlogAdmin({ notify }: { notify: Notify }) {
  const supabase = createClient();
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [edit, setEdit] = useState<BlogPost | null>(null);
  const [isNew, setIsNew] = useState(false);
  const [saving, setSaving] = useState(false);

  async function load() {
    try {
      const { data, error } = await supabase.from('blog_posts').select('*').order('created_at', { ascending: false });
      if (error) notify(`Gagal memuat artikel: ${error.message} — pastikan supabase/blog.sql sudah dijalankan.`, 'error');
      else setPosts(data ?? []);
    } catch (e) { notify(`Gagal memuat artikel: ${e instanceof Error ? e.message : 'koneksi bermasalah'}`, 'error'); }
  }
  useEffect(() => { load(); }, []);

  async function upload(file: File) {
    if (!file.type.startsWith('image/')) { notify('File harus berupa gambar.', 'error'); return ''; }
    try {
      const r = await compressImage(file, { maxDim: 1600 });
      if (r.finalBytes > 5 * 1024 * 1024) { notify('Gambar terlalu besar untuk dikompres. Coba gambar lain.', 'error'); return ''; }
      const ext = r.ext || IMAGE_EXT[file.type] || 'jpg';
      const key = `blog/${crypto.randomUUID()}.${ext}`;
      const { error } = await supabase.storage.from('media').upload(key, r.file, { contentType: r.type || file.type, cacheControl: '31536000' });
      if (error) { notify(`Upload gagal: ${error.message}`, 'error'); return ''; }
      notify(r.compressed ? `Gambar berhasil diupload (dikompres otomatis ${formatBytes(r.originalBytes)} → ${formatBytes(r.finalBytes)}).` : 'Gambar berhasil diupload.', 'success');
      return supabase.storage.from('media').getPublicUrl(key).data.publicUrl;
    } catch (e) { notify(`Upload gagal: ${e instanceof Error ? e.message : 'koneksi bermasalah'}`, 'error'); return ''; }
  }
  async function save() {
    if (!edit || saving) return;
    if (!edit.title.trim() || !edit.slug.trim()) return notify('Judul dan slug wajib diisi.', 'error');
    const now = new Date().toISOString();
    const row = { ...edit, slug: slugify(edit.slug), published_at: edit.is_published ? edit.published_at || now : edit.published_at, updated_at: now };
    setSaving(true);
    try {
      const { data, error } = await supabase.from('blog_posts').upsert(row).select('id');
      if (error) return notify(error.message.includes('duplicate') ? 'Gagal menyimpan: slug sudah dipakai artikel lain.' : `Gagal menyimpan artikel: ${error.message}`, 'error');
      if (!data?.length) return notify('Artikel tidak tersimpan: database tidak mengubah data apa pun. Pastikan akun ini terdaftar sebagai admin (security.sql).', 'error');
      notify(edit.is_published ? `Artikel "${row.title}" tersimpan dan terbit.` : `Draft "${row.title}" tersimpan.`, 'success');
      setEdit(row); setIsNew(false); load();
    } catch (e) { notify(`Gagal menyimpan artikel: ${e instanceof Error ? e.message : 'koneksi bermasalah'}`, 'error'); }
    finally { setSaving(false); }
  }
  async function remove(id: string) {
    if (saving || !confirm('Hapus artikel ini permanen?')) return;
    setSaving(true);
    try {
      const { data, error } = await supabase.from('blog_posts').delete().eq('id', id).select('id');
      if (error) return notify(`Gagal menghapus artikel: ${error.message}`, 'error');
      if (!data?.length) return notify('Artikel tidak terhapus: database tidak mengubah data apa pun. Pastikan akun ini terdaftar sebagai admin.', 'error');
      setEdit(null); notify('Artikel dihapus.', 'success'); load();
    } catch (e) { notify(`Gagal menghapus artikel: ${e instanceof Error ? e.message : 'koneksi bermasalah'}`, 'error'); }
    finally { setSaving(false); }
  }
  const set = (k: keyof BlogPost, v: string | boolean | null) => setEdit(e => e && { ...e, [k]: v });

  if (!edit) return (
    <div>
      <div className="toolbar"><button className="primary" onClick={() => { setEdit(blank()); setIsNew(true); }}><Plus size={17} /> Tulis artikel</button></div>
      <div className="postlist">
        {posts.length === 0 && <p className="hint">Belum ada artikel.</p>}
        {posts.map(p => (
          <button key={p.id} className="postrow" onClick={() => { setEdit(p); setIsNew(false); }}>
            <span><b>{p.title}</b><small>/blog/{p.slug}</small></span>
            <em className={p.is_published ? 'live' : ''}>{p.is_published ? 'Terbit' : 'Draft'}</em>
          </button>
        ))}
      </div>
    </div>
  );

  return (
    <div className="panel">
      <div className="toolbar" style={{ justifyContent: 'space-between' }}>
        <button onClick={() => setEdit(null)}><ArrowLeft size={15} /> Kembali</button>
        {!isNew && edit.is_published && <a href={`/blog/${edit.slug}`} target="_blank" rel="noreferrer"><ExternalLink size={14} /> Lihat artikel</a>}
      </div>
      <label>Judul<input value={edit.title} onChange={e => { set('title', e.target.value); if (isNew) set('slug', slugify(e.target.value)); }} /></label>
      <div className="formgrid">
        <label>Slug (URL)<input value={edit.slug} onChange={e => set('slug', e.target.value)} /></label>
        <label>Kategori<input value={edit.category} onChange={e => set('category', e.target.value)} /></label>
        <label>Penulis<input value={edit.author} onChange={e => set('author', e.target.value)} /></label>
        <label>Jadwal terbit<input type="datetime-local" value={toLocal(edit.published_at)} onChange={e => set('published_at', e.target.value ? new Date(e.target.value).toISOString() : null)} /></label>
      </div>
      <label>Ringkasan (tampil di daftar blog)<textarea value={edit.excerpt} onChange={e => set('excerpt', e.target.value)} /></label>
      <div className="mediafields">
        <label>Gambar sampul (URL)<input value={edit.cover_image_url} onChange={e => set('cover_image_url', e.target.value)} /></label>
        <label className="upload" style={{ alignSelf: 'end' }}><Upload size={15} /> Upload sampul<input type="file" accept="image/*" onChange={async e => { const f = e.target.files?.[0]; if (f) { const u = await upload(f); if (u) set('cover_image_url', u); } }} /></label>
      </div>
      <label>Isi artikel (Markdown)<textarea className="editor" value={edit.content} onChange={e => set('content', e.target.value)} /></label>
      <p className="hint">Pakai <code>## Subjudul</code>, <code>**tebal**</code>, <code>- daftar</code>, dan <code>[teks](https://link)</code>. Judul utama (H1) otomatis dari kolom Judul.</p>
      <label className="upload"><ImagePlus size={15} /> Sisipkan gambar ke artikel<input type="file" accept="image/*" onChange={async e => { const f = e.target.files?.[0]; if (f) { const u = await upload(f); if (u) set('content', `${edit.content}\n\n![Deskripsi gambar](${u})\n`); } }} /></label>
      <h2 style={{ marginTop: 28 }}>SEO</h2>
      <label>Meta title <small className={edit.meta_title.length > 60 ? 'over' : ''}>{edit.meta_title.length}/60</small><input value={edit.meta_title} placeholder={edit.title} onChange={e => set('meta_title', e.target.value)} /></label>
      <label>Meta description <small className={edit.meta_description.length > 160 ? 'over' : ''}>{edit.meta_description.length}/160</small><textarea value={edit.meta_description} placeholder={edit.excerpt} onChange={e => set('meta_description', e.target.value)} /></label>
      <label className="check"><input type="checkbox" checked={edit.is_published} onChange={e => set('is_published', e.target.checked)} /> Terbitkan artikel (kalau tidak dicentang, tersimpan sebagai draft)</label>
      <div className="toolbar"><button className="primary" onClick={save} disabled={saving}>{saving ? <><span className="spin" /> Menyimpan…</> : <><Save size={16} /> Simpan</>}</button>{!isNew && <button className="danger" onClick={() => remove(edit.id)} disabled={saving}><Trash2 size={15} /> Hapus</button>}</div>
    </div>
  );
}
