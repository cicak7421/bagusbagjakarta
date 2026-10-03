# Tre Joy Ease Indonesia — Goodie Bag Store

Modern B2B/reseller storefront built with Next.js + Supabase. Includes catalog, live stock fields, custom bag section, WhatsApp checkout, Google Maps, and an admin panel for content/product updates without editing HTML.

## Stack
- Next.js App Router + TypeScript
- Supabase Auth + Postgres + Storage
- Responsive CSS, blue/orange visual system
- Ready for GitHub + Vercel

## Setup
1. `cp .env.example .env.local`
2. Fill `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, and `NEXT_PUBLIC_WHATSAPP_NUMBER`.
3. In Supabase SQL Editor, run `supabase/schema.sql`.
4. In Supabase Auth > Users, create the admin email/password.
5. `npm install`
6. `npm run dev`
7. Open `/admin` for the control panel.

## Admin capabilities
- Company/about text
- Hero image and MP4 video URL
- Address, Google Maps URL
- WhatsApp number/message
- Payment information
- Product name/category/size/price/MOQ/stock/image/description
- Upload product images to Supabase Storage

## Notes
The demo content uses Unsplash image URLs until you replace them with your own factory/product assets. For production, upload your actual assets through the admin panel / Supabase Storage.

## Blog
Jalankan `supabase/blog.sql` di Supabase SQL Editor (sekali saja jika project sudah ada), lalu kelola artikel di Admin > Blog.
