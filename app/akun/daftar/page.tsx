import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { RegisterForm } from '@/components/auth-forms';
import { getSessionUser } from '@/lib/session';
import { safeNext } from '@/lib/orders';

export const metadata: Metadata = { title: 'Daftar akun' };

export default async function RegisterPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const { next } = await searchParams;
  const { user } = await getSessionUser();
  if (user) redirect(safeNext(next));
  return <RegisterForm next={next} />;
}
