import { redirect } from 'next/navigation';
import { ChevronRight, PackageSearch } from 'lucide-react';
import { getSessionUser } from '@/lib/session';
import { money } from '@/lib/format';
import { fmtDateTime, normalizeOrder, ORDER_STATUS_LABEL } from '@/lib/orders';
import { EMPTY_PROFILE, LogoutButton, ProfileForm, type Profile } from '@/components/account-view';

export default async function AccountPage() {
  const { supabase, user } = await getSessionUser();
  if (!supabase || !user) redirect('/akun/masuk');

  const [p, o] = await Promise.all([
    supabase.from('profiles').select('full_name,phone,company,address,city,postal_code').eq('id', user.id).maybeSingle(),
    supabase.from('orders').select('order_number,status,payment_status,total,created_at,order_items(product_name,qty)').eq('user_id', user.id).order('created_at', { ascending: false }).limit(50),
  ]);
  const profile: Profile = { ...EMPTY_PROFILE, ...(p.data ?? {}) };
  const orders = (o.data ?? []).map(r => normalizeOrder(r as Record<string, unknown>));
  const notReady = !!o.error; // tabel pesanan belum dipasang

  return (
    <div className="acct">
      <header className="shophead">
        <div><h1>Akun saya</h1><p>{user.email}</p></div>
        <LogoutButton />
      </header>

      <section aria-labelledby="orders-title" className="acctsec">
        <h2 id="orders-title">Pesanan saya</h2>
        {notReady ? <p className="empty">Riwayat pesanan belum tersedia. Silakan coba lagi nanti.</p>
          : orders.length === 0 ? (
            <div className="empty"><PackageSearch size={32} aria-hidden="true" /><p>Belum ada pesanan.</p><a className="primary" href="/#produk">Lihat katalog</a></div>
          ) : (
            <ul className="orderlist">
              {orders.map(x => (
                <li key={x.order_number}>
                  <a href={`/akun/pesanan/${x.order_number}`}>
                    <span className="ol-main">
                      <b>{x.order_number}</b>
                      <small>{fmtDateTime(x.created_at)}</small>
                      <small className="ol-items">{(x.order_items ?? []).map(i => `${i.product_name} × ${i.qty.toLocaleString('id-ID')}`).join(', ')}</small>
                    </span>
                    <span className="ol-side">
                      <b>{money(x.total)}</b>
                      <span className={`badge st-${x.status}`}>{ORDER_STATUS_LABEL[x.status]}</span>
                    </span>
                    <ChevronRight size={18} aria-hidden="true" />
                  </a>
                </li>
              ))}
            </ul>
          )}
      </section>

      <section aria-labelledby="profile-title" className="acctsec">
        <h2 id="profile-title">Data diri &amp; alamat</h2>
        <p className="hintline">Dipakai untuk mengisi form checkout secara otomatis.</p>
        <ProfileForm userId={user.id} initial={profile} />
      </section>
    </div>
  );
}
