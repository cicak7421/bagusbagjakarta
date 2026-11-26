'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { ChevronRight, Menu, MessageCircle, X } from 'lucide-react';
import type { NavLink } from '@/lib/types';
import { navAnchorProps } from '@/lib/nav';

const isShop = (url: string) => /^\/(produk|kategori)(\/|\?|$)/.test(url);
const isAccount = (url: string) => /^\/(keranjang|akun)(\/|\?|$)/.test(url);

/**
 * Laci menu untuk layar kecil (di bawah 900px), masuk dari kiri.
 * Link dikelompokkan dari url-nya: Belanja (/produk, /kategori), Akun (/keranjang, /akun), Informasi (sisanya, termasuk menu dari admin).
 * Menutup lewat tombol tutup, ketuk area gelap, Esc, atau saat link dipilih. Fokus pindah ke tombol tutup saat dibuka
 * dan kembali ke tombol menu saat ditutup. Gulir halaman dikunci selama laci terbuka.
 */
export default function MobileMenu({ links, wa, address, brand }: { links: NavLink[]; wa?: string; address?: string; brand?: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const [host, setHost] = useState<Element | null>(null);
  const openBtn = useRef<HTMLButtonElement>(null);
  const closeBtn = useRef<HTMLButtonElement>(null);
  const panel = useRef<HTMLDivElement>(null);

  // Laci dirender ke akar .toko (bukan di dalam header lengket) supaya berada di atas bar bawah dan tombol mengambang.
  const show = () => { setHost(openBtn.current?.closest('.toko') ?? document.body); setOpen(true); };
  const close = useCallback(() => { setOpen(false); openBtn.current?.focus(); }, []);

  useEffect(() => {
    if (!open) return;
    const root = document.documentElement;
    const prevOverflow = root.style.overflow;
    root.style.overflow = 'hidden';
    closeBtn.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { close(); return; }
      if (e.key !== 'Tab' || !panel.current) return;
      const items = panel.current.querySelectorAll<HTMLElement>('a[href],button:not([disabled])');
      if (!items.length) return;
      const first = items[0], last = items[items.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    };
    const desktop = window.matchMedia('(min-width:900px)');
    const onResize = () => { if (desktop.matches) setOpen(false); };
    document.addEventListener('keydown', onKey);
    desktop.addEventListener('change', onResize);
    return () => {
      root.style.overflow = prevOverflow;
      document.removeEventListener('keydown', onKey);
      desktop.removeEventListener('change', onResize);
    };
  }, [open, close]);

  if (!links.length) return null;

  const groups = [
    { title: 'Belanja', items: links.filter(l => isShop(l.url)) },
    { title: 'Akun', items: links.filter(l => isAccount(l.url)) },
    { title: 'Informasi', items: links.filter(l => !isShop(l.url) && !isAccount(l.url)) },
  ].filter(g => g.items.length);

  return (
    <div className="mnav">
      <button ref={openBtn} type="button" className="mnav-btn" aria-label="Buka menu" aria-haspopup="dialog" aria-expanded={open} aria-controls="mnav-panel" onClick={show}>
        <Menu size={22} aria-hidden="true" />
      </button>
      {open && host && createPortal(
        <>
          <div className="mnav-overlay" aria-hidden="true" onClick={close} />
          <div id="mnav-panel" className="mnav-panel" ref={panel} role="dialog" aria-modal="true" aria-label="Menu">
            <div className="mnav-head">
              {brand}
              <button ref={closeBtn} type="button" className="mnav-btn" aria-label="Tutup menu" onClick={close}><X size={22} aria-hidden="true" /></button>
            </div>
            <nav className="mnav-body" aria-label="Menu">
              {groups.map(g => (
                <div className="mnav-group" key={g.title}>
                  <p className="seclabel">{g.title}</p>
                  {g.items.map(l => (
                    <a key={`${l.label}-${l.url}`} href={l.url} {...navAnchorProps(l)} onClick={() => setOpen(false)}>
                      <span>{l.label}</span><ChevronRight size={18} aria-hidden="true" />
                    </a>
                  ))}
                </div>
              ))}
            </nav>
            {(wa || address) && (
              <div className="mnav-foot">
                {wa && <a className="btn btn-wa btn-block" href={wa} target="_blank" rel="noopener noreferrer" onClick={() => setOpen(false)}><MessageCircle size={18} aria-hidden="true" /> Chat WhatsApp</a>}
                {address && <p>Dikirim dari {address}</p>}
              </div>
            )}
          </div>
        </>,
        host,
      )}
    </div>
  );
}
