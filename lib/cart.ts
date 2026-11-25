'use client';
import { useSyncExternalStore } from 'react';

/**
 * Keranjang belanja — disimpan di browser (localStorage).
 * Harga di sini hanya untuk TAMPILAN. Saat checkout, server menghitung ulang semuanya dari database.
 */
export type CartItem = {
  key: string;
  product_id: string;
  slug: string;
  name: string;
  category: string;
  image: string;
  color: string | null;
  motif: string | null;
  size: string | null;
  unit: number;
  qty: number;
  min_order: number;
};

const KEY = 'tje_cart_v1';
const EVENT = 'tje:cart';
export const MAX_CART_LINES = 20;
const EMPTY: CartItem[] = [];
let memo: { raw: string | null; items: CartItem[] } = { raw: null, items: EMPTY };

function read(): CartItem[] {
  if (typeof window === 'undefined') return EMPTY;
  let raw: string | null = null;
  try { raw = localStorage.getItem(KEY); } catch { return EMPTY; }
  if (raw === memo.raw) return memo.items;
  let items: CartItem[] = EMPTY;
  try {
    const parsed: unknown = raw ? JSON.parse(raw) : [];
    if (Array.isArray(parsed)) {
      items = (parsed as CartItem[])
        .filter(x => x && typeof x.product_id === 'string' && typeof x.name === 'string' && Number.isFinite(x.qty) && Number.isFinite(x.unit))
        .slice(0, MAX_CART_LINES);
    }
  } catch { items = EMPTY; }
  memo = { raw, items };
  return items;
}

function write(items: CartItem[]) {
  try { localStorage.setItem(KEY, JSON.stringify(items.slice(0, MAX_CART_LINES))); } catch { /* storage penuh/diblokir */ }
  window.dispatchEvent(new Event(EVENT));
}

export const cartKey = (i: Pick<CartItem, 'product_id' | 'color' | 'motif' | 'size'>) => [i.product_id, i.color ?? '', i.motif ?? '', i.size ?? ''].join('|');

/** Tambah ke keranjang. Mengembalikan false kalau keranjang sudah penuh. */
export function addToCart(item: Omit<CartItem, 'key'>) {
  const key = cartKey(item);
  const items = [...read()];
  const i = items.findIndex(x => x.key === key);
  if (i >= 0) items[i] = { ...items[i], ...item, key, qty: Math.min(100000, items[i].qty + item.qty) };
  else { if (items.length >= MAX_CART_LINES) return false; items.push({ ...item, key }); }
  write(items);
  return true;
}
export function setCartQty(key: string, qty: number) {
  write(read().map(x => (x.key === key ? { ...x, qty: Math.min(100000, Math.max(x.min_order, Math.floor(qty) || x.min_order)) } : x)));
}
export const removeFromCart = (key: string) => write(read().filter(x => x.key !== key));
export const clearCart = () => write([]);

function subscribe(cb: () => void) {
  window.addEventListener(EVENT, cb);
  window.addEventListener('storage', cb);
  return () => { window.removeEventListener(EVENT, cb); window.removeEventListener('storage', cb); };
}
/** Isi keranjang (reaktif, sinkron antar tab). Di server selalu kosong. */
export const useCart = () => useSyncExternalStore(subscribe, read, () => EMPTY);
export const cartTotal = (items: CartItem[]) => items.reduce((a, x) => a + x.unit * x.qty, 0);
