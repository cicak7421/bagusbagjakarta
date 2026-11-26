import type { Metadata } from 'next';
import { getData } from '@/lib/data';
import { StoreShell, catalogMoq } from '@/components/site-chrome';

// Judul berupa objek supaya pola "… | Tre Joy Ease Indonesia" dari app/layout.tsx tetap berlaku untuk halaman di bawah /akun
// (judul layout berupa string memutus template untuk halaman anaknya).
export const metadata: Metadata = { title: { default: 'Akun saya', template: '%s | Tre Joy Ease Indonesia' }, robots: { index: false, follow: false } };

export default async function AccountLayout({ children }: { children: React.ReactNode }) {
  const { settings, products } = await getData();
  return (
    <StoreShell settings={settings} checkout moq={catalogMoq(products)}>
      <main id="konten" className="container container--form flowpage">{children}</main>
    </StoreShell>
  );
}
