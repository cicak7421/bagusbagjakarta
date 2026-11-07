'use client';
import { Suspense, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { ArrowRight } from 'lucide-react';

function LoginForm() {
  const denied = useSearchParams().get('denied') === '1';
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [err, setErr] = useState(denied ? 'Akun ini tidak punya akses admin.' : '');
  const [loading, setLoading] = useState(false);
  const [fails, setFails] = useState(0);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (loading) return;
    setLoading(true); setErr('');
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    if (error) {
      // Pesan generik: tidak membocorkan apakah email terdaftar.
      const n = fails + 1; setFails(n);
      setErr(error.status === 429 ? 'Terlalu banyak percobaan. Coba lagi beberapa menit lagi.' : 'Email atau password salah.');
      if (n >= 3) await new Promise(r => setTimeout(r, Math.min(n, 6) * 1000)); // jeda bertahap
      setLoading(false);
      return;
    }
    location.href = '/admin';
  }

  return (
    <main className="adminlogin"><div className="loginbox">
      <div className="brand"><span className="brandmark">T</span><span>Tre Joy Ease <b>Admin</b></span></div>
      <h1>Admin Panel</h1><p>Kelola katalog, stok, media, dan informasi perusahaan.</p>
      <form onSubmit={submit}>
        <label>Email<input type="email" required autoComplete="username" value={email} onChange={e => setEmail(e.target.value)} placeholder="admin@perusahaan.com" /></label>
        <label>Password<input type="password" required autoComplete="current-password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" /></label>
        {err && <div className="error" role="alert">{err}</div>}
        <button className="primary full" disabled={loading}>{loading ? 'Masuk...' : 'Masuk ke Panel'} <ArrowRight size={17} /></button>
      </form>
    </div></main>
  );
}
export default function Login() { return <Suspense><LoginForm /></Suspense>; }
