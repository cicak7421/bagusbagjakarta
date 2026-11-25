import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { LoginForm } from '@/components/auth-forms';
import { getSessionUser } from '@/lib/session';
import { safeNext } from '@/lib/orders';

export const metadata: Metadata = { title: 'Masuk' };

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string; e?: string }> }) {
  const { next, e } = await searchParams;
  const { user } = await getSessionUser();
  if (user) redirect(safeNext(next));
  const notice = e === 'link' ? 'Link sudah tidak berlaku atau sudah dipakai. Silakan masuk, atau minta link baru.' : undefined;
  return <LoginForm next={next} notice={notice} />;
}
