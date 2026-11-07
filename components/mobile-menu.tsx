'use client';
import { useEffect, useRef, useState } from 'react';
import { Menu, X } from 'lucide-react';
import type { NavLink } from '@/lib/types';
import { navAnchorProps } from '@/lib/nav';

/** Menu hamburger untuk layar kecil (menu desktop disembunyikan di bawah 900px). Menutup sendiri saat link dipilih, di luar menu diketuk, atau Esc. */
export default function MobileMenu({ links }: { links: NavLink[] }) {
  const [open, setOpen] = useState(false);
  const box = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const onDown = (e: Event) => { if (box.current && !box.current.contains(e.target as Node)) setOpen(false); };
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('pointerdown', onDown);
    document.addEventListener('keydown', onKey);
    return () => { document.removeEventListener('pointerdown', onDown); document.removeEventListener('keydown', onKey); };
  }, [open]);
  if (!links.length) return null;
  return (
    <div className="mnav" ref={box}>
      <button type="button" className="mnav-btn" aria-label={open ? 'Tutup menu' : 'Buka menu'} aria-expanded={open} onClick={() => setOpen(o => !o)}>{open ? <X size={22} /> : <Menu size={22} />}</button>
      {open && (
        <nav className="mnav-panel" aria-label="Menu">
          {links.map(l => <a key={`${l.label}-${l.url}`} href={l.url} {...navAnchorProps(l)} onClick={() => setOpen(false)}>{l.label}</a>)}
        </nav>
      )}
    </div>
  );
}
