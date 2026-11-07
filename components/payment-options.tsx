import { Clock, MessageCircle, ShieldCheck } from 'lucide-react';
import { paymentMethods } from '@/lib/payments';

/** Daftar metode bayar. Mitra Trans tampil sebagai "Segera hadir" (nonaktif). */
export function PaymentOptions({ compact = false }: { compact?: boolean }) {
  return (
    <ul className={compact ? 'paylist compact' : 'paylist'} aria-label="Metode pembayaran">
      {paymentMethods.map(m => (
        <li key={m.id} className={m.status === 'coming_soon' ? 'payitem soon' : 'payitem'}>
          <span className="payicon">{m.id === 'whatsapp' ? <MessageCircle size={18} /> : <ShieldCheck size={18} />}</span>
          <span className="paytext">
            <b>{m.name}</b>
            {!compact && <small>{m.description}</small>}
          </span>
          {m.status === 'coming_soon'
            ? <em className="soonbadge"><Clock size={12} /> Segera hadir</em>
            : <em className="livebadge">Aktif</em>}
        </li>
      ))}
    </ul>
  );
}
