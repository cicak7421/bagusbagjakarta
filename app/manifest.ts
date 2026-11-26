import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Tre Joy Ease Indonesia',
    short_name: 'Tre Joy Ease',
    description: 'Supplier goodie bag spunbond, paperbag, dan coolerbag. Ready stock dan custom.',
    start_url: '/',
    display: 'standalone',
    // Sama dengan --canvas di app/theme.css dan themeColor di app/layout.tsx
    background_color: '#FCFAF6',
    theme_color: '#FCFAF6',
    lang: 'id',
    icons: [
      { src: '/icon.svg', sizes: 'any', type: 'image/svg+xml' },
      { src: '/apple-icon', sizes: '180x180', type: 'image/png' },
    ],
  };
}
