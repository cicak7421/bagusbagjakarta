'use client';
import { useState } from 'react';
import { AlertCircle, ArrowLeft, ArrowRight, CheckCircle2, Eye, EyeOff, Info, MailCheck } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { safeNext } from '@/lib/orders';

const MIN_PASSWORD = 8;

/** Ubah error Supabase Auth jadi kalimat yang jelas, tanpa membocorkan apakah sebuah email terdaftar. */
function authError(e: { message?: string; status?: number; code?: string } | null, fallback: string) {
  const m = (e?.message || '').toLowerCase();
  if (e?.status === 429 || m.includes('rate limit')) return 'Terlalu banyak percobaan. Coba lagi beberapa menit lagi.';
  if (m.includes('email not confirmed')) return 'Email belum diverifikasi. Buka link verifikasi yang kami kirim ke email kamu.';
  if (e?.code === 'email_address_invalid' || (m.includes('email') && m.includes('invalid'))) return 'Alamat email tidak valid. Periksa lagi penulisannya.';
  if (m.includes('signups not allowed') || m.includes('signup is disabled')) return 'Pendaftaran akun sedang ditutup. Silakan hubungi admin lewat WhatsApp.';
  if (m.includes('weak') || m.includes('password should')) return `Password terlalu lemah. Pakai minimal ${MIN_PASSWORD} karakter, gabungan huruf dan angka.`;
  if (m.includes('failed to fetch') || m.includes('network')) return 'Tidak bisa terhubung ke server. Cek koneksi internet lalu coba lagi.';
  return fallback;
}

/** Kolom kanan halaman masuk/daftar/lupa/reset. Kolom kiri (manfaat akun) dipasang oleh app/akun/auth-frame.tsx. */
function Shell({ title, lead, icon, children }: { title: string; lead: string; icon?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="authform">
      {icon}
      <h1>{title}</h1>
      <p className="authlead">{lead}</p>
      <p className="authperks only-sm">Pantau pesanan · alamat tersimpan · riwayat pesanan</p>
      {children}
    </div>
  );
}

const ErrorMsg = ({ text }: { text: string }) => (text ? <p className="msg msg--danger" role="alert"><AlertCircle aria-hidden="true" /><span>{text}</span></p> : null);

/** Kolom password dengan tombol tampilkan/sembunyikan. `link` (mis. "Lupa password?") tampil sejajar label. */
function PasswordField({ id, label, hint, link, ...input }: { id: string; label: string; hint?: string; link?: React.ReactNode } & Omit<React.InputHTMLAttributes<HTMLInputElement>, 'id' | 'type'>) {
  const [show, setShow] = useState(false);
  return (
    <div className="field field--pw">
      <label htmlFor={id}>{label}</label>
      <span className="pwfield">
        <input id={id} type={show ? 'text' : 'password'} aria-describedby={hint ? `${id}-hint` : undefined} {...input} />
        <button type="button" className="btn btn-icon btn-icon--bare" aria-pressed={show} aria-label="Tampilkan password" onClick={() => setShow(s => !s)}>
          {show ? <EyeOff size={18} aria-hidden="true" /> : <Eye size={18} aria-hidden="true" />}
        </button>
      </span>
      {link}
      {hint && <small className="hintline" id={`${id}-hint`}>{hint}</small>}
    </div>
  );
}

export function LoginForm({ next, notice }: { next?: string; notice?: string }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [err, setErr] = useState('');
  const [loading, setLoading] = useState(false);
  const target = safeNext(next);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (loading) return;
    setLoading(true); setErr('');
    const { error } = await createClient().auth.signInWithPassword({ email: email.trim(), password });
    if (error) { setErr(authError(error, 'Email atau password salah.')); setLoading(false); return; }
    location.href = target;
  }
  return (
    <Shell title="Masuk" lead="Masuk untuk checkout dan melihat status pesanan kamu.">
      {notice && <p className="msg" role="status"><Info aria-hidden="true" /><span>{notice}</span></p>}
      <form onSubmit={submit} className="form">
        <label>Email<input type="email" required autoComplete="email" inputMode="email" value={email} onChange={e => setEmail(e.target.value)} /></label>
        <PasswordField id="login-password" label="Password" required autoComplete="current-password" value={password} onChange={e => setPassword(e.target.value)}
          link={<a className="field-link" href="/akun/lupa-password">Lupa password?</a>} />
        <ErrorMsg text={err} />
        <button className="btn btn-primary btn-lg btn-block" disabled={loading}>{loading ? 'Memproses…' : 'Masuk'} <ArrowRight size={18} aria-hidden="true" /></button>
      </form>
      <p className="authalt">Belum punya akun? <a href={`/akun/daftar?next=${encodeURIComponent(target)}`}>Daftar gratis</a></p>
    </Shell>
  );
}

export function RegisterForm({ next }: { next?: string }) {
  const [f, setF] = useState({ name: '', phone: '', email: '', password: '' });
  const [agree, setAgree] = useState(false);
  const [err, setErr] = useState('');
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const target = safeNext(next);
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement>) => setF({ ...f, [k]: e.target.value });

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (loading) return;
    const phone = f.phone.replace(/[^\d+]/g, '');
    if (f.name.trim().length < 3) return setErr('Nama lengkap wajib diisi.');
    if (!/^\+?\d{8,15}$/.test(phone)) return setErr('Nomor WhatsApp tidak valid. Contoh: 081234567890');
    if (f.password.length < MIN_PASSWORD) return setErr(`Password minimal ${MIN_PASSWORD} karakter.`);
    if (!agree) return setErr('Centang persetujuan syarat & ketentuan dulu.');
    setLoading(true); setErr('');
    const { data, error } = await createClient().auth.signUp({
      email: f.email.trim(), password: f.password,
      options: { data: { full_name: f.name.trim().slice(0, 80), phone }, emailRedirectTo: `${location.origin}/auth/callback?next=${encodeURIComponent(target)}` },
    });
    if (error) { setErr(authError(error, 'Pendaftaran gagal. Periksa data kamu lalu coba lagi.')); setLoading(false); return; }
    if (data.session) { location.href = target; return; }
    setSent(true); setLoading(false);
  }
  if (sent) return (
    <Shell icon={<MailCheck className="authicon" size={40} aria-hidden="true" />} title="Cek email kamu" lead={`Kami mengirim link verifikasi ke ${f.email.trim()}. Klik link itu untuk mengaktifkan akun, lalu masuk.`}>
      <a className="btn btn-outline btn-block" href="/akun/masuk">Ke halaman masuk</a>
      <p className="authalt">Tidak ada email masuk? Cek folder spam, atau <a href="/akun/masuk">coba masuk</a> kalau kamu sudah pernah mendaftar.</p>
    </Shell>
  );
  return (
    <Shell title="Daftar akun" lead="Buat akun untuk checkout lebih cepat dan memantau pesanan.">
      <form onSubmit={submit} className="form">
        <label>Nama lengkap<input required autoComplete="name" maxLength={80} value={f.name} onChange={set('name')} /></label>
        <label>Nomor WhatsApp<input required type="tel" autoComplete="tel" inputMode="tel" maxLength={20} placeholder="081234567890" value={f.phone} onChange={set('phone')} /></label>
        <label>Email<input required type="email" autoComplete="email" inputMode="email" value={f.email} onChange={set('email')} /></label>
        <PasswordField id="register-password" label="Password" hint={`Minimal ${MIN_PASSWORD} karakter.`} required autoComplete="new-password" minLength={MIN_PASSWORD} value={f.password} onChange={set('password')} />
        <label className="agree"><input type="checkbox" checked={agree} onChange={e => setAgree(e.target.checked)} /><span>Saya setuju dengan <a href="/syarat-ketentuan" target="_blank">Syarat &amp; Ketentuan</a> dan <a href="/kebijakan-privasi" target="_blank">Kebijakan Privasi</a>.</span></label>
        <ErrorMsg text={err} />
        <button className="btn btn-primary btn-lg btn-block" disabled={loading}>{loading ? 'Memproses…' : 'Daftar'} <ArrowRight size={18} aria-hidden="true" /></button>
      </form>
      <p className="authalt">Sudah punya akun? <a href={`/akun/masuk?next=${encodeURIComponent(target)}`}>Masuk</a></p>
    </Shell>
  );
}

export function ForgotForm() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [err, setErr] = useState('');
  const [loading, setLoading] = useState(false);
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (loading) return;
    setLoading(true); setErr('');
    const { error } = await createClient().auth.resetPasswordForEmail(email.trim(), { redirectTo: `${location.origin}/auth/callback?next=/akun/reset-password` });
    setLoading(false);
    // Selalu tampilkan pesan yang sama, terdaftar atau tidak (kecuali kena batas percobaan)
    if (error && (error.status === 429 || /rate limit/i.test(error.message))) return setErr(authError(error, ''));
    setSent(true);
  }
  return (
    <Shell title="Lupa password" lead="Masukkan email akun kamu. Kami kirim link untuk membuat password baru.">
      {sent ? <p className="msg msg--ok" role="status"><CheckCircle2 aria-hidden="true" /><span>Kalau email itu terdaftar, link reset password sudah dikirim. Cek inbox dan folder spam.</span></p> : (
        <form onSubmit={submit} className="form">
          <label>Email<input type="email" required autoComplete="email" inputMode="email" value={email} onChange={e => setEmail(e.target.value)} /></label>
          <ErrorMsg text={err} />
          <button className="btn btn-primary btn-lg btn-block" disabled={loading}>{loading ? 'Mengirim…' : 'Kirim link reset'}</button>
        </form>
      )}
      <p className="authalt"><a className="backlink" href="/akun/masuk"><ArrowLeft size={16} aria-hidden="true" /> Kembali ke halaman masuk</a></p>
    </Shell>
  );
}

export function ResetForm() {
  const [password, setPassword] = useState('');
  const [err, setErr] = useState('');
  const [loading, setLoading] = useState(false);
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (loading) return;
    if (password.length < MIN_PASSWORD) return setErr(`Password minimal ${MIN_PASSWORD} karakter.`);
    setLoading(true); setErr('');
    const { error } = await createClient().auth.updateUser({ password });
    if (error) { setErr(authError(error, 'Gagal menyimpan password. Buka lagi link reset dari email kamu.')); setLoading(false); return; }
    location.href = '/akun';
  }
  return (
    <Shell title="Password baru" lead="Buat password baru untuk akun kamu.">
      <form onSubmit={submit} className="form">
        <PasswordField id="reset-password" label="Password baru" hint={`Minimal ${MIN_PASSWORD} karakter.`} required autoComplete="new-password" minLength={MIN_PASSWORD} value={password} onChange={e => setPassword(e.target.value)} />
        <ErrorMsg text={err} />
        <button className="btn btn-primary btn-lg btn-block" disabled={loading}>{loading ? 'Menyimpan…' : 'Simpan password'}</button>
      </form>
    </Shell>
  );
}
