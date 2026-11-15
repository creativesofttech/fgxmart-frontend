<template>
  <section class="product-collection" :aria-labelledby="`${kind}-title`">
    <div class="collection-heading">
      <h2 :id="`${kind}-title`">{{ title }}</h2>
      <NuxtLink class="view-all" :to="viewAllLink">View all <ArrowRight :size="16" aria-hidden="true" /></NuxtLink>
    </div>
    <div v-if="pending" class="collection-grid" aria-busy="true" :aria-label="`Loading ${title}`">
      <div v-for="index in 6" :key="index" class="tw:skeleton collection-skeleton" />
    </div>
    <div v-else-if="error" class="collection-error" role="alert">
      <p>We couldn’t load the latest products.</p>
      <button class="tw:btn tw:btn-outline tw:btn-primary tw:btn-sm" type="button" @click="refresh">Try again</button>
    </div>
    <template v-else>
      <p v-if="!products.length" class="collection-note">No {{ title.toLowerCase() }} available yet.</p>
      <div class="collection-grid">
        <motion.article v-for="(item, index) in cards" :key="item.id || index" class="tw:card collection-card" :while-hover="{ y: -3 }">
          <NuxtLink :to="`/products/${item.slug}`" class="collection-link">
            <div class="collection-visual"><ProductImage :product="item" /></div>
            <h3>{{ item.name }}</h3>
            <span class="collection-detail">Explore product <ArrowUpRight :size="13" aria-hidden="true" /></span>
          </NuxtLink>
        </motion.article>
      </div>
    </template>
  </section>
</template>

<script setup>
import { motion } from 'motion-v'
import { ArrowRight, ArrowUpRight } from 'lucide-vue-next'

const props = defineProps({ kind: { type: String, required: true }, title: { type: String, required: true } })
const config = useRuntimeConfig()
const filter = { 'new-arrivals': 'is_new_arrival', 'best-sellers': 'is_best_seller', 'hot-deals': 'is_hot_deal' }[props.kind]
const viewAllLink = computed(() => props.kind === 'hot-deals' ? '/products?deals=1' : `/${props.kind}`)
const { data: products, pending, error, refresh } = await useAsyncData(`home-${props.kind}`, async () => {
  if (!filter) return []
  const response = await $fetch(`${config.public.apiBase}/products`, { query: { per_page: 6, [filter]: 1 } })
  return (response.data || []).filter(product => product.status !== false).slice(0, 6)
}, { default: () => [] })
const cards = computed(() => products.value)
</script>

<style scoped>
.product-collection { padding-top: 33px; }
.collection-heading { display: flex; align-items: center; justify-content: space-between; gap: 16px; margin-bottom: 18px; }
h2 { position: relative; color: #2f1d4b; font-size: 25px; font-weight: 740; line-height: 1.25; letter-spacing: -.7px; margin: 0; padding-bottom: 13px; }
h2::after { content: ''; position: absolute; left: 0; bottom: 0; width: 43px; height: 3px; border-radius: 4px; background: #7850b1; }
.view-all { display: flex; align-items: center; gap: 8px; color: #59348a; font-size: 12px; font-weight: 600; white-space: nowrap; }
.view-all:hover { color: #8a5ec1; }
.collection-grid { display: grid; grid-template-columns: repeat(6, minmax(0, 1fr)); gap: 18px; }
.collection-card { display: flex; flex-direction: column; min-width: 0; border: 1px solid #eee9f3; border-radius: 13px; background: #fff; padding: 8px 8px 13px; overflow: hidden; }
.collection-link { display: flex; flex-direction: column; height: 100%; }
.collection-visual { overflow: hidden; border-radius: 8px; background: #f7f5fa; aspect-ratio: 1.5; }
.collection-visual img { display: block; width: 100%; height: 100%; object-fit: contain; }
h3 { color: #352344; font-size: 12px; line-height: 1.5; font-weight: 650; margin: 11px 4px 7px; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
.collection-detail { display: flex; align-items: center; gap: 5px; color: #684191; font-size: 10px; margin: auto 4px 0; padding-top: 2px; }
.collection-note { font-size: 11px; color: #93879e; margin: -4px 0 14px; }
.collection-skeleton { min-height: 190px; background: #f1edf6; border-radius: 13px; }
.collection-error { display: flex; align-items: center; justify-content: center; flex-wrap: wrap; gap: 16px; min-height: 150px; border: 1px dashed #dfd4eb; border-radius: 13px; color: #8b769d; font-size: 13px; }
@media (max-width: 1100px) { .collection-grid { gap: 12px; } }
@media (max-width: 960px) { .collection-grid { grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 16px; } }
@media (max-width: 600px) { .product-collection { padding-top: 28px; } h2 { font-size: 21px; } .view-all { font-size: 11px; gap: 5px; } .collection-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 12px; } .collection-heading { margin-bottom: 16px; } }
</style>
