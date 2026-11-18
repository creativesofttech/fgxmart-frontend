<template>
  <div class="legal-page"><div class="legal-container">
    <nav class="legal-breadcrumb" aria-label="Breadcrumb"><NuxtLink to="/"><House :size="14" aria-hidden="true" /> Home</NuxtLink><ChevronRight :size="14" aria-hidden="true" /><span aria-current="page">{{ title }}</span></nav>
    <header class="legal-heading"><span><ShieldCheck v-if="slug === 'privacy-policy'" :size="29" aria-hidden="true" /><FileText v-else :size="29" aria-hidden="true" /></span><div><p>FGX MART · INFORMATION & POLICIES</p><h1>{{ title }}</h1><small v-if="updatedAt">Last updated {{ updatedAt }}</small></div></header>
    <div v-if="pending" class="legal-loading" role="status">Loading page...</div>
    <div v-else-if="error" class="legal-error" role="alert"><h2>This page is temporarily unavailable</h2><p>Please try again in a moment.</p><button class="tw:btn tw:btn-primary" type="button" @click="refresh">Try again</button></div>
    <div v-else class="legal-layout"><article class="legal-content" :aria-label="title"><ProductRichDescription :html="response?.data?.content || ''" fallback="Content will be available soon." /></article><aside class="legal-sidebar"><span class="legal-help-icon"><CircleHelp :size="24" aria-hidden="true" /></span><h2>A little more clarity</h2><p>Find practical answers about shopping, product lists and contacting our team.</p><NuxtLink to="/faqs">Visit our help centre <ArrowUpRight :size="16" aria-hidden="true" /></NuxtLink><NuxtLink :to="otherPage.path">{{ otherPage.label }} <ChevronRight :size="16" aria-hidden="true" /></NuxtLink><NuxtLink to="/products">Explore the catalogue <ChevronRight :size="16" aria-hidden="true" /></NuxtLink></aside></div>
  </div></div>
</template>
<script setup>
import { ArrowUpRight, ChevronRight, CircleHelp, FileText, House, ShieldCheck } from 'lucide-vue-next'
const props = defineProps({ slug: { type: String, required: true } })
const config = useRuntimeConfig()
const { data: response, pending, error, refresh } = await useFetch(config.public.apiBase + '/legal-pages/' + props.slug, { key: 'legal-page-' + props.slug, getCachedData: () => undefined })
const title = computed(() => response.value?.data?.title || (props.slug === 'privacy-policy' ? 'Privacy Policy' : 'Terms & Conditions'))
const updatedAt = computed(() => {
  const value = response.value?.data?.updated_at
  if (!value || Number.isNaN(Date.parse(value))) return ''
  return new Intl.DateTimeFormat('en', { dateStyle: 'long' }).format(new Date(value))
})
const otherPage = computed(() => props.slug === 'privacy-policy' ? { path: '/terms-and-conditions', label: 'Terms & Conditions' } : { path: '/privacy-policy', label: 'Privacy Policy' })
useHead(() => ({ title: `${title.value} | FGX MART`, meta: [{ name: 'description', content: `Read the ${title.value} for using FGX MART.` }] }))
</script>
<style scoped>
.legal-page { background: #fcfaff; color: #392646; }.legal-container { max-width: var(--storefront-container-width); margin-inline: auto; padding: 24px 40px 60px; }.legal-breadcrumb { display: flex; align-items: center; gap: 9px; flex-wrap: wrap; font-size: 11px; color: #9a83ab; margin-bottom: 24px; }.legal-breadcrumb a { display: flex; gap: 6px; align-items: center; color: #7f6096; }
.legal-heading { display: flex; align-items: center; gap: 24px; background: linear-gradient(120deg,#f2eafa,#fcfaff); border: 1px solid #e8ddf1; padding: 35px; border-radius: 16px; margin-bottom: 30px; }.legal-heading > span { display: grid; place-items: center; width: 65px; height: 65px; flex-shrink: 0; background: #e9ddf6; color: #9372b0; border-radius: 17px; }.legal-heading p { font-size: 9px; letter-spacing: 1.7px; color: #a086b2; margin: 0 0 8px; }.legal-heading h1 { font-size: clamp(26px,3vw,40px); font-weight: 700; line-height: 1.3; letter-spacing: -.9px; margin: 0; overflow-wrap: anywhere; }.legal-heading small { display: block; margin-top: 12px; color: #9b83ab; font-size: 11px; }
.legal-layout { display: grid; grid-template-columns: minmax(0,1fr) 275px; gap: 28px; align-items: start; }.legal-content { min-width: 0; background: white; padding: 35px; border: 1px solid #e8e0ef; border-radius: 14px; color: #756181; }.legal-content :deep(.product-rich-description) { max-width: 1050px; }.legal-content :deep(h2), .legal-content :deep(h3) { color: #614376; }.legal-content :deep(p) { line-height: 1.9; }
.legal-sidebar { padding: 25px; border: 1px solid #e8e0ef; border-radius: 13px; background: #fff; }.legal-help-icon { display: grid; place-items: center; width: 44px; height: 44px; border-radius: 12px; color: #9b7ab5; background: #f0e9f9; margin-bottom: 17px; }.legal-sidebar h2 { font-size: 17px; font-weight: 650; margin: 0 0 10px; }.legal-sidebar p { color: #9b84aa; font-size: 12px; line-height: 1.8; margin: 0 0 22px; }.legal-sidebar a { display: flex; justify-content: space-between; align-items: center; gap: 9px; padding: 14px 0; border-top: 1px solid #f0e9f5; color: #876298; font-size: 11px; }.legal-sidebar svg { flex-shrink: 0; }
.legal-error, .legal-loading { padding: 40px; text-align: center; background: white; border: 1px solid #e8e0ef; border-radius: 14px; color: #967fa5; }.legal-error h2 { font-size: 20px; }.legal-error p { margin: 15px 0; font-size: 13px; }.legal-error button { padding: 10px 17px; background: #72508d; color: white; border-radius: 8px; }
@media(max-width:1100px) { .legal-container { padding-inline: 24px; }.legal-layout { grid-template-columns: minmax(0,1fr) 240px; gap: 20px; } }
@media(max-width:800px) { .legal-layout { grid-template-columns: 1fr; }.legal-heading { padding: 25px; gap: 17px; }.legal-content { padding: 25px; } }
@media(max-width:760px) { .legal-container { padding: 20px 16px 40px; }.legal-heading { padding: 22px; align-items: flex-start; }.legal-heading > span { width: 44px; height: 44px; border-radius: 12px; }.legal-heading p { font-size: 8px; letter-spacing: 1px; }.legal-heading h1 { font-size: 27px; }.legal-content { padding: 22px; } }
</style>
