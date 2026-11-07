import type { SiteSettings } from '@/lib/types';
import { DEFAULT_NAV_LINKS } from '@/lib/nav';

export const demoSettings: SiteSettings = {
  company_name: 'PT Tre Joy Ease Indonesia',
  tagline: 'Partner goodie bag untuk bisnis yang terus bergerak.',
  about: 'Kami membantu reseller, event organizer, corporate, dan retail mendapatkan goodie bag yang rapi, konsisten, dan fleksibel untuk kebutuhan branding.',
  hero_title: 'Goodie Bag yang Bikin Brand Lebih Diingat.',
  hero_subtitle: 'Ready stock untuk gerak cepat. Custom untuk kebutuhan branding yang lebih personal.',
  hero_image_url: 'https://images.unsplash.com/photo-1594223274512-ad4803739b7c?auto=format&fit=crop&w=1800&q=85',
  hero_video_url: '',
  address: 'Jakarta, Indonesia',
  google_maps_url: 'https://maps.google.com/?q=Jakarta, Indonesia',
  whatsapp_number: process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || '6281234567890',
  whatsapp_message: 'Halo Tre Joy Ease, saya ingin konsultasi produk goodie bag.',
  payment_info: 'Pembayaran dikonfirmasi melalui WhatsApp. Admin akan mengirim detail rekening/metode pembayaran setelah pesanan disepakati.',
  nav_links: DEFAULT_NAV_LINKS,
};

