<template>
  <footer class="main-footer">
    <div class="footer-container">
      <div class="footer-top">
        <div class="footer-intro">
          <NuxtLink to="/" class="footer-logo" aria-label="FGX MART home"><img src="/images/logo/fgx-logo-light.png" alt="FGX MART" width="240" height="60" loading="lazy" /></NuxtLink>
          <p>{{ company.intro || 'Your everyday destination for packed food, fashion, electronics, home & kitchen, and more.' }}</p>
          <div v-if="company.contact_email || company.phone_number" class="footer-contact">
            <a v-if="company.contact_email" :href="`mailto:${company.contact_email}`"><Mail :size="16" aria-hidden="true" />{{ company.contact_email }}</a>
            <a v-if="company.phone_number" :href="`tel:${company.phone_number.replace(/[^+\d]/g, '')}`"><Phone :size="16" aria-hidden="true" />{{ company.phone_number }}</a>
          </div>
          <div v-else class="footer-tagline"><MessageCircle :size="19" aria-hidden="true" /> A personal way to enquire.</div>
        </div>
        <nav v-for="group in linkGroups" :key="group.title" class="footer-column" :aria-label="group.title">
          <h2>{{ group.title }}</h2>
          <ul><li v-for="link in group.links" :key="link.label"><NuxtLink :to="link.to">{{ link.label }}</NuxtLink></li></ul>
        </nav>
      </div>
      <div class="footer-bottom">
        <p>© {{ year }} <strong>{{ company.name || 'FGX MART' }}</strong>. All rights reserved.</p>
        <ul class="footer-assurances">
          <li><ShieldCheck aria-hidden="true" /> Thoughtfully selected</li>
          <li><FileDown aria-hidden="true" /> Your list, made simple</li>
          <li><MessageCircle aria-hidden="true" /> Here to help</li>
        </ul>
      </div>
    </div>
  </footer>
</template>

<script setup>
import { FileDown, Mail, MessageCircle, Phone, ShieldCheck } from 'lucide-vue-next'
const config = useRuntimeConfig()
const year = new Date().getFullYear()
const [{ data: catRes }, { data: compRes }, { data: pagesRes }] = await Promise.all([
  useFetch(`${config.public.apiBase}/categories`, { query: { all: 1 }, key: 'storefront-header-categories', default: () => ({ data: [] }) }),
  useFetch(`${config.public.apiBase}/company-info`, { key: 'storefront-footer-company', default: () => ({ data: {} }) }),
  useFetch(`${config.public.apiBase}/pages`, { key: 'storefront-header-pages', default: () => ({ data: [] }) }),
])
const company = computed(() => compRes.value?.data?.company || {})
const categories = computed(() => (catRes.value?.data || []).filter(item => !item.parent_id && item.status !== false).slice(0, 4))
const footerPages = computed(() => (pagesRes.value?.data || []).filter(page => page.status !== false && ['footer', 'both'].includes(page.position) && !['terms-and-conditions', 'privacy-policy'].includes(page.slug)))
const linkGroups = computed(() => [
  { title: 'Shop by Category', links: categories.value.length ? categories.value.map(category => ({ label: category.name, to: `/category/${category.slug}` })) : [
    { label: 'Packed Food', to: '/products' }, { label: 'Clothing', to: '/products?search=clothing' }, { label: 'Electronics', to: '/products?search=electronics' }, { label: 'Kitchen Utensils', to: '/products?search=kitchen' },
  ] },
  { title: 'Quick Links', links: [{ label: 'Home', to: '/' }, { label: 'Shop', to: '/products' }, { label: 'New Arrivals', to: '/new-arrivals' }, { label: 'Best Sellers', to: '/best-sellers' }, { label: 'Track Order', to: '/my-account?tab=order' }] },
  { title: 'Customer Support', links: [{ label: 'FAQs & Help', to: '/faqs' }, { label: 'Your Account', to: '/my-account' }, { label: 'Your Enquiry', to: '/cart' }, { label: 'Wishlist', to: '/wishlist' }] },
  { title: 'About FGX MART', links: [...(footerPages.value.length ? footerPages.value.map(page => ({ label: page.title, to: `/${page.slug}` })) : [{ label: 'Shopping Guide', to: '/faqs' }, { label: 'Explore Our Catalogue', to: '/products' }, { label: 'Get Started', to: '/login' }]), { label: 'Terms & Conditions', to: '/terms-and-conditions' }, { label: 'Privacy Policy', to: '/privacy-policy' }] },
])
</script>

<style scoped>
.main-footer { background: radial-gradient(ellipse at 40% -80%, #775299, transparent 75%), linear-gradient(115deg, #3f2869, #29194b); color: #fff; }
.footer-container { width: min(var(--storefront-container-width), 100%); margin-inline: auto; padding: 45px 40px 0; }
.footer-top { display: grid; grid-template-columns: 1.45fr 1fr .9fr 1fr 1fr; gap: 35px; padding-bottom: 35px; }
.footer-intro { padding-right: 24px; border-right: 1px solid rgb(255 255 255 / 13%); }
.footer-logo { display: inline-block; margin-bottom: 17px; }
.footer-logo img { display: block; width: 220px; max-width: 100%; height: auto; }
.footer-intro p { font-size: 13px; line-height: 1.8; color: #e6dff0; margin: 0 0 20px; max-width: 270px; }
.footer-contact { display: flex; flex-direction: column; gap: 10px; font-size: 11px; color: #e6dff0; }
.footer-contact a { display: flex; gap: 9px; align-items: center; overflow-wrap: anywhere; }
.footer-contact svg { flex-shrink: 0; }
.footer-tagline { display: flex; align-items: center; gap: 10px; color: #c8b6e0; font-size: 11px; }
.footer-column { min-width: 0; }
.footer-column h2 { position: relative; font-size: 17px; line-height: 1.4; font-weight: 700; letter-spacing: -.3px; margin: 0 0 19px; padding-bottom: 13px; }
.footer-column h2::after { content: ''; position: absolute; bottom: 0; left: 0; width: 36px; height: 4px; border-radius: 9px; background: #8bcb2e; }
.footer-column li + li { margin-top: 11px; }
.footer-column a { display: flex; justify-content: space-between; gap: 10px; font-size: 12px; line-height: 1.5; color: #e6dff0; }
.footer-column svg { flex-shrink: 0; margin-top: 2px; opacity: .7; }
.footer-column a:hover, .footer-contact a:hover { color: #b3e970; }
.main-footer a:focus-visible { outline: 2px solid #b3e970; outline-offset: 5px; border-radius: 2px; }
.main-footer .footer-logo:focus, .main-footer .footer-logo:active { outline: none; border: 0; box-shadow: none; }
.main-footer .footer-logo:focus-visible { opacity: .8; }
.footer-bottom { display: flex; align-items: center; justify-content: space-between; gap: 25px; border-top: 1px solid rgb(255 255 255 / 27%); padding-block: 23px; }
.footer-bottom p { margin: 0; font-size: 12px; color: #e6dff0; }
.footer-assurances { display: flex; align-items: center; gap: 25px; }
.footer-assurances li { display: flex; align-items: center; gap: 9px; font-size: 11px; color: #e6dff0; }
.footer-assurances svg { width: 23px; height: 23px; stroke-width: 1.5; flex-shrink: 0; }
@media (max-width: 1100px) { .footer-container { padding-inline: 24px; } .footer-top { gap: 24px; grid-template-columns: 1.3fr 1fr 1fr; } .footer-intro { grid-row: span 2; } .footer-bottom { flex-wrap: wrap; gap: 18px; } }
@media (max-width: 760px) { .footer-container { padding: 32px 16px 0; } .footer-top { grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 28px 25px; padding-bottom: 30px; } .footer-intro { grid-column: 1 / -1; grid-row: auto; border-right: 0; border-bottom: 1px solid rgb(255 255 255 / 13%); padding: 0 0 24px; } .footer-logo img { width: 195px; } .footer-intro p { max-width: 400px; margin-bottom: 15px; } .footer-column h2 { font-size: 15px; } .footer-column a { font-size: 11px; } .footer-assurances { gap: 15px; flex-wrap: wrap; } .footer-assurances li { font-size: 10px; gap: 6px; } .footer-assurances svg { width: 20px; height: 20px; } .footer-bottom { padding-block: 22px; } .footer-bottom p { font-size: 11px; } }
</style>
