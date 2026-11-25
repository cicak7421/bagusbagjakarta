'use client';
import { useEffect, useRef, useState } from 'react';

export type Pill = { label: string; href: string; sec: string; props?: Record<string, string> };

/** Bar pintasan di bawah layar; menyorot bagian halaman yang sedang terlihat. */
export default function PillBar({ pills }: { pills: Pill[] }) {
  const [active, setActive] = useState('');
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!('IntersectionObserver' in window)) return;
    const els = ['produk', 'carapesan', 'custom', 'about', 'faq', 'kontak'].map(id => document.getElementById(id)).filter((e): e is HTMLElement => !!e);
    const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) setActive(e.target.id); }), { rootMargin: '-45% 0px -50% 0px' });
    els.forEach(e => io.observe(e));
    return () => io.disconnect();
  }, []);
  useEffect(() => {
    const box = ref.current;
    const el = box?.querySelector<HTMLElement>('a.on');
    if (!el || !box || box.scrollWidth <= box.clientWidth) return;
    box.scrollTo({ left: el.offsetLeft - (box.clientWidth - el.offsetWidth) / 2, behavior: 'smooth' });
  }, [active]);
  return (
    <nav className="pillbar" aria-label="Pintasan bagian halaman">
      <div className="pillin" ref={ref}>
        {pills.map(x => <a key={x.label} href={x.href} {...x.props} className={x.sec && active === x.sec ? 'on' : ''} aria-current={x.sec && active === x.sec ? 'true' : undefined}>{x.label}</a>)}
      </div>
    </nav>
  );
}
