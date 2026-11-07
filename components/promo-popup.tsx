/* eslint-disable @next/next/no-img-element */
'use client';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { X } from 'lucide-react';
import type { PromoPopup as Promo } from '@/lib/types';
import { normalizePromo, promoHasContent, promoKey } from '@/lib/promo';

/** Tampilan popup (dipakai website dan pratinjau di admin). Tutup: tombol X, klik area gelap, atau Esc. */
export function PromoModal({ promo, onClose }: { promo: Promo; onClose: () => void }) {
  const closeRef = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    closeRef.current?.focus();
    return () => { document.body.style.overflow = prev; window.removeEventListener('keydown', onKey); };
  }, [onClose]);

  const external = /^https?:\/\//.test(promo.button_url);
  const hasBody = !!(promo.title || promo.text || promo.button_label);
  return (
    <div className="promo-overlay" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="promo-card" role="dialog" aria-modal="true" aria-label={promo.title || 'Promo'}>
        <button ref={closeRef} type="button" className="promo-close" aria-label="Tutup popup" onClick={onClose}><X size={20} /></button>
        {promo.image_url && <img className="promo-img" src={promo.image_url} alt={promo.title || 'Promo'} />}
        {hasBody && (
          <div className="promo-body">
            {promo.title && <h2>{promo.title}</h2>}
            {promo.text && <p>{promo.text}</p>}
            {promo.button_label && <a className="primary" href={promo.button_url} onClick={onClose} {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}>{promo.button_label}</a>}
          </div>
        )}
      </div>
    </div>
  );
}

/** Popup otomatis saat website dibuka. Setelah ditutup tidak muncul lagi selama sesi browser, kecuali isinya diganti admin. */
export default function PromoPopup({ promo }: { promo?: Promo | null }) {
  const p = useMemo(() => normalizePromo(promo), [promo]);
  const [open, setOpen] = useState(false);
  const key = `promo-dismissed:${promoKey(p)}`;

  useEffect(() => {
    if (!p.enabled || !promoHasContent(p)) return;
    try { if (sessionStorage.getItem(key)) return; } catch { /* storage diblokir → tetap tampilkan */ }
    const t = setTimeout(() => setOpen(true), 500);
    return () => clearTimeout(t);
  }, [p, key]);

  const close = useCallback(() => {
    setOpen(false);
    try { sessionStorage.setItem(key, '1'); } catch { /* abaikan */ }
  }, [key]);

  return open ? <PromoModal promo={p} onClose={close} /> : null;
}
