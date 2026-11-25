import type { Metadata } from 'next';
import { ForgotForm } from '@/components/auth-forms';

export const metadata: Metadata = { title: 'Lupa password' };

export default function ForgotPage() { return <ForgotForm />; }
