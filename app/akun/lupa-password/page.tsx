import type { Metadata } from 'next';
import { ForgotForm } from '@/components/auth-forms';
import AuthFrame from '../auth-frame';

export const metadata: Metadata = { title: 'Lupa password' };

export default function ForgotPage() { return <AuthFrame><ForgotForm /></AuthFrame>; }
