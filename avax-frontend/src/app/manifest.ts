import type { MetadataRoute } from 'next';

/** Web app manifest: the KAI Nuvari icon and name when the app is added to a phone's home screen. */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'KAI Nuvari',
    short_name: 'KAI Nuvari',
    description: 'Conservation records you can trust, and murals that carry their story.',
    start_url: '/',
    display: 'standalone',
    background_color: '#0B1C14',
    theme_color: '#0B1C14',
    icons: [
      { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
      { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
    ],
  };
}
