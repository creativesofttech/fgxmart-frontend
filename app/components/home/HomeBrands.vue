<template>
  <section ref="brandsRoot" class="home-brands" aria-labelledby="brands-title">
    <div class="brands-heading"><h2 id="brands-title">Shop By Brands</h2></div>
    <div v-if="pending" class="brand-grid" role="status" aria-label="Loading brands"><div v-for="index in 9" :key="index" class="brand-skeleton" aria-hidden="true" /></div>
    <div v-else-if="error" class="brand-status" role="alert"><p>We couldn’t load the brands.</p><button class="tw:btn tw:btn-outline tw:btn-sm" type="button" @click="refresh">Try again</button></div>
    <p v-else-if="!brands.length" class="brand-status">Brand logos are coming soon.</p>
    <div v-else-if="hasLoop" class="brands-viewport" :class="{ 'logos-ready': logosReady }" @focusout="resetBrandScroll">
      <div class="brands-track" :style="{ animationDuration: brands.length * 3.2 + 's' }">
        <ul v-for="copy in 2" :key="copy" class="brand-group" :class="{ 'brand-clone': copy === 2 }" :aria-label="copy === 1 ? 'Available brands' : undefined" :aria-hidden="copy === 2 ? true : undefined">
          <li v-for="brand in brands" :key="brand.id" class="brand-tile" :class="{ 'is-loading': !loadedLogos.has(String(brand.id)) }"><NuxtLink :to="{ path: '/products', query: { brand_id: brand.id } }" :aria-label="`Shop ${brand.name}`" class="brand-link" :tabindex="copy === 2 ? -1 : undefined"><img :src="brand.logo" :data-brand-id="brand.id" :alt="brand.name" width="160" height="56" loading="eager" decoding="async" @load="loadedLogos.add(String(brand.id))" @error="failedLogos.add(String(brand.id))" /></NuxtLink></li>
        </ul>
      </div>
    </div>
    <ul v-else class="brand-grid" aria-label="Available brands"><motion.li v-for="brand in brands" :key="brand.id" class="brand-tile" :class="{ 'is-loading': !loadedLogos.has(String(brand.id)) }" :while-hover="{ y: -3 }"><NuxtLink :to="{ path: '/products', query: { brand_id: brand.id } }" :aria-label="`Shop ${brand.name}`" class="brand-link"><img :src="brand.logo" :data-brand-id="brand.id" :alt="brand.name" width="160" height="56" loading="lazy" decoding="async" @load="loadedLogos.add(String(brand.id))" @error="failedLogos.add(String(brand.id))" /></NuxtLink></motion.li></ul>
  </section>
</template>

<script setup>
import { motion } from 'motion-v'
const config = useRuntimeConfig()
const brandsRoot = ref(null)
const failedLogos = reactive(new Set())
const loadedLogos = reactive(new Set())
const logoURL = brand => {
  const value = brand.image_url || brand.brand_image
  if (typeof value !== 'string' || !value.trim()) return null
  const path = value.trim()
  if (/^https?:\/\//i.test(path)) return path
  if (/^(?:[a-z][a-z\d+.-]*:|\/\/)/i.test(path)) return null
  if (path.startsWith('/assets/') || path.startsWith('/images/')) return path
  const base = config.public.apiBase.replace(/\/api\/v1\/?$/, '')
  return base + '/storage/' + path.replace(/^\/?storage\//, '').replace(/^\/+/, '')
}
const { data: response, pending, error, refresh } = await useFetch(config.public.apiBase + '/brands', { query: { all: 1 }, key: 'storefront-home-brands', default: () => ({ data: [] }) })
const brands = computed(() => {
  const seen = new Set()
  return (response.value?.data || []).map(brand => ({ ...brand, logo: logoURL(brand) })).filter(brand => {
    if (!brand.logo || failedLogos.has(String(brand.id)) || !brand.id || !brand.name?.trim() || brand.status === false || brand.status === 0 || seen.has(brand.id)) return false
    seen.add(brand.id)
    return true
  })
})
const resetBrandScroll = event => { if (!event.currentTarget.contains(event.relatedTarget)) event.currentTarget.scrollLeft = 0 }
const hasLoop = computed(() => brands.value.length > 9)
const logosReady = computed(() => brands.value.every(brand => loadedLogos.has(String(brand.id))))
const checkCachedLogos = () => {
  for (const image of brandsRoot.value?.querySelectorAll('img[data-brand-id]') || []) {
    if (image.complete) (image.naturalWidth > 0 ? loadedLogos : failedLogos).add(image.dataset.brandId)
  }
}
onMounted(checkCachedLogos)
watch(response, async () => { failedLogos.clear(); loadedLogos.clear(); await nextTick(); checkCachedLogos() })
</script>

<style scoped>
.home-brands { --brand-columns: 9; --brand-gap: 14px; padding-top: 33px; }
.brands-heading { display: flex; align-items: center; justify-content: space-between; gap: 16px; margin-bottom: 12px; }
h2 { position: relative; color: #2f1d4b; font-size: 25px; font-weight: 740; line-height: 1.25; letter-spacing: -.7px; margin: 0; padding-bottom: 13px; }
h2::after { content: ''; position: absolute; left: 0; bottom: 0; width: 43px; height: 3px; border-radius: 4px; background: #7850b1; }
.brand-grid { display: grid; grid-template-columns: repeat(var(--brand-columns), minmax(0, 1fr)); gap: var(--brand-gap); list-style: none; padding: 6px 0; margin: 0; }
.brand-tile { position: relative; min-width: 0; display: flex; align-items: center; justify-content: center; min-height: 73px; padding: 14px 8px; border: 0; border-radius: 0; background: transparent; box-shadow: none; text-align: center; }
.brand-link { display: flex; align-items: center; justify-content: center; width: 100%; padding: 3px; text-decoration: none; }.brand-link:focus-visible { outline: 2px solid #9c7db3; outline-offset: 2px; border-radius: 5px; }
.brand-tile img { display: block; width: 100%; max-width: 160px; height: 56px; object-fit: contain; opacity: 1; transition: opacity .25s ease; }
.brand-tile.is-loading img { opacity: 0; }
.brand-tile.is-loading::after, .brand-skeleton::after { content: ''; position: absolute; width: 22px; height: 22px; border: 2px solid #ece5f5; border-top-color: #7850b1; border-radius: 50%; animation: brand-loading .8s linear infinite; }
.brands-viewport { overflow: hidden; container-type: inline-size; padding: 6px 0; }
.brands-track { display: flex; width: max-content; animation: brand-scroll linear infinite; will-change: transform; }
.brand-group { display: flex; gap: var(--brand-gap); flex-shrink: 0; width: max-content; list-style: none; margin: 0; padding: 0 var(--brand-gap) 0 0; }
.brand-group .brand-tile { width: calc((100cqw + var(--brand-gap)) / var(--brand-columns) - var(--brand-gap)); flex-shrink: 0; }
.brands-viewport:not(.logos-ready) .brands-track, .brands-viewport:hover .brands-track, .brands-viewport:focus-within .brands-track { animation-play-state: paused; }
.brand-skeleton { position: relative; display: flex; align-items: center; justify-content: center; height: 73px; background: transparent; }.brand-status { display: flex; align-items: center; justify-content: center; flex-wrap: wrap; gap: 14px; padding: 25px; border: 1px dashed #e4d9ee; border-radius: 12px; color: #9983a7; font-size: 12px; }.brand-status button { padding: 7px 12px; border: 1px solid #ddcde9; border-radius: 7px; font-size: 11px; color: #76528f; }
@keyframes brand-loading { to { transform: rotate(360deg); } }
@keyframes brand-scroll { from { transform: translateX(0); } to { transform: translateX(-50%); } }
@media(max-width:1100px) { .home-brands { --brand-gap: 10px; } }
@media(max-width:960px) { .home-brands { --brand-columns: 5; } }
@media(max-width:600px) { .home-brands { --brand-columns: 3; padding-top: 28px; }h2 { font-size: 21px; }.brand-tile, .brand-skeleton { min-height: 65px; }
.brand-tile img { height: 46px; } }
@media(prefers-reduced-motion:reduce) {
.brand-tile img { transition: none; }.brand-tile.is-loading::after, .brand-skeleton::after { animation: none; } .brand-clone { display: none; }.brands-track { animation: none; transform: none; width: 100%; will-change: auto; }.brand-group:not(.brand-clone) { display: grid; grid-template-columns: repeat(var(--brand-columns), minmax(0, 1fr)); gap: var(--brand-gap); width: 100%; padding: 0; }.brand-group .brand-tile { width: auto; } }
</style>
