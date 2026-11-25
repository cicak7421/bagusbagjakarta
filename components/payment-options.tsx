import { MessageCircle, QrCode } from 'lucide-react';
import { paymentMethods } from '@/lib/payments';

/** Daftar metode bayar. QRIS hanya ditampilkan kalau checkout online aktif. */
export function PaymentOptions({ compact = false, qris = false }: { compact?: boolean; qris?: boolean }) {
  return (
    <ul className={compact ? 'paylist compact' : 'paylist'} aria-label="Metode pembayaran">
      {paymentMethods.filter(m => qris || m.id !== 'qris').map(m => (
        <li key={m.id} className="payitem">
          <span className="payicon">{m.id === 'whatsapp' ? <MessageCircle size={18} /> : <QrCode size={18} />}</span>
          <span className="paytext">
            <b>{m.name}</b>
            {!compact && <small>{m.description}</small>}
          </span>
        </li>
      ))}
    </ul>
  );
}
