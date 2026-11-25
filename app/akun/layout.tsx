import type { Metadata } from 'next';
import { getData } from '@/lib/data';
import { SiteFooter, SiteHeader } from '@/components/site-chrome';

export const metadata: Metadata = { title: 'Akun saya', robots: { index: false, follow: false } };

export default async function AccountLayout({ children }: { children: React.ReactNode }) {
  const { settings } = await getData();
  return (
    <>
      <SiteHeader settings={settings} checkout />
      <main className="container shop">{children}</main>
      <SiteFooter settings={settings} checkout />
    </>
  );
}
