import { ImageResponse } from 'next/og';

export const size = { width: 180, height: 180 };
export const contentType = 'image/png';

/** Ikon saat website disimpan ke layar utama HP: tas gading dengan tiga titik di atas hijau botol (sama dengan app/icon.svg). */
export default function AppleIcon() {
  return new ImageResponse(
    <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0F4C3A' }}>
      <svg width="120" height="120" viewBox="0 0 40 40" fill="none">
        <path d="M13.5 15v-3.5a6.5 6.5 0 0 1 13 0V15" stroke="#FCFAF6" strokeWidth="2.8" strokeLinecap="round" />
        <path d="M8.2 14h23.6a2 2 0 0 1 2 1.8l1.6 17.4A3.5 3.5 0 0 1 31.9 37H8.1a3.5 3.5 0 0 1-3.5-3.8l1.6-17.4a2 2 0 0 1 2-1.8Z" fill="#FCFAF6" />
        <circle cx="13.4" cy="27" r="2.6" fill="#0F4C3A" />
        <circle cx="20" cy="28.6" r="2.6" fill="#0F4C3A" />
        <circle cx="26.6" cy="27" r="2.6" fill="#0F4C3A" />
      </svg>
    </div>,
    size,
  );
}
