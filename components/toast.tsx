'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Check, Info, X } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'info';
export type Notify = (text: string, type?: ToastType) => void;
type Item = { id: number; type: ToastType; text: string };

/** Notifikasi mengambang: tidak ikut ter-scroll, error tampil lebih lama & harus jelas terlihat. */
export function useToasts() {
  const [items, setItems] = useState<Item[]>([]);
  const seq = useRef(0);
  const timers = useRef<Map<number, ReturnType<typeof setTimeout>>>(new Map());

  const dismiss = useCallback((id: number) => {
    const t = timers.current.get(id);
    if (t) clearTimeout(t);
    timers.current.delete(id);
    setItems(x => x.filter(i => i.id !== id));
  }, []);

  const notify = useCallback<Notify>((text, type = 'info') => {
    const id = ++seq.current;
    setItems(x => [...x.slice(-3), { id, type, text }]);
    timers.current.set(id, setTimeout(() => dismiss(id), type === 'error' ? 9000 : 4500));
  }, [dismiss]);

  useEffect(() => { const m = timers.current; return () => { m.forEach(clearTimeout); m.clear(); }; }, []);

  return { items, notify, dismiss };
}

export function Toasts({ items, dismiss }: { items: Item[]; dismiss: (id: number) => void }) {
  return (
    <div className="toasts" aria-live="polite" aria-atomic="false">
      {items.map(t => (
        <div key={t.id} className={`toast ${t.type}`} role={t.type === 'error' ? 'alert' : 'status'}>
          <span className="toasticon">{t.type === 'success' ? <Check size={16} /> : t.type === 'error' ? <X size={16} /> : <Info size={16} />}</span>
          <span className="toasttext"><b>{t.type === 'success' ? 'Berhasil' : t.type === 'error' ? 'Gagal' : 'Info'}</b>{t.text}</span>
          <button type="button" aria-label="Tutup notifikasi" onClick={() => dismiss(t.id)}><X size={14} /></button>
        </div>
      ))}
    </div>
  );
}
