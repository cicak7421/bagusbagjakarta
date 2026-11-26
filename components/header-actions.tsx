'use client';
import { ShoppingBag, User } from 'lucide-react';
import { useCart } from '@/lib/cart';

/**
 * Ikon akun + keranjang di header. Jumlah keranjang dibaca dari browser, jadi halaman tetap bisa di-cache.
 * Desktop: ikon + label kecil di bawahnya. HP: ikon saja (label disembunyikan lewat CSS).
 */
export default function HeaderActions() {
  const count = useCart().length;
  return (
    <div className="hactions">
      <a className="hbtn" href="/akun" aria-label="Akun saya">
        <User size={20} aria-hidden="true" />
        <span className="hbtn-label" aria-hidden="true">Akun</span>
      </a>
      <a className="hbtn" href="/keranjang" aria-label={count ? `Keranjang, ${count} barang` : 'Keranjang'}>
        <ShoppingBag size={20} aria-hidden="true" />
        <span className="hbtn-label" aria-hidden="true">Keranjang</span>
        {count > 0 && <span className="hbadge" aria-hidden="true">{count > 99 ? '99+' : count}</span>}
      </a>
    </div>
  );
}
