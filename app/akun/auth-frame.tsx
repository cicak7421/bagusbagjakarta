import { History, MapPin, Package } from 'lucide-react';
import { LogoMark } from '@/components/site-chrome';

/**
 * Bingkai halaman masuk / daftar / lupa password / password baru:
 * kolom kiri berisi manfaat akun (hanya desktop), kolom kanan berisi form (children).
 * Class .authgrid juga dipakai app/theme.css untuk meringkas header di halaman-halaman ini.
 */
export default function AuthFrame({ children }: { children: React.ReactNode }) {
  return (
    <div className="authgrid">
      <aside className="authside panel-soft" aria-label="Manfaat punya akun">
        <LogoMark size={48} />
        <p className="seclabel">Akun pelanggan</p>
        <p className="authside-title">Akun untuk pesanan grosir kamu</p>
        <ul className="authside-list">
          <li><Package size={20} aria-hidden="true" /><span>Pantau status pesanan</span></li>
          <li><MapPin size={20} aria-hidden="true" /><span>Alamat tersimpan, checkout lebih cepat</span></li>
          <li><History size={20} aria-hidden="true" /><span>Riwayat pesanan tersimpan</span></li>
        </ul>
      </aside>
      {children}
    </div>
  );
}
