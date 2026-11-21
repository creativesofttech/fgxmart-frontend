<template>
  <section class="home-featured" aria-labelledby="featured-title">
    <div class="featured-heading">
      <div><p class="section-eyebrow">HANDPICKED FOR YOUR EVERYDAY</p><h2 id="featured-title">Featured Products</h2></div>
      <NuxtLink class="view-products" to="/products?featured=1">View all <ArrowRight :size="16" aria-hidden="true" /></NuxtLink>
    </div>
    <p class="enquiry-notice" role="status" aria-live="polite">{{ notice }}</p>
    <div v-if="pending" class="featured-grid" aria-label="Loading featured products" aria-busy="true"><div v-for="index in 4" :key="index" class="tw:skeleton product-skeleton" /></div>
    <div v-else-if="error" class="catalogue-message" role="alert"><PackageOpen :size="26" aria-hidden="true" /><p>We couldn’t load the products just now.</p><button type="button" class="tw:btn tw:btn-outline tw:btn-primary tw:btn-sm" @click="refresh">Try again</button></div>
    <div v-else-if="products.length" class="featured-grid"><CatalogueCard v-for="product in products" :key="product.id" :product="product" @notice="notice = $event" /></div>
    <div v-else class="catalogue-message"><PackageOpen :size="28" aria-hidden="true" /><p>No featured products just yet. Check back soon for our handpicked favourites.</p></div>
  </section>
</template>

<script setup>
import { ArrowRight, PackageOpen } from 'lucide-vue-next'
import CatalogueCard from '~/components/product/CatalogueCard.vue'

const config = useRuntimeConfig()
const notice = ref('')
const { data: products, pending, error, refresh } = await useAsyncData('home-featured-products', async () => {
  const featured = await $fetch(`${config.public.apiBase}/products`, { query: { is_featured: 1, per_page: 4 } })
  return (featured.data || []).filter(product => product.status !== false && product.is_featured).slice(0, 4)
}, { default: () => [] })
</script>

<style scoped>
.home-featured { padding-top: 37px; }
.featured-heading { display: flex; justify-content: space-between; align-items: flex-end; gap: 20px; }
.section-eyebrow { color: #96879f; font-size: 9px; font-weight: 600; letter-spacing: 1.7px; margin-bottom: 7px; }
h2 { position: relative; margin: 0; padding-bottom: 13px; color: #2f1d4b; font-size: 25px; font-weight: 740; letter-spacing: -.7px; line-height: 1.25; }
h2::after { content: ''; position: absolute; width: 43px; height: 3px; border-radius: 4px; background: #7850b1; left: 0; bottom: 0; }
.view-products { display: flex; align-items: center; gap: 8px; color: #59348a; font-size: 12px; font-weight: 600; padding-bottom: 12px; white-space: nowrap; }
.view-products:hover { color: #8a5ec1; }
.enquiry-notice { min-height: 12px; font-size: 11px; line-height: 1.5; color: #548018; margin: 8px 0 5px; }
.featured-grid { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 20px; }
.product-skeleton { height: 330px; background: #f1edf6; border-radius: 14px; }
.catalogue-message { min-height: 220px; border: 1px dashed #dfd4eb; border-radius: 14px; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 14px; color: #8b769d; font-size: 13px; background: #fcfaff; }
@media (max-width: 960px) { .featured-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 16px; } }
@media (max-width: 600px) { .home-featured { padding-top: 30px; } .featured-grid { gap: 12px; } .section-eyebrow { font-size: 8px; letter-spacing: 1.1px; } h2 { font-size: 21px; padding-bottom: 11px; } .view-products { font-size: 11px; gap: 5px; } }
</style>
