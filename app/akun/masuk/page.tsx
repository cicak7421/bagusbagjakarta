import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { LoginForm } from '@/components/auth-forms';
import { getSessionUser } from '@/lib/session';
import { safeNext } from '@/lib/orders';
import AuthFrame from '../auth-frame';

export const metadata: Metadata = { title: 'Masuk' };

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string; e?: string }> }) {
  const { next, e } = await searchParams;
  const { user } = await getSessionUser();
  if (user) redirect(safeNext(next));
  const notice = e === 'link' ? 'Link sudah tidak berlaku atau sudah dipakai. Silakan masuk, atau minta link baru.'
    : safeNext(next).startsWith('/checkout') ? 'Masuk dulu untuk melanjutkan checkout. Keranjang kamu tetap tersimpan.'
    : undefined;
  return <AuthFrame><LoginForm next={next} notice={notice} /></AuthFrame>;
}
