import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { Check } from 'lucide-react';
import { getData } from '@/lib/data';
import { getSessionUser } from '@/lib/session';
import { qrisReady } from '@/lib/payments';
import { EmptyArt, ShipNote, StoreShell } from '@/components/site-chrome';
import CheckoutForm from '@/components/checkout-form';
import { EMPTY_PROFILE, type Profile } from '@/components/account-view';

// Selalu dinamis: butuh sesi login, tidak boleh di-prerender / di-cache
export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: 'Checkout', robots: { index: false, follow: false } };

export default async function CheckoutPage() {
  const { settings, checkoutEnabled } = await getData();
  if (!checkoutEnabled) redirect('/keranjang');
  const { supabase, user } = await getSessionUser();
  if (!supabase || !user) redirect('/akun/masuk?next=/checkout');
  const { data } = await supabase.from('profiles').select('full_name,phone,company,address,city,postal_code').eq('id', user.id).maybeSingle();
  const meta = (user.user_metadata ?? {}) as { full_name?: string; phone?: string };
  const profile: Profile = { ...EMPTY_PROFILE, full_name: meta.full_name ?? '', phone: meta.phone ?? '', ...(data ?? {}) };
  return (
    <StoreShell settings={settings} checkout variant="min" fab={false} bar>
      <main id="konten" className="container container--form flowpage">
        <header className="shophead cohead">
          <div><h1>Checkout</h1><p>Isi alamat pengiriman, lalu buat pesanan.</p></div>
          <div className="flowwrap">
            <ol className="flowsteps" aria-label="Langkah checkout">
              <li className="is-done"><a href="/keranjang"><span className="fs-dot"><Check size={14} aria-hidden="true" /></span><span className="fs-label">Keranjang</span></a></li>
              <li className="is-now" aria-current="step"><span className="fs-dot">2</span><span className="fs-label">Alamat dan pembayaran</span></li>
              <li><span className="fs-dot">3</span><span className="fs-label">Bayar</span></li>
            </ol>
            <p className="fs-count" aria-hidden="true">Langkah 2 dari 3</p>
          </div>
        </header>
        <CheckoutForm profile={profile} email={user.email ?? ''} qris={qrisReady()} shipNote={<ShipNote settings={settings} />} art={<EmptyArt />} />
      </main>
    </StoreShell>
  );
}
