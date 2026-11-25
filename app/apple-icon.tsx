import { ImageResponse } from 'next/og';

export const size = { width: 180, height: 180 };
export const contentType = 'image/png';

/** Ikon saat website disimpan ke layar utama HP. */
export default function AppleIcon() {
  return new ImageResponse(
    <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#1d1d1f', color: '#fff', fontSize: 120, fontWeight: 800 }}>T</div>,
    size,
  );
}
