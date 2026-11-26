import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { ResetForm } from '@/components/auth-forms';
import { getSessionUser } from '@/lib/session';
import AuthFrame from '../auth-frame';

export const metadata: Metadata = { title: 'Password baru' };

export default async function ResetPage() {
  // Hanya bisa dibuka setelah klik link reset dari email (yang membuat sesi login sementara)
  const { user } = await getSessionUser();
  if (!user) redirect('/akun/masuk?e=link');
  return <AuthFrame><ResetForm /></AuthFrame>;
}
