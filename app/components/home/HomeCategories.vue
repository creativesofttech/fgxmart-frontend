<template>
  <nav v-if="cards.length" class="home-categories" aria-label="Shop by category">
    <motion.div v-for="category in cards" :key="category.key" :while-hover="{ y: -4 }" :while-press="{ scale: 0.985 }">
      <NuxtLink :to="category.to" class="tw:card category-card" :class="`category-${category.tone}`">
        <img :src="category.imageUrl" :alt="category.name" width="640" height="480" loading="lazy" decoding="async" @error="onImageError" />
        <div class="category-copy">
          <h2>{{ category.name }}</h2>
          <p v-if="category.description">{{ category.description }}</p>
        </div>
        <span class="category-arrow" aria-hidden="true"><ChevronRight :size="17" /></span>
      </NuxtLink>
    </motion.div>
  </nav>
</template>

<script setup>
import { motion } from 'motion-v'
import { ChevronRight } from 'lucide-vue-next'

const cards = await useStorefrontCategories()
const onImageError = event => {
  const image = event.target
  if (image.dataset.fallback) return
  image.dataset.fallback = 'true'
  image.src = '/assets/images/home/product-placeholder.webp'
}
</script>

<style scoped>
.home-categories { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 16px; padding-top: 28px; }
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
@media (max-width: 960px) { .home-categories { grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 14px; } .category-card { padding: 18px 42px 18px 16px; } .category-card img { width: 100px; height: 86px; } .category-copy h2 { font-size: 16px; } .category-copy p { font-size: 11px; } }
@media (max-width: 600px) { .home-categories { gap: 10px; padding-top: 20px; } .category-card { flex-direction: column; align-items: flex-start; gap: 9px; padding: 13px 14px 16px; min-height: 196px; border-radius: 12px; } .category-card img { width: 100%; height: 94px; } .category-copy h2 { font-size: 14px; margin-bottom: 5px; } .category-copy p { font-size: 10px; padding-right: 10px; } .category-arrow { width: 23px; height: 23px; right: 10px; top: auto; bottom: 13px; transform: none; } }
</style>
