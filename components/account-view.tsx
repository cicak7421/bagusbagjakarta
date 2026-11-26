'use client';
import { useEffect, useRef, useState } from 'react';
import { AlertCircle, Check, CheckCircle2, Copy, LogOut, Save } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

export type Profile = { full_name: string; phone: string; company: string; address: string; city: string; postal_code: string };
export const EMPTY_PROFILE: Profile = { full_name: '', phone: '', company: '', address: '', city: '', postal_code: '' };

export function LogoutButton() {
  const [busy, setBusy] = useState(false);
  return (
    <button type="button" className="btn btn-outline btn-sm" disabled={busy} onClick={async () => { setBusy(true); await createClient().auth.signOut(); location.href = '/'; }}>
      <LogOut size={16} aria-hidden="true" /> {busy ? 'Keluar…' : 'Keluar'}
    </button>
  );
}

/** Salin teks ke clipboard. Dicoba lewat Clipboard API dulu, lalu cara lama untuk browser yang menolaknya. */
async function copyText(value: string) {
  try { await navigator.clipboard.writeText(value); return true; } catch { /* lanjut ke cara lama */ }
  try {
    const ta = document.createElement('textarea');
    ta.value = value; ta.setAttribute('readonly', ''); ta.style.position = 'fixed'; ta.style.opacity = '0';
    document.body.appendChild(ta); ta.select();
    const ok = document.execCommand('copy');
    ta.remove();
    return ok;
  } catch { return false; }
}

/** Tombol ikon kecil untuk menyalin nomor pesanan atau nomor resi. `label` wajib menjelaskan apa yang disalin. */
export function CopyButton({ value, label }: { value: string; label: string }) {
  const [done, setDone] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);
  async function copy() {
    if (!(await copyText(value))) return;
    setDone(true);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setDone(false), 2000);
  }
  return (
    <span className="copybtn">
      <button type="button" className="btn btn-icon btn-icon--bare" onClick={copy} aria-label={label}>
        {done ? <Check size={18} aria-hidden="true" /> : <Copy size={18} aria-hidden="true" />}
      </button>
      <span className="copybtn-tip" role="status">{done && <span className="badge badge--ink">Tersalin</span>}</span>
    </span>
  );
}

/** Data diri & alamat default (dipakai mengisi form checkout otomatis). */
export function ProfileForm({ userId, initial }: { userId: string; initial: Profile }) {
  const [f, setF] = useState(initial);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const set = (k: keyof Profile) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setF({ ...f, [k]: e.target.value });

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (busy) return;
    const phone = f.phone.replace(/[^\d+]/g, '');
    if (phone && !/^\+?\d{8,15}$/.test(phone)) return setMsg({ ok: false, text: 'Nomor WhatsApp tidak valid.' });
    if (f.postal_code && !/^\d{5}$/.test(f.postal_code.trim())) return setMsg({ ok: false, text: 'Kode pos harus 5 angka.' });
    setBusy(true); setMsg(null);
    const row = { id: userId, full_name: f.full_name.trim().slice(0, 80), phone, company: f.company.trim().slice(0, 80), address: f.address.trim().slice(0, 300), city: f.city.trim().slice(0, 60), postal_code: f.postal_code.trim(), updated_at: new Date().toISOString() };
    const { error } = await createClient().from('profiles').upsert(row);
    setBusy(false);
    setMsg(error ? { ok: false, text: 'Gagal menyimpan. Coba lagi sebentar lagi.' } : { ok: true, text: 'Data tersimpan.' });
  }
  return (
    <form onSubmit={save} className="form profileform">
      <div className="form2">
        <label>Nama lengkap<input autoComplete="name" maxLength={80} value={f.full_name} onChange={set('full_name')} /></label>
        <label>Nomor WhatsApp<input type="tel" inputMode="tel" autoComplete="tel" maxLength={20} placeholder="081234567890" value={f.phone} onChange={set('phone')} /></label>
      </div>
      <label><span>Perusahaan / toko <span className="opt-tag">(opsional)</span></span><input autoComplete="organization" maxLength={80} value={f.company} onChange={set('company')} /></label>
      <label>Alamat pengiriman<textarea rows={3} autoComplete="street-address" maxLength={300} placeholder="Nama jalan, nomor, RT/RW, kelurahan, kecamatan" value={f.address} onChange={set('address')} /></label>
      <div className="form2 form2--city">
        <label>Kota / kabupaten<input autoComplete="address-level2" maxLength={60} value={f.city} onChange={set('city')} /></label>
        <label>Kode pos<input inputMode="numeric" autoComplete="postal-code" maxLength={5} value={f.postal_code} onChange={set('postal_code')} /></label>
      </div>
      <div className="formstatus" role="status">
        {msg && (
          <p className={msg.ok ? 'msg msg--ok' : 'msg msg--danger'}>
            {msg.ok ? <CheckCircle2 aria-hidden="true" /> : <AlertCircle aria-hidden="true" />}<span>{msg.text}</span>
          </p>
        )}
      </div>
      <button className="btn btn-outline profileform-save" disabled={busy}>{busy ? <><span className="spin" aria-hidden="true" /> Menyimpan…</> : <><Save size={16} aria-hidden="true" /> Simpan data</>}</button>
    </form>
  );
}
