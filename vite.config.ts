import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        name: 'reflow',
        short_name: 'reflow',
        description: 'your day doesn\'t fall apart — it reflows.',
        theme_color: '#171335',
        background_color: '#FAF9FB',
        display: 'standalone',
        start_url: '/',
        icons: [
          { src: '/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: '/icon-512-maskable.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        // Precache the built app shell only — this app is realtime-sync-dependent,
        // so task data is deliberately NOT cached for offline use. Opening the app
        // offline shows the shell; data operations still require a connection.
        globPatterns: ['**/*.{js,css,html,svg}'],
      },
    }),
  ],
})
