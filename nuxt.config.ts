// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  srcDir: 'app',
  css: ['~/assets/css/theme.css'],
  modules: [
    '@pinia/nuxt',
    'nuxt-gtag'
  ],
  gtag: {
    id: process.env.GTAG_ID || 'G-XXXXXXXXXX', // Placeholder Measurement ID
    config: {
      debug_mode: true
    }
  },
  runtimeConfig: {
    public: {
      apiBase: 'http://localhost:8000/api/v1',
      gtagId: process.env.GTAG_ID || 'G-XXXXXXXXXX'
    }
  },
  build: {
    transpile: ['vuetify'],
  },
})
