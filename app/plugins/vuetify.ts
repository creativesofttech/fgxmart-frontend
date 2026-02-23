import '@mdi/font/css/materialdesignicons.css'
import 'vuetify/styles'
import { createVuetify } from 'vuetify'
import * as components from 'vuetify/components'
import * as directives from 'vuetify/directives'

export default defineNuxtPlugin((nuxtApp) => {
    const vuetify = createVuetify({
        components,
        directives,
        theme: {
            defaultTheme: 'light',
            themes: {
                light: {
                    dark: false,
                    colors: {
                        primary: '#393185', // FGX Blue
                        secondary: '#087637', // FGX Green
                        accent: '#ff4c3b', // Existing red/orange
                        surface: '#FFFFFF',
                    }
                }
            }
        }
    })

    nuxtApp.vueApp.use(vuetify)
})
