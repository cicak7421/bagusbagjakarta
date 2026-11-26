import { redirect } from 'next/navigation';
import { ArrowRight, ChevronRight, Info, Package, UserRound } from 'lucide-react';
import { getSessionUser } from '@/lib/session';
import { money } from '@/lib/format';
import { categories } from '@/lib/categories';
import { fmtDateTime, normalizeOrder, ORDER_STATUS_LABEL } from '@/lib/orders';
import { EmptyArt } from '@/components/site-chrome';
import { EMPTY_PROFILE, LogoutButton, ProfileForm, type Profile } from '@/components/account-view';

const num = (n: number) => n.toLocaleString('id-ID');

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
    <>
      <header className="shophead accthead">
        <div><h1>Akun saya</h1><p>{user.email}</p></div>
        <LogoutButton />
      </header>

      <div className="acct">
        <nav className="acctnav" aria-label="Menu akun">
          <a href="#orders-title"><Package size={18} aria-hidden="true" /> Pesanan</a>
          <a href="#profile-title"><UserRound size={18} aria-hidden="true" /> Data diri dan alamat</a>
        </nav>

        <div className="acctmain">
          <section aria-labelledby="orders-title" className="acctsec">
            <h2 id="orders-title">Pesanan saya</h2>
            {notReady ? <p className="msg" role="status"><Info aria-hidden="true" /><span>Riwayat pesanan belum tersedia. Silakan coba lagi nanti.</span></p>
              : orders.length === 0 ? (
                <div className="emptystate">
                  <EmptyArt />
                  <h3 className="emptystate-title">Belum ada pesanan</h3>
                  <p>Pesanan yang kamu buat akan tampil di sini, lengkap dengan statusnya.</p>
                  <a className="btn btn-primary" href="/produk">Lihat katalog <ArrowRight size={18} aria-hidden="true" /></a>
                  <div className="chips" aria-label="Kategori">
                    {Object.entries(categories).map(([slug, c]) => <a key={slug} className="chip" href={`/kategori/${slug}`}>{c.name}</a>)}
                  </div>
                </div>
              ) : (
                <ul className="orderlist">
                  {orders.map(x => {
                    const items = x.order_items ?? [];
                    const pcs = items.reduce((a, i) => a + i.qty, 0);
                    return (
                      <li key={x.order_number}>
                        <a href={`/akun/pesanan/${x.order_number}`}>
                          <Package className="ol-ico" size={20} aria-hidden="true" />
                          <span className="ol-main">
                            <b className="num">{x.order_number}</b>
                            <small>{fmtDateTime(x.created_at)}</small>
                            {items.length > 0 && <span className="ol-count num">{items.length} jenis barang · {num(pcs)} pcs</span>}
                            {items.length > 0 && <small className="ol-items">{items.map(i => i.product_name).join(', ')}</small>}
                          </span>
                          <span className="ol-side">
                            <b className="num">{money(x.total)}</b>
                            <span className={`badge st-${x.status}`}>{ORDER_STATUS_LABEL[x.status]}</span>
                            {x.status === 'pending_payment' && <span className="linkbtn ol-pay">Bayar sekarang</span>}
                          </span>
                          <ChevronRight className="ol-chev" size={18} aria-hidden="true" />
                        </a>
                      </li>
                    );
                  })}
                </ul>
              )}
          </section>

          <section aria-labelledby="profile-title" className="acctsec">
            <h2 id="profile-title">Data diri dan alamat</h2>
            <p className="acctsec-sub">Dipakai untuk mengisi form checkout secara otomatis.</p>
            <div className="boxed">
              <ProfileForm userId={user.id} initial={profile} />
            </div>
          </section>
        </div>
      </div>
    </>
  );
}
