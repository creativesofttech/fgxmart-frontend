<template>
  <header class="storefront-header">
    <div class="storefront-topbar">
      <div class="header-container topbar-inner">
        <p><PackageCheck :size="14" aria-hidden="true" /><span>Everyday essentials. Extraordinary choice.</span><span class="topbar-divider" /><span class="topbar-extra">A little of everything, for everyone.</span></p>
        <NuxtLink to="/faqs"><MessageCircle :size="14" aria-hidden="true" /> A simpler way to shop. A personal way to enquire. <ArrowUpRight :size="13" aria-hidden="true" /></NuxtLink>
      </div>
    </div>

    <div class="sticky-wrapper">
      <div class="header-container main-header">
        <NuxtLink to="/" class="brand-link" aria-label="FGX MART home">
          <img src="/images/logo/fgx-logo-dark.png" alt="FGX MART" width="188" height="60" />
        </NuxtLink>

        <button class="location-trigger" type="button" @click="openLocation">
          <MapPin :size="19" aria-hidden="true" />
          <span><small>Shopping from</small><strong>{{ selectedCountry?.name || 'Choose location' }}</strong></span>
          <ChevronDown :size="13" aria-hidden="true" />
        </button>

        <form class="header-search" role="search" @submit.prevent="submitSearch">
          <label for="storefront-search" class="sr-only">Search products</label>
          <input id="storefront-search" v-model="searchQuery" class="tw:input" type="search" placeholder="Search products and everyday essentials…" autocomplete="off" required />
          <button class="tw:btn tw:btn-primary" aria-label="Search" type="submit"><Search :size="21" aria-hidden="true" /></button>
        </form>

        <nav class="header-actions" aria-label="Your account and selections">
          <NuxtLink to="/my-account?tab=order" class="header-action track-action"><Package :size="21" aria-hidden="true" /><span>Track order</span></NuxtLink>
          <NuxtLink to="/wishlist" class="header-action" aria-label="Wishlist">
            <span class="action-icon"><Heart :size="22" aria-hidden="true" /><span v-if="wishlist.totalItems" class="count-badge">{{ wishlist.totalItems }}</span></span><span>Wishlist</span>
          </NuxtLink>
          <NuxtLink to="/cart" class="header-action" :aria-label="`Cart, ${cart.totalItems} items`">
            <span class="action-icon"><ShoppingCart :size="22" aria-hidden="true" /><span v-if="cart.totalItems" class="count-badge">{{ cart.totalItems }}</span></span><span>Cart</span>
          </NuxtLink>
          <NuxtLink :to="auth.isLoggedIn ? '/my-account' : '/login'" class="tw:btn tw:btn-outline tw:btn-primary account-button" :aria-label="auth.isLoggedIn ? 'My account' : 'Login or register'">
            <UserRound :size="18" aria-hidden="true" /><span>{{ auth.isLoggedIn ? 'My account' : 'Login / Register' }}</span>
          </NuxtLink>
        </nav>
      </div>

      <div class="nav-border">
        <div class="header-container nav-inner">
          <StorefrontCategories :categories="categories" />

          <nav class="primary-nav" aria-label="Main navigation">
            <NuxtLink to="/" :class="{ 'nav-active': route.path === '/' && !route.hash }" :aria-current="route.path === '/' && !route.hash ? 'page' : undefined">Home</NuxtLink>
            <NuxtLink v-for="link in shoppingLinks" :key="link.label" :to="link.to" :class="{ 'nav-active': isShoppingLinkActive(link) }" :aria-current="isShoppingLinkActive(link) ? 'page' : undefined">{{ link.label }}</NuxtLink>
            <NuxtLink v-for="page in headerPages" :key="page.id" :to="`/${page.slug}`">{{ page.title }}</NuxtLink>
          </nav>
          <button type="button" class="mobile-location" aria-label="Choose location" @click="openLocation"><MapPin :size="18" aria-hidden="true" /></button>
        </div>
      </div>
    </div>

    <dialog ref="locationDialog" class="tw:modal location-modal" data-theme="fgx" aria-labelledby="location-title" @click="closeLocationOnBackdrop">
      <div class="tw:modal-box location-box">
        <div class="location-heading"><span class="location-symbol"><MapPin :size="23" aria-hidden="true" /></span><button class="tw:btn tw:btn-ghost tw:btn-circle tw:btn-sm" type="button" aria-label="Close location selector" @click="locationDialog.close()"><X :size="19" aria-hidden="true" /></button></div>
        <h2 id="location-title">Where are you shopping from?</h2>
        <p class="location-description">Choose your country for your shopping enquiries.</p>
        <label for="country-search" class="sr-only">Search countries</label>
        <input id="country-search" v-model="countrySearch" class="tw:input country-search" type="search" placeholder="Search your country" />
        <p v-if="countriesLoading" class="location-status" role="status">Loading countries…</p>
        <p v-else-if="countriesError" class="location-status" role="alert">We couldn't load countries. <button type="button" @click="loadCountries">Try again</button></p>
        <ul v-else class="tw:menu country-list">
          <li v-for="country in filteredCountries" :key="country.id"><button type="button" @click="selectCountry(country)"><span>{{ country.name }}</span><Check v-if="selectedCountry?.id === country.id" :size="17" aria-label="Selected" /></button></li>
          <li v-if="!filteredCountries.length" class="location-status">No countries found.</li>
        </ul>
      </div>
    </dialog>
  </header>
</template>

<script setup>
import { ArrowUpRight, Check, ChevronDown, Heart, MapPin, MessageCircle, Package, PackageCheck, Search, ShoppingCart, UserRound, X } from 'lucide-vue-next'
import StorefrontCategories from '~/components/layout/StorefrontCategories.vue'
import { useAuthStore } from '~/stores/auth'
import { useCartStore } from '~/stores/cart'
import { useWishlistStore } from '~/stores/wishlist'

const route = useRoute()
const config = useRuntimeConfig()
const auth = useAuthStore()
const cart = useCartStore()
const wishlist = useWishlistStore()
const searchQuery = ref('')
const locationDialog = useTemplateRef('locationDialog')
const selectedCountry = useState('storefront-country', () => null)
const countrySearch = ref('')
const countries = ref([])
const countriesLoading = ref(false)
const countriesError = ref(false)

const [categories, { data: pagesResponse }] = await Promise.all([
  useStorefrontCategories(),
  useFetch(`${config.public.apiBase}/pages`, { key: 'storefront-header-pages', default: () => ({ data: [] }) }),
])

const headerPages = computed(() => (pagesResponse.value?.data || []).filter(page => page.status !== false && ['header', 'both'].includes(page.position)).slice(0, 2))
const shoppingLinks = [
  { label: 'Hot Deals', to: '/products?deals=1' },
  { label: 'New Arrivals', to: '/#new-arrivals-title' },
  { label: 'Best Sellers', to: '/#best-sellers-title' },
]
const isShoppingLinkActive = link => link.label === 'Hot Deals'
  ? route.path === '/products' && route.query.deals === '1'
  : route.path === '/' && route.hash === link.to.slice(1)
const filteredCountries = computed(() => countries.value.filter(country => country.name.toLowerCase().includes(countrySearch.value.trim().toLowerCase())))

watch(() => route.query.search, value => { searchQuery.value = typeof value === 'string' ? value : '' }, { immediate: true })
watch(() => route.fullPath, () => { locationDialog.value?.close() })

const submitSearch = () => {
  const search = searchQuery.value.trim()
  if (search) navigateTo({ path: '/products', query: { search } })
}
const loadCountries = async () => {
  countriesLoading.value = true
  countriesError.value = false
  try {
    const response = await $fetch(`${config.public.apiBase}/countries`, { query: { all: 1 } })
    countries.value = (response.data || []).filter(country => country.status !== false)
  } catch { countriesError.value = true }
  finally { countriesLoading.value = false }
}
const openLocation = () => {
  locationDialog.value?.showModal()
  if (!countries.value.length && !countriesLoading.value) loadCountries()
}
const closeLocationOnBackdrop = event => { if (event.target === locationDialog.value) locationDialog.value.close() }
const selectCountry = country => {
  selectedCountry.value = { id: country.id, name: country.name }
  try { localStorage.setItem('fgx-country', JSON.stringify(selectedCountry.value)) } catch {}
  locationDialog.value.close()
}
onMounted(() => {
  try {
    const stored = JSON.parse(localStorage.getItem('fgx-country') || 'null')
    if (stored && typeof stored.name === 'string' && typeof stored.id === 'number') selectedCountry.value = stored
  } catch {}
})
</script>

<style scoped>
.storefront-header { position: relative; z-index: 30; color: #241736; background: white; }
.header-container { max-width: 1440px; margin: 0 auto; padding-inline: 40px; }
.storefront-topbar { min-height: 34px; background: linear-gradient(105deg, #3c216d, #512e89); color: #fff; }
.topbar-inner { min-height: 34px; display: flex; justify-content: space-between; align-items: center; gap: 20px; font-size: 11px; font-weight: 450; letter-spacing: .1px; }
.topbar-inner p, .topbar-inner a { display: flex; align-items: center; gap: 8px; margin: 0; }
.topbar-inner a { color: white; }
.topbar-divider { height: 10px; border-left: 1px solid rgb(255 255 255 / 32%); margin: 0 3px; }
.sticky-wrapper { background: rgb(255 255 255 / 98%); border-bottom: 1px solid #eeeaf3; }
.main-header { display: grid; grid-template-columns: 173px 148px minmax(200px, 1fr) auto; align-items: center; gap: 22px; min-height: 89px; }
.brand-link { display: flex; align-items: center; }
.brand-link img { display: block; width: 173px; height: auto; }
.location-trigger { display: flex; align-items: center; gap: 8px; text-align: left; border: 1px solid #e8e3ed; border-radius: 8px; padding: 8px 9px; color: #332344; min-width: 0; background: #fff; }
.location-trigger span { min-width: 0; flex: 1; }
.location-trigger small { display: block; color: #968ba0; font-size: 9px; margin-bottom: 1px; }
.location-trigger strong { display: block; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-size: 10px; font-weight: 600; max-width: 90px; }
.header-search { display: flex; height: 42px; border: 1px solid #e8e2ee; border-radius: 8px; background: #faf9fc; min-width: 0; }
.header-search:focus-within { border-color: #825bb3; box-shadow: 0 0 0 3px rgb(71 37 128 / 6%); }
.header-search .tw\:input { flex: 1; width: 0; min-width: 0; height: 100%; padding: 0 13px; font-size: 12px; outline: none; border: 0; border-radius: 8px 0 0 8px; background: transparent; color: #332344; box-shadow: none; }
.header-search input::placeholder { color: #918798; }
.header-search .tw\:btn { width: 46px; min-height: 0; height: 100%; border-radius: 0 7px 7px 0; padding: 0; background: #472580; color: white; border: 0; }
.header-actions { display: flex; align-items: center; gap: 18px; }
.header-action { display: inline-flex; align-items: center; gap: 6px; color: #25163b; font-size: 11px; white-space: nowrap; font-weight: 550; }
.header-action:hover, .primary-nav a:hover { color: #7042ab; }
.action-icon { position: relative; display: inline-flex; }
.count-badge { display: grid; place-items: center; position: absolute; top: -8px; right: -7px; min-width: 15px; height: 15px; border-radius: 20px; padding: 0 3px; background: #472580; color: white; font-size: 9px; border: 2px solid white; }
.account-button { font-size: 11px; font-weight: 550; min-height: 37px; height: 37px; padding: 0 12px; gap: 6px; border: 1px solid #8d67bb; border-radius: 8px; color: #472580; background: white; box-shadow: none; }
.account-button:hover { color: white; background: #472580; }
.nav-border { border-top: 1px solid #f3f0f6; }
.nav-inner { display: flex; align-items: center; gap: 42px; min-height: 58px; }
.primary-nav { display: flex; align-items: stretch; gap: 30px; min-width: 0; align-self: stretch; }
.primary-nav a { display: flex; align-items: center; position: relative; white-space: nowrap; color: #30213f; font-size: 12px; font-weight: 600; }
.primary-nav .nav-active { color: #472580; }
.nav-active::after { content: ''; position: absolute; height: 2px; background: #7651aa; bottom: 9px; left: 0; right: 0; border-radius: 3px; }
.mobile-location { display: none; }
.sr-only { position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px; overflow: hidden; clip: rect(0,0,0,0); white-space: nowrap; border: 0; }
.location-modal::backdrop { background: rgb(28 16 46 / 40%); backdrop-filter: blur(3px); }
.location-box { background: white; color: #241736; padding: 28px; width: min(460px, calc(100vw - 32px)); border-radius: 18px; }
.location-heading { display: flex; justify-content: space-between; align-items: center; margin-bottom: 18px; }
.location-symbol { display: grid; place-items: center; width: 45px; height: 45px; color: #472580; background: #f0eaf8; border-radius: 12px; }
.location-box h2 { font-size: 22px; letter-spacing: -.5px; font-weight: 700; }
.location-description { font-size: 12px; color: #8a7d94; margin: 8px 0 20px; }
.country-search { width: 100%; font-size: 13px; padding: 10px 14px; border: 1px solid #e3dbeb; border-radius: 8px; height: 43px; color: #332344; }
.country-list { max-height: 290px; overflow: auto; margin-top: 12px; padding: 0; }
.country-list button { display: flex; justify-content: space-between; width: 100%; padding: 12px; font-size: 13px; border-radius: 7px; }
.country-list button:hover { background: #f5f0fb; }
.location-status { padding: 20px 0; font-size: 12px; color: #8a7d94; }
.location-status button { text-decoration: underline; color: #472580; }
@media (max-width: 1280px) { .main-header { grid-template-columns: 163px minmax(200px, 1fr) auto; gap: 24px; } .brand-link img { width: 163px; } .location-trigger { display: none; } .header-actions { gap: 18px; } .nav-inner { gap: 32px; } .primary-nav { gap: 24px; } .mobile-location { display: flex; color: #472580; } }
@media (max-width: 1100px) { .header-container { padding-inline: 24px; } .topbar-extra, .topbar-divider { display: none; } .main-header { gap: 22px; } .track-action { display: none; } .nav-inner { gap: 26px; } .primary-nav { gap: 25px; overflow-x: auto; scrollbar-width: none; } .mobile-location { margin-left: auto; } }
@media (max-width: 760px) {
  .header-container { padding-inline: 16px; }
  .storefront-topbar, .topbar-inner { min-height: 30px; }
  .topbar-inner { justify-content: center; font-size: 9px; }
  .topbar-inner > a { display: none; }
  .main-header { grid-template-columns: 1fr auto; gap: 14px; padding-top: 17px; padding-bottom: 15px; }
  .brand-link img { width: 154px; }
  .header-actions { grid-column: 2; grid-row: 1; gap: 16px; }
  .header-action > span:not(.action-icon) { display: none; }
  .account-button { width: 34px; height: 34px; min-height: 34px; padding: 0; border-radius: 50%; }
  .account-button > span { display: none; }
  .header-search { grid-column: 1 / -1; grid-row: 2; height: 41px; }
  .header-search .tw\:input { font-size: 11px; }
  .nav-inner { min-height: 51px; gap: 21px; }
  .primary-nav { flex: 1; gap: 22px; }
  .primary-nav a { font-size: 10px; }
  .mobile-location { display: flex; align-items: center; justify-content: center; width: 30px; min-height: 33px; flex-shrink: 0; margin-left: 0; }
  .location-trigger { display: none; }
  .nav-active::after { bottom: 8px; }
}
@media (max-width: 360px) { .brand-link img { width: 132px; } .header-actions { gap: 12px; } .header-action svg { width: 20px; } }
</style>
