<template>
  <section v-if="pending || error || products.length" class="related-products" aria-labelledby="related-products-title">
    <div class="related-heading"><div><span class="related-eyebrow">KEEP EXPLORING</span><h2 id="related-products-title">More from this category</h2><p v-if="category?.name">Explore more from {{ category.name }}.</p></div><NuxtLink v-if="category?.slug" :to="`/category/${category.slug}`" class="related-view-all">View category <ArrowRight :size="16" aria-hidden="true" /></NuxtLink></div>
    <div v-if="pending" class="related-loading" role="status" aria-label="Loading related products"><div v-for="index in 4" :key="index" class="tw:skeleton related-skeleton" aria-hidden="true" /></div>
    <div v-else-if="error" class="related-error" role="alert"><span>We couldn't load more products right now.</span><button type="button" class="tw:btn tw:btn-sm tw:btn-outline" @click="refresh">Try again</button></div>
    <v-row v-else><v-col v-for="item in products" :key="item.id" cols="12" sm="6" lg="3"><ProductCard :product="item" @quick-view="openQuickView" /></v-col></v-row>
    <QuickViewModal v-model="showQuickView" :product="selectedProduct" />
  </section>
</template>

<script setup>
import { ArrowRight } from 'lucide-vue-next'
import ProductCard from '~/components/product/ProductCard.vue'
import QuickViewModal from '~/components/product/QuickViewModal.vue'
const props = defineProps({ productId: { type: Number, required: true }, category: { type: Object, default: null } })
const apiBase = useRuntimeConfig().public.apiBase
const { data, pending, error, refresh } = await useFetch(() => `${apiBase}/products/${props.productId}/related`)
const products = computed(() => (data.value?.data || []).filter(item => item.id !== props.productId && item.status !== false))
const showQuickView = ref(false), selectedProduct = ref(null)
const openQuickView = item => { selectedProduct.value = item; showQuickView.value = true }
watch(() => props.productId, () => { showQuickView.value = false; selectedProduct.value = null })
</script>

<style scoped>
.related-products { margin-top: 44px; padding-top: 32px; border-top: 1px solid #ece5f3; }
.related-heading { display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 16px; margin-bottom: 24px; }
.related-eyebrow { display: block; font-size: 9px; font-weight: 650; letter-spacing: 1.8px; color: #a28ab5; margin-bottom: 9px; }
.related-heading h2 { color: #302044; font-size: 24px; line-height: 1.4; font-weight: 700; margin: 0; }
.related-heading p { color: #927c9f; font-size: 12px; margin: 7px 0 0; }
.related-view-all { display: inline-flex; align-items: center; gap: 9px; font-size: 12px; font-weight: 600; color: #704a94; text-decoration: none; }.related-view-all:hover { color: #472580; }.related-view-all:focus-visible { outline: 2px solid #916cb6; outline-offset: 4px; border-radius: 3px; }
.related-loading { display: grid; grid-template-columns: repeat(4,minmax(0,1fr)); gap: 24px; }.related-skeleton { height: 320px; border-radius: 12px; }
.related-error { display: flex; align-items: center; justify-content: center; flex-wrap: wrap; gap: 16px; padding: 32px 16px; border: 1px dashed #e6dced; border-radius: 12px; color: #927c9f; font-size: 13px; }
@media(max-width:1279px) { .related-loading { grid-template-columns: repeat(2,minmax(0,1fr)); } }
@media(max-width:599px) { .related-heading h2 { font-size: 21px; }.related-products { margin-top: 30px; padding-top: 25px; }.related-loading { grid-template-columns: 1fr; } }
@media(prefers-reduced-motion:reduce) { .related-skeleton { animation: none; } }
</style>
