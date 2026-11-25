'use client';
import { ShoppingBag, User } from 'lucide-react';
import { useCart } from '@/lib/cart';

/** Ikon akun + keranjang di navbar. Jumlah keranjang dibaca dari browser, jadi halaman tetap bisa di-cache. */
export default function HeaderActions() {
  const count = useCart().length;
  return (
    <div className="hactions">
      <a className="hbtn" href="/akun" aria-label="Akun saya"><User size={20} /></a>
      <a className="hbtn" href="/keranjang" aria-label={count ? `Keranjang, ${count} barang` : 'Keranjang'}>
        <ShoppingBag size={20} />
        {count > 0 && <span className="hbadge" aria-hidden="true">{count}</span>}
      </a>
    </div>
  );
}
