'use client';
import { useEffect, useState } from 'react';
import { ArrowLeft, ExternalLink, ImagePlus, Plus, Save, Trash2, Upload } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import type { BlogPost } from '@/lib/types';

const slugify = (s: string) => s.toLowerCase().normalize('NFKD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
const toLocal = (iso: string | null) => iso ? new Date(new Date(iso).getTime() - new Date(iso).getTimezoneOffset() * 60000).toISOString().slice(0, 16) : '';
const blank = (): BlogPost => ({ id: crypto.randomUUID(), title: '', slug: '', excerpt: '', content: '', cover_image_url: '', category: 'Tips', author: 'Tim Tre Joy Ease', meta_title: '', meta_description: '', is_published: false, published_at: null });

export default function BlogAdmin({ setMsg }: { setMsg: (m: string) => void }) {
  const supabase = createClient();
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [edit, setEdit] = useState<BlogPost | null>(null);
  const [isNew, setIsNew] = useState(false);

  async function load() {
    const { data, error } = await supabase.from('blog_posts').select('*').order('created_at', { ascending: false });
    if (error) setMsg(`${error.message} — pastikan supabase/blog.sql sudah dijalankan.`);
    else setPosts(data ?? []);
  }
  useEffect(() => { load(); }, []);

  async function upload(file: File) {
    const key = `blog/${crypto.randomUUID()}.${file.name.split('.').pop()}`;
    const { error } = await supabase.storage.from('media').upload(key, file, { contentType: file.type });
    if (error) { setMsg(error.message); return ''; }
    return supabase.storage.from('media').getPublicUrl(key).data.publicUrl;
  }
  async function save() {
    if (!edit) return;
    if (!edit.title.trim() || !edit.slug.trim()) return setMsg('Judul dan slug wajib diisi.');
    const now = new Date().toISOString();
    const row = { ...edit, slug: slugify(edit.slug), published_at: edit.is_published ? edit.published_at || now : edit.published_at, updated_at: now };
    const { error } = await supabase.from('blog_posts').upsert(row);
    if (error) return setMsg(error.message.includes('duplicate') ? 'Slug sudah dipakai artikel lain.' : error.message);
    setMsg(edit.is_published ? 'Artikel tersimpan dan terbit.' : 'Draft tersimpan.');
    setEdit(row); setIsNew(false); load();
  }
  async function remove(id: string) {
    if (!confirm('Hapus artikel ini permanen?')) return;
    const { error } = await supabase.from('blog_posts').delete().eq('id', id);
    if (error) return setMsg(error.message);
    setEdit(null); setMsg('Artikel dihapus.'); load();
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
      <div className="toolbar"><button className="primary" onClick={save}><Save size={16} /> Simpan</button>{!isNew && <button className="danger" onClick={() => remove(edit.id)}><Trash2 size={15} /> Hapus</button>}</div>
    </div>
  );
}
