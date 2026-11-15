import tailwindcss from '@tailwindcss/vite'

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: process.env.NODE_ENV !== 'production' },
  srcDir: 'app',
  css: ['@fontsource/poppins/latin.css', '@fontsource/poppins/latin-italic.css', '~/assets/css/ui.css', '~/assets/css/theme.css', '~/assets/css/admin.scss'],
  modules: [
    '@pinia/nuxt',
    'nuxt-gtag',
    'motion-v/nuxt'
  ],
  gtag: {
    id: process.env.GTAG_ID || 'G-XXXXXXXXXX', // Placeholder Measurement ID
    config: {
      debug_mode: process.env.NODE_ENV !== 'production'
    }
  },
  runtimeConfig: {
    // Server-only URL for authenticated admin requests (NUXT_API_BASE).
    apiBase: '',
    public: {
      apiBase: 'http://localhost:8000/api/v1',
      gtagId: process.env.GTAG_ID || 'G-XXXXXXXXXX'
    }
  },
  routeRules: {
    '/admin': { headers: { 'cache-control': 'private, no-store', 'x-robots-tag': 'noindex, nofollow' } },
    '/admin/**': { headers: { 'cache-control': 'private, no-store', 'x-robots-tag': 'noindex, nofollow' } },
    '/admin-access': { headers: { 'cache-control': 'private, no-store', 'x-robots-tag': 'noindex, nofollow' } },
    '/api/admin/**': { headers: { 'cache-control': 'private, no-store' } },
  },
  build: {
    transpile: ['vuetify'],
  },
  vite: {
    plugins: [tailwindcss()],
  },
})
