/* eslint-disable @next/next/no-img-element */
'use client';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { X } from 'lucide-react';
import type { PromoPopup as Promo } from '@/lib/types';
import { normalizePromo, promoHasContent, promoKey } from '@/lib/promo';
import { responsiveImg } from '@/lib/img';

type Size = { w: number; h: number };

/** Tampilan popup (dipakai website dan pratinjau di admin). Tutup: tombol X, klik area gelap, atau Esc. */
export function PromoModal({ promo, onClose, imgSize }: { promo: Promo; onClose: () => void; imgSize?: Size }) {
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
  // Gambar yang gagal dimuat (misalnya filenya sudah dihapus dari storage) dilepas dari popup,
  // lalu popup memakai tata letak "teks saja" (class promo-card--text).
  const [imgFailed, setImgFailed] = useState(false);
  useEffect(() => setImgFailed(false), [promo.image_url]);
  const showImg = !!promo.image_url && !imgFailed;
  return (
    <div className="promo-overlay" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className={showImg ? 'promo-card' : 'promo-card promo-card--text'} role="dialog" aria-modal="true" aria-label={promo.title || 'Promo'}>
        <button ref={closeRef} type="button" className="promo-close" aria-label="Tutup popup" onClick={onClose}><X size={20} /></button>
        {showImg && (
          <img
            className="promo-img"
            {...responsiveImg(promo.image_url, [640, 828], '(max-width: 480px) 100vw, 440px')}
            alt={promo.title || 'Promo'}
            {...(imgSize ? { width: imgSize.w, height: imgSize.h } : {})}
            decoding="async"
            onError={() => setImgFailed(true)}
          />
        )}
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

/**
 * Popup otomatis. Setelah ditutup tidak muncul lagi selama sesi browser, kecuali isinya diganti admin.
 *
 * Performa: popup sengaja TIDAK muncul saat halaman baru dimuat. Kalau muncul di detik pertama,
 * gambarnya jadi kandidat LCP dan merusak skor. Jadi popup baru dibuka setelah halaman selesai
 * dimuat dan pengunjung mulai berinteraksi (scroll/sentuh/klik), atau paling lambat sekitar 6 detik.
 * Gambar dimuat dulu di latar belakang; popup baru tampil setelah gambar siap (tanpa layout shift).
 */
export default function PromoPopup({ promo }: { promo?: Promo | null }) {
  const p = useMemo(() => normalizePromo(promo), [promo]);
  const [open, setOpen] = useState(false);
  const [size, setSize] = useState<Size | undefined>();
  const [noImg, setNoImg] = useState(false);   // gambar gagal dimuat saat pramuat: popup tampil tanpa gambar, tidak diminta ulang
  const key = `promo-dismissed:${promoKey(p)}`;

  useEffect(() => {
    if (!p.enabled || !promoHasContent(p)) return;
    try { if (sessionStorage.getItem(key)) return; } catch { /* storage diblokir → tetap tampilkan */ }

    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const events = ['scroll', 'pointerdown', 'keydown', 'touchstart'] as const;
    const cleanup = () => { events.forEach(e => window.removeEventListener(e, trigger)); if (timer) clearTimeout(timer); };

    const show = () => {
      if (cancelled) return;
      if (!p.image_url) { setOpen(true); return; }
      const img = new window.Image();
      const { src, srcSet, sizes } = responsiveImg(p.image_url, [640, 828], '(max-width: 480px) 100vw, 440px') as { src: string; srcSet?: string; sizes?: string };
      if (srcSet) { img.srcset = srcSet; img.sizes = sizes ?? ''; }
      img.src = src;
      const done = (ok: boolean) => {
        if (cancelled) return;
        if (ok && img.naturalWidth) setSize({ w: img.naturalWidth, h: img.naturalHeight });
        // Gagal muat gambar: tetap tampilkan popup kalau masih ada teks
        if (!ok) setNoImg(true);
        if (ok || p.title || p.text) setOpen(true);
      };
      img.onload = () => done(true);
      img.onerror = () => done(false);
    };

    function trigger() { cleanup(); setTimeout(show, 800); }
    const arm = () => {
      events.forEach(e => window.addEventListener(e, trigger, { passive: true, once: true }));
      timer = setTimeout(trigger, 6000);
    };
    if (document.readyState === 'complete') arm();
    else window.addEventListener('load', arm, { once: true });

    return () => { cancelled = true; cleanup(); window.removeEventListener('load', arm); };
  }, [p, key]);

  const close = useCallback(() => {
    setOpen(false);
    try { sessionStorage.setItem(key, '1'); } catch { /* abaikan */ }
  }, [key]);

  const shown = useMemo(() => (noImg ? { ...p, image_url: '' } : p), [p, noImg]);
  return open ? <PromoModal promo={shown} onClose={close} imgSize={size} /> : null;
}
