'use client';
import { useState } from 'react';
import { LogOut, Save } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

export type Profile = { full_name: string; phone: string; company: string; address: string; city: string; postal_code: string };
export const EMPTY_PROFILE: Profile = { full_name: '', phone: '', company: '', address: '', city: '', postal_code: '' };

export function LogoutButton() {
  const [busy, setBusy] = useState(false);
  return (
    <button type="button" className="outline small" disabled={busy} onClick={async () => { setBusy(true); await createClient().auth.signOut(); location.href = '/'; }}>
      <LogOut size={16} /> Keluar
    </button>
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
    <form onSubmit={save} className="form">
      <div className="form2">
        <label>Nama lengkap<input autoComplete="name" maxLength={80} value={f.full_name} onChange={set('full_name')} /></label>
        <label>Nomor WhatsApp<input type="tel" inputMode="tel" autoComplete="tel" maxLength={20} value={f.phone} onChange={set('phone')} /></label>
      </div>
      <label>Perusahaan / toko (opsional)<input autoComplete="organization" maxLength={80} value={f.company} onChange={set('company')} /></label>
      <label>Alamat pengiriman<textarea rows={3} autoComplete="street-address" maxLength={300} value={f.address} onChange={set('address')} /></label>
      <div className="form2">
        <label>Kota / kabupaten<input autoComplete="address-level2" maxLength={60} value={f.city} onChange={set('city')} /></label>
        <label>Kode pos<input inputMode="numeric" autoComplete="postal-code" maxLength={5} value={f.postal_code} onChange={set('postal_code')} /></label>
      </div>
      {msg && <div className={msg.ok ? 'notice' : 'error'} role="status">{msg.text}</div>}
      <button className="primary" disabled={busy}>{busy ? 'Menyimpan…' : <><Save size={16} /> Simpan data</>}</button>
    </form>
  );
}
