import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Miami Skate Academy Skater Portal', short_name: 'MSA Portal',
    description: 'Private progress, trick checklists, coach updates, and schedules for Miami Skate Academy families.',
    start_url: '/auth/login', scope: '/', display: 'standalone', orientation: 'portrait-primary',
    background_color: '#f3f0e8', theme_color: '#101613', categories: ['education', 'sports'],
    icons: [
      { src: '/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: '/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
      { src: '/icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
  };
}
