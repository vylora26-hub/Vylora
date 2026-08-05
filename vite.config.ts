import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'
import path from 'path'

export default defineConfig({
  plugins: [
    vue(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['LOGO-Vylora.png', 'robots.txt'],
      manifest: {
        name: 'Vylora',
        short_name: 'Vylora',
        description: 'Plataforma de chat moderna, rápida y segura. Crea salas y conecta en tiempo real.',
        theme_color: '#0f0f11',
        background_color: '#0f0f11',
        display: 'standalone',
        orientation: 'portrait',
        scope: '/',
        start_url: '/',
        icons: [
          {
            src: '/LOGO-Vylora.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: '/LOGO-Vylora.png',
            sizes: '512x512',
            type: 'image/png'
          },
          {
            src: '/LOGO-Vylora.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable'
          }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        // Aumentado a 3MB para soportar el logo de alta resolución
        maximumFileSizeToCacheInBytes: 3 * 1024 * 1024,
        runtimeCaching: [
          {
            // Cache de assets estáticos de Supabase Storage
            urlPattern: /^https:\/\/.*\.supabase\.co\/storage\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'supabase-storage',
              expiration: {
                maxEntries: 200,
                maxAgeSeconds: 60 * 60 * 24 * 7 // 7 días
              }
            }
          },
          {
            // API de Supabase: siempre red primero
            urlPattern: /^https:\/\/.*\.supabase\.co\/rest\/.*/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'supabase-api',
              networkTimeoutSeconds: 8,
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 60 * 2 // 2 minutos
              }
            }
          }
        ]
      }
    })
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src')
    }
  },
  build: {
    // Code splitting por ruta para lazy loading óptimo
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor-vue': ['vue', 'vue-router', 'pinia'],
          'vendor-supabase': ['@supabase/supabase-js'],
          'vendor-utils': ['dompurify', '@vueuse/core']
        }
      }
    },
    // Reportar chunks grandes
    chunkSizeWarningLimit: 600
  }
})
