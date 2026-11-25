import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getData } from '@/lib/data';
import { getSessionUser } from '@/lib/session';
import { SiteFooter, SiteHeader } from '@/components/site-chrome';
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
    <>
      <SiteHeader settings={settings} checkout />
      <main className="container shop">
        <header className="shophead"><div><h1>Checkout</h1><p>Isi alamat pengiriman, lalu buat pesanan.</p></div></header>
        <CheckoutForm profile={profile} email={user.email ?? ''} />
      </main>
      <SiteFooter settings={settings} checkout />
    </>
  );
}
