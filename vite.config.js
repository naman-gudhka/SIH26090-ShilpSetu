import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import { defineConfig } from 'vite'

export default defineConfig({
  base: '/',
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        name: 'ShilpSetu',
        short_name: 'ShilpSetu',
        description:
          'AI-powered market linkage and smart cataloging for artisans',
        start_url: '/SIH26090-ShilpSetu/',
        scope: '/SIH26090-ShilpSetu/',
        display: 'standalone',
        orientation: 'portrait',
        theme_color: '#0F766E',
        background_color: '#FFFFFF',
        icons: [
          {
            src: 'icons/icon-192.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: 'icons/icon-512.png',
            sizes: '512x512',
            type: 'image/png',
          },
        ],
      },
    }),
  ],
})