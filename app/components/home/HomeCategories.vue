<template>
  <nav v-if="cards.length" class="home-categories" aria-label="Shop by category">
    <div ref="viewport" class="categories-viewport" @mouseenter="paused = true" @mouseleave="paused = false" @focusin="paused = true" @focusout="onFocusOut">
    <div class="categories-track" :class="{ 'is-resetting': resetting }" :style="{ transform: `translateX(calc(-${slideIndex} * (100% + var(--category-gap)) / var(--category-columns)))` }" @transitionend.self="finishSlide">
    <motion.div v-for="(category,index) in slides" :key="`${category.key}-${index}`" class="category-slide" :aria-hidden="index >= cards.length ? true : undefined" :while-hover="{ y: -3 }" :while-press="{ scale: 0.985 }">
      <NuxtLink :to="category.to" :tabindex="index >= cards.length ? -1 : undefined" class="tw:card category-card" :class="`category-${category.tone}`" @focus="revealSlide(index)">
        <img :src="category.imageUrl" :alt="category.name" width="640" height="480" loading="lazy" decoding="async" @error="onImageError" />
        <div class="category-copy">
          <h2>{{ category.name }}</h2>
          <p v-if="category.description">{{ category.description }}</p>
        </div>
        <span class="category-arrow" aria-hidden="true"><ChevronRight :size="17" /></span>
      </NuxtLink>
    </motion.div>
    </div>
    </div>
  </nav>
</template>

<script setup>
import { motion } from 'motion-v'
import { ChevronRight } from 'lucide-vue-next'

const cards = await useStorefrontCategories()
const viewport = ref(null)
const slideIndex = ref(0)
const resetting = ref(false)
const paused = ref(false)
const columns = ref(4)
const reducedMotion = ref(false)
const hasLoop = computed(() => cards.value.length > columns.value)
const slides = computed(() => hasLoop.value ? [...cards.value, ...cards.value.slice(0, columns.value)] : cards.value)
let timer, resizeObserver, motionQuery
const reset = () => { resetting.value = true; slideIndex.value = 0; nextTick(() => { requestAnimationFrame(() => { requestAnimationFrame(() => { resetting.value = false }) }) }) }
const finishSlide = () => { if (slideIndex.value >= cards.value.length) reset() }
const revealSlide = index => { if (index < cards.value.length) slideIndex.value = Math.min(index, Math.max(0, cards.value.length - columns.value)) }
const onFocusOut = event => { if (!event.currentTarget.contains(event.relatedTarget)) { paused.value = false; event.currentTarget.scrollLeft = 0 } }
const updateMotion = () => { reducedMotion.value = motionQuery.matches; if (reducedMotion.value) reset() }
onMounted(() => {
  motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
  updateMotion(); motionQuery.addEventListener('change', updateMotion)
  resizeObserver = new ResizeObserver(() => { const next = Number(getComputedStyle(viewport.value).getPropertyValue('--category-columns')); if (next !== columns.value) { columns.value = next; reset() } })
  resizeObserver.observe(viewport.value)
  timer = setInterval(() => { if (hasLoop.value && !paused.value && !reducedMotion.value && !document.hidden && !resetting.value) slideIndex.value++ }, 3500)
})
watch(cards, reset)
onUnmounted(() => { clearInterval(timer); resizeObserver?.disconnect(); motionQuery?.removeEventListener('change', updateMotion) })
const onImageError = event => {
  const image = event.target
  if (image.dataset.fallback) return
  image.dataset.fallback = 'true'
  image.src = '/assets/images/home/product-placeholder.webp'
}
</script>

<style scoped>
.home-categories { --category-columns: 4; --category-gap: 16px; padding-top: 28px; }
.categories-viewport { overflow: hidden; padding: 5px 0; }
.categories-track { display: flex; gap: var(--category-gap); transition: transform 650ms ease; will-change: transform; }
.categories-track.is-resetting { transition: none; }
.category-slide { flex: 0 0 calc((100% + var(--category-gap)) / var(--category-columns) - var(--category-gap)); min-width: 0; }
.category-card { height: 100%; }
.category-groceries { background: linear-gradient(115deg, #f0f9e9, #e9f4df); border-color: #e8f1df; }
.category-card { position: relative; display: flex; flex-direction: row; align-items: center; min-height: 122px; padding: 18px 39px 18px 13px; gap: 13px; overflow: hidden; border-radius: 13px; border: 1px solid transparent; color: #211538; }
.category-food { background: linear-gradient(115deg, #fff8e8, #fcf2db); border-color: #fbf0d8; }
.category-clothing { background: linear-gradient(115deg, #f9f0ff, #f2e5fc); border-color: #f1e4fa; }
.category-electronics { background: linear-gradient(115deg, #edf8ff, #e7f3ff); border-color: #e6f2fc; }
.category-kitchen { background: linear-gradient(115deg, #f1f9e8, #ecf5e2); border-color: #e9f1df; }
.category-card img { display: block; width: 103px; height: 88px; flex-shrink: 0; object-fit: contain; filter: drop-shadow(0 3px 4px rgb(33 21 56 / 5%)); }
.category-copy { min-width: 0; }
.category-copy h2 { font-size: 16px; font-weight: 730; line-height: 1.2; letter-spacing: -.35px; margin-bottom: 8px; }
.category-copy p { font-size: 11px; line-height: 1.65; color: #71634d; max-width: 145px; }
.category-clothing p { color: #766180; }
.category-electronics p { color: #5c6f85; }
.category-kitchen p { color: #657753; }
.category-arrow { position: absolute; right: 12px; top: 50%; transform: translateY(-50%); display: grid; place-items: center; width: 25px; height: 25px; border-radius: 50%; background: rgb(255 255 255 / 85%); color: #332344; box-shadow: 0 2px 5px rgb(33 21 56 / 5%); }
@media (max-width: 1200px) { .category-card { padding-left: 9px; gap: 8px; } .category-card img { width: 78px; height: 80px; } .category-copy h2 { font-size: 14px; } .category-copy p { font-size: 10px; } }
@media (max-width: 960px) { .home-categories { --category-columns: 2; --category-gap: 14px; } .category-card { padding: 18px 42px 18px 16px; } .category-card img { width: 100px; height: 86px; } .category-copy h2 { font-size: 16px; } .category-copy p { font-size: 11px; } }
@media (max-width: 600px) { .home-categories { --category-gap: 10px; padding-top: 20px; } .category-card { flex-direction: column; align-items: flex-start; gap: 9px; padding: 13px 14px 16px; min-height: 196px; border-radius: 12px; } .category-card img { width: 100%; height: 94px; } .category-copy h2 { font-size: 14px; margin-bottom: 5px; } .category-copy p { font-size: 10px; padding-right: 10px; } .category-arrow { width: 23px; height: 23px; right: 10px; top: auto; bottom: 13px; transform: none; } }
@media(prefers-reduced-motion:reduce) { .categories-track { transition: none; transform: none !important; flex-wrap: wrap; will-change: auto; } .category-slide[aria-hidden=true] { display:none; } }
</style>
