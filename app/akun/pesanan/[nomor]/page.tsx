import type { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';
import { Check, ChevronRight, Truck } from 'lucide-react';
import { getSessionUser } from '@/lib/session';
import { getData } from '@/lib/data';
import { money } from '@/lib/format';
import { safeUrl } from '@/lib/safe';
import { optimizedSrc } from '@/lib/img';
import { midtransConfigured } from '@/lib/midtrans';
import { createAdminClient } from '@/lib/supabase/admin';
import PayPanel from '@/components/pay-panel';
import {
  CUSTOMER_ORDER_COLUMNS, fmtDateTime, isOrderNumber, normalizeOrder, ORDER_STATUS_LABEL, ORDER_STEPS, PAYMENT_STATUS_LABEL, QRIS_MAX_AMOUNT, variantLabel,
} from '@/lib/orders';

type Props = { params: Promise<{ nomor: string }>; searchParams: Promise<{ baru?: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { nomor } = await params;
  return { title: `Pesanan ${isOrderNumber(nomor) ? nomor : ''}`.trim() };
}

export default async function OrderPage({ params, searchParams }: Props) {
  const [{ nomor }, { baru }] = await Promise.all([params, searchParams]);
  if (!isOrderNumber(nomor)) notFound();
  const { supabase, user } = await getSessionUser();
  if (!supabase || !user) redirect(`/akun/masuk?next=${encodeURIComponent(`/akun/pesanan/${nomor}`)}`);

  // RLS memastikan customer hanya bisa membaca pesanannya sendiri; filter user_id mencegah admin membuka pesanan orang di halaman ini
  const { data } = await supabase.from('orders').select(`${CUSTOMER_ORDER_COLUMNS},order_items(*)`).eq('order_number', nomor).eq('user_id', user.id).maybeSingle();
  if (!data) notFound();
  const o = normalizeOrder(data as unknown as Record<string, unknown>);
  const { settings } = await getData();

  const stepIndex = ORDER_STEPS.indexOf(o.status);
  const cancelled = o.status === 'cancelled';
  const overLimit = o.total > QRIS_MAX_AMOUNT;
  const qrisAvailable = o.payment_method === 'qris' && !overLimit && midtransConfigured() && !!createAdminClient();
  const waText = `Halo ${settings.company_name}, saya ingin konfirmasi pesanan ${o.order_number} (total ${money(o.total)}).`;
  const waHref = `https://wa.me/${settings.whatsapp_number.replace(/\D/g, '')}?text=${encodeURIComponent(waText)}`;
  const addr = [o.shipping_address, o.shipping_city, o.shipping_postal_code].filter(Boolean).join(', ');

  return (
    <div className="orderpage">
      <nav className="crumbs" aria-label="Breadcrumb"><a href="/akun">Akun saya</a><ChevronRight size={14} /><span aria-current="page">{o.order_number}</span></nav>
      {baru === '1' && o.status === 'pending_payment' && <div className="notice" role="status">Pesanan berhasil dibuat. Selesaikan pembayaran supaya pesanan langsung kami proses.</div>}
      <header className="shophead">
        <div><h1>Pesanan {o.order_number}</h1><p>Dibuat {fmtDateTime(o.created_at)}</p></div>
        <span className={`badge big st-${o.status}`}>{ORDER_STATUS_LABEL[o.status]}</span>
      </header>

      {!cancelled && (
        <ol className="progress" aria-label="Status pesanan">
          {ORDER_STEPS.map((s, i) => (
            <li key={s} className={i < stepIndex ? 'done' : i === stepIndex ? 'now' : ''} aria-current={i === stepIndex ? 'step' : undefined}>
              <span className="pdot">{i < stepIndex ? <Check size={14} /> : i + 1}</span>{ORDER_STATUS_LABEL[s]}
            </li>
          ))}
        </ol>
      )}

      <div className="ordergrid">
        <div className="ordermain">
          <section className="boxed" aria-labelledby="items-title">
            <h2 id="items-title">Barang</h2>
            <ul className="lines">
              {(o.order_items ?? []).map(it => (
                <li key={it.id}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  {safeUrl(it.image_url) ? <img src={optimizedSrc(safeUrl(it.image_url), 256)} alt="" width={64} height={64} loading="lazy" /> : <span className="noimg64" />}
                  <span className="ln-main"><b>{it.product_slug ? <a href={`/produk/${it.product_slug}`}>{it.product_name}</a> : it.product_name}</b><small>{variantLabel(it)}</small><small>{it.qty.toLocaleString('id-ID')} pcs × {money(it.unit_price)}</small></span>
                  <b className="ln-total">{money(it.line_total)}</b>
                </li>
              ))}
            </ul>
            <dl className="sums">
              <div><dt>Subtotal</dt><dd>{money(o.subtotal)}</dd></div>
              <div><dt>Ongkos kirim</dt><dd>{o.shipping_cost > 0 ? money(o.shipping_cost) : 'Dikonfirmasi admin'}</dd></div>
              <div className="grand"><dt>Total</dt><dd>{money(o.total)}</dd></div>
            </dl>
          </section>

          <section className="boxed" aria-labelledby="ship-title">
            <h2 id="ship-title">Pengiriman</h2>
            <p className="shipto"><b>{o.customer_name}</b>{o.company && ` · ${o.company}`}<br />{o.customer_phone}<br />{addr}</p>
            {o.notes && <p className="shipnote">Catatan: {o.notes}</p>}
            {(o.courier || o.tracking_number) && <p className="track"><Truck size={18} aria-hidden="true" /><span>{o.courier || 'Kurir'}{o.tracking_number && <> · No. resi <b>{o.tracking_number}</b></>}</span></p>}
          </section>
        </div>

        <aside className="orderside">
          {o.status === 'pending_payment' ? (
            <PayPanel orderNumber={o.order_number} total={o.total} paymentStatus={o.payment_status} qrUrl={o.payment_qr_url} expiresAt={o.payment_expires_at} qrisAvailable={qrisAvailable} overLimit={overLimit} waHref={waHref} />
          ) : (
            <div className="paypanel">
              <h2>Pembayaran</h2>
              <div className="paytotal"><span>Total</span><b>{money(o.total)}</b></div>
              <p className="paynote"><b>{PAYMENT_STATUS_LABEL[o.payment_status]}</b>{o.paid_at && <><br />{fmtDateTime(o.paid_at)}</>}</p>
              {cancelled && o.payment_status === 'paid' && <p className="paynote">Pesanan dibatalkan setelah dibayar. Admin akan menghubungi kamu soal pengembalian dana.</p>}
              <div className="payfoot"><a href={waHref} target="_blank" rel="noopener noreferrer">Butuh bantuan? Chat admin</a></div>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}
