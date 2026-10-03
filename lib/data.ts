import { createClient } from '@/lib/supabase/server';
import type { Product, SiteSettings } from '@/lib/types';

export const demoSettings: SiteSettings = {
  company_name:'PT Tre Joy Ease Indonesia', tagline:'Partner goodie bag untuk bisnis yang terus bergerak.',
  about:'Kami membantu reseller, event organizer, corporate, dan retail mendapatkan goodie bag yang rapi, konsisten, dan fleksibel untuk kebutuhan branding.',
  hero_title:'Goodie Bag yang Bikin Brand Lebih Diingat.', hero_subtitle:'Ready stock untuk gerak cepat. Custom untuk kebutuhan branding yang lebih personal.',
  hero_image_url:'https://images.unsplash.com/photo-1594223274512-ad4803739b7c?auto=format&fit=crop&w=1800&q=85', hero_video_url:'',
  address:'Jakarta, Indonesia', google_maps_url:'https://maps.google.com/?q=Jakarta, Indonesia', whatsapp_number:process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || '6281234567890',
  whatsapp_message:'Halo Tre Joy Ease, saya ingin konsultasi produk goodie bag.', payment_info:'Pembayaran dikonfirmasi melalui WhatsApp. Admin akan mengirim detail rekening/metode pembayaran setelah pesanan disepakati.'
};
const demoProducts: Product[] = [
 {id:'1',name:'Spunbond Basic',slug:'spunbond-basic',category:'Spunbond',description:'Ringan, ekonomis, cocok untuk event, promosi, dan reseller.',size:'25 × 35 cm',price:6500,min_order:100,stock_qty:1200,image_url:'https://images.unsplash.com/photo-1601593346740-925612772716?auto=format&fit=crop&w=900&q=80',is_customizable:true,is_active:true,sort_order:1},
 {id:'2',name:'Paperbag Premium',slug:'paperbag-premium',category:'Paperbag',description:'Tampilan premium dengan area cetak yang luas untuk branding.',size:'24 × 10 × 32 cm',price:12500,min_order:100,stock_qty:680,image_url:'https://images.unsplash.com/photo-1605733513597-a8f8341084e6?auto=format&fit=crop&w=900&q=80',is_customizable:true,is_active:true,sort_order:2},
 {id:'3',name:'Coolerbag Daily',slug:'coolerbag-daily',category:'Coolerbag',description:'Bag insulated untuk makanan, minuman, hampers, dan corporate gift.',size:'22 × 15 × 18 cm',price:28500,min_order:50,stock_qty:320,image_url:'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=900&q=80',is_customizable:true,is_active:true,sort_order:3}
];
export async function getData() {
  let settings = demoSettings, products = demoProducts;
  try { const supabase = await createClient(); const [s,p] = await Promise.all([supabase.from('site_settings').select('*').single(), supabase.from('products').select('*').eq('is_active',true).order('sort_order')]); if(s.data) settings=s.data; if(p.data?.length) products=p.data; } catch {}
  return { settings, products };
}
