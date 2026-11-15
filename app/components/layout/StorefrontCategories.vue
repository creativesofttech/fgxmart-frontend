<template>
  <details ref="menu" class="tw:dropdown category-dropdown" @toggle="onToggle" @keydown.esc.prevent.stop="close(true)" @pointerleave="clearHover">
    <summary role="button" class="tw:btn tw:btn-primary categories-trigger"><Menu :size="17" aria-hidden="true" /><span>All categories</span><ChevronDown :size="14" aria-hidden="true" /></summary>
    <ul class="category-menu" aria-label="Product categories">
      <li class="all-products-row"><NuxtLink to="/products" @click="close()">All products <ArrowUpRight :size="15" aria-hidden="true" /></NuxtLink></li>
      <li v-for="category in categories" :key="category.key" class="category-row" @pointerenter="hoverCategory($event, category)" @focusin="onRowFocus($event, category)">
        <div class="category-row-main" :class="{ 'is-expanded': activeCategory === category.key }">
          <NuxtLink :to="category.to" @click="close()">{{ category.name }}</NuxtLink>
          <button v-if="category.children.length" type="button" class="subcategory-toggle" :aria-label="`Show ${category.name} subcategories`" :aria-expanded="activeCategory === category.key" :aria-controls="`subcategories-${category.key}`" @click="toggleChildren(category)" @keydown.right.prevent="focusChildren(category)"><ChevronRight :size="15" aria-hidden="true" /></button>
        </div>
        <ul v-if="category.children.length" v-show="activeCategory === category.key" :id="`subcategories-${category.key}`" class="category-flyout" :aria-label="`${category.name} subcategories`" @keydown.left.prevent.stop="returnToParent(category)">
          <li class="flyout-heading" aria-hidden="true">{{ category.name }}</li>
          <li v-for="child in category.children" :key="child.id"><NuxtLink :to="`/category/${child.slug}`" @click="close()"><img v-if="child.image_url" :src="child.image_url" alt="" width="30" height="30" loading="lazy" /><span>{{ child.name }}</span><ChevronRight :size="14" aria-hidden="true" /></NuxtLink></li>
        </ul>
      </li>
      <li v-if="!categories.length" class="category-empty">Categories are coming soon.</li>
    </ul>
  </details>
</template>
<script setup>
import { ArrowUpRight, ChevronDown, ChevronRight, Menu } from 'lucide-vue-next'
const props = defineProps({ categories: { type: Array, default: () => [] } })
const route = useRoute()
const menu = ref(null)
const activeCategory = ref(null)
const close = (restoreFocus = false) => { activeCategory.value = null; if (menu.value) { menu.value.open = false; if (restoreFocus) menu.value.querySelector('summary')?.focus() } }
const onToggle = () => { if (!menu.value?.open) activeCategory.value = null }
const hoverCategory = (event, category) => { if (event.pointerType === 'mouse') activeCategory.value = category.children.length ? category.key : null }
const clearHover = event => { if (event.pointerType === 'mouse' && !menu.value?.contains(document.activeElement)) activeCategory.value = null }
const onRowFocus = (event, category) => { if (event.target.closest('.category-row-main')) activeCategory.value = null }
const toggleChildren = category => { activeCategory.value = activeCategory.value === category.key ? null : category.key }
const focusChildren = async category => { activeCategory.value = category.key; await nextTick(); menu.value?.querySelector(`#subcategories-${category.key} a`)?.focus() }
const returnToParent = category => { activeCategory.value = null; menu.value?.querySelector(`[aria-controls="subcategories-${category.key}"]`)?.focus() }
const onOutsideClick = event => { if (!menu.value?.contains(event.target)) close() }
watch(() => route.fullPath, () => close())
onMounted(() => document.addEventListener('pointerdown', onOutsideClick))
onUnmounted(() => document.removeEventListener('pointerdown', onOutsideClick))
</script>
<style scoped>
.category-dropdown { position: relative; flex: 0 0 170px; }
.categories-trigger { display: flex; align-items: center; justify-content: space-between; width: 100%; min-height: 36px; height: 36px; gap: 8px; padding: 0 12px; font-size: 12px; font-weight: 600; color: white; background: #472580; border: 0; border-radius: 7px; list-style: none; }
.categories-trigger::-webkit-details-marker { display: none; }
.categories-trigger svg { flex-shrink: 0; }
.categories-trigger span { white-space: nowrap; }
.category-menu { position: absolute; top: calc(100% + 12px); left: 0; z-index: 50; display: flex; flex-direction: column; flex-wrap: nowrap; width: 230px; padding: 7px; list-style: none; margin: 0; background: white; border: 1px solid #eae5f0; border-radius: 12px; box-shadow: 0 12px 40px rgb(33 21 56 / 12%); font-size: 13px; overflow: visible; }
.category-menu li { list-style: none; margin: 0; }
.category-menu a { display: flex; align-items: center; gap: 10px; min-width: 0; padding: 11px 12px; color: #332344; border-radius: 7px; line-height: 1.5; overflow-wrap: anywhere; }
.category-menu a:hover, .category-row-main:hover, .category-row-main.is-expanded { background: #f3eefb; color: #472580; }
.all-products-row { padding-bottom: 5px; margin-bottom: 5px !important; border-bottom: 1px solid #f0eaf6; }
.all-products-row a { justify-content: space-between; }
.category-row { position: relative; }
.category-row-main { display: flex; align-items: stretch; border-radius: 7px; }
.category-row-main > a { flex: 1; }
.subcategory-toggle { display: grid; place-items: center; flex-shrink: 0; width: 36px; border: 0; background: transparent; color: #73548d; border-radius: 7px; cursor: pointer; }
.subcategory-toggle:hover { background: #e9def7; }
.category-flyout { position: absolute; top: -8px; left: calc(100% + 8px); z-index: 51; width: 250px; max-height: min(420px, 65vh); overflow-y: auto; padding: 8px; margin: 0; background: white; border: 1px solid #eae5f0; border-radius: 12px; box-shadow: 0 12px 35px rgb(33 21 56 / 12%); }
.category-row:has(.category-flyout)::after { content: ''; position: absolute; left: 100%; top: 0; width: 10px; height: 100%; }
.flyout-heading { padding: 9px 12px 13px; font-size: 10px; text-transform: uppercase; letter-spacing: 1px; font-weight: 700; color: #9b89ac; }
.category-flyout a > span { flex: 1; }
.category-flyout img { width: 30px; height: 30px; object-fit: contain; border-radius: 5px; }
.category-empty { padding: 12px; color: #8a7d94; }
@media(max-width: 1100px) { .category-dropdown { flex-basis: 160px; } }
@media(max-width: 760px) {
  .category-dropdown { flex-basis: 132px; }
  .categories-trigger { height: 33px; min-height: 33px; font-size: 10px; gap: 6px; padding-inline: 9px; }
  .category-menu { width: min(280px, calc(100vw - 32px)); max-height: 65vh; overflow-y: auto; overscroll-behavior: contain; }
  .category-row:has(.category-flyout)::after { display: none; }
  .category-flyout { position: static; width: auto; max-height: none; overflow: visible; padding: 4px 0 5px 10px; margin: 1px 8px 5px 12px; background: #faf8fd; border: 0; border-left: 2px solid #e9dff4; border-radius: 0 7px 7px 0; box-shadow: none; }
  .flyout-heading { display: none; }
  .category-flyout a { font-size: 12px; }
  .subcategory-toggle[aria-expanded=true] svg { transform: rotate(90deg); }
}
</style>
