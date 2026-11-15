<template>
  <section class="home-brands" aria-labelledby="brands-title">
    <h2 id="brands-title">Shop By Brands</h2>
    <ul class="brand-grid" aria-label="Brand preview">
      <motion.li v-for="brand in brands" :key="brand.name" class="tw:card brand-tile" :style="{ '--brand-color': brand.color }" :while-hover="{ y: -3 }">
        <span>{{ brand.name }}</span>
      </motion.li>
    </ul>
  </section>
</template>

<script setup>
import { motion } from 'motion-v'

// Text-only design previews from the homepage mockup; no brand imagery needed.
const brands = [
  { name: 'Kellogg’s', color: '#ca1834' },
  { name: 'Maggi', color: '#d72a28' },
  { name: 'Samsung', color: '#214795' },
  { name: 'boAt', color: '#23212b' },
  { name: 'Prestige', color: '#c8282d' },
  { name: 'Pigeon', color: '#ca303b' },
  { name: 'Apple', color: '#292831' },
  { name: 'HP', color: '#087ab7' },
  { name: 'Xiaomi', color: '#e76a1c' },
]
</script>

<style scoped>
.home-brands { padding-top: 33px; }
h2 { position: relative; color: #2f1d4b; font-size: 25px; font-weight: 740; line-height: 1.25; letter-spacing: -.7px; margin: 0 0 18px; padding-bottom: 13px; }
h2::after { content: ''; position: absolute; left: 0; bottom: 0; width: 43px; height: 3px; border-radius: 4px; background: #7850b1; }
.brand-grid { display: grid; grid-template-columns: repeat(9, minmax(0, 1fr)); gap: 14px; list-style: none; padding: 0; margin: 0; }
.brand-tile { min-width: 0; display: flex; align-items: center; justify-content: center; min-height: 73px; padding: 14px 8px; border: 1px solid #ece8f1; border-radius: 12px; background: #fff; box-shadow: 0 3px 9px rgb(40 22 68 / 3%); }
.brand-tile span { color: var(--brand-color); font-size: clamp(13px, 1.4vw, 20px); font-weight: 750; letter-spacing: -.5px; }
@media (max-width: 1100px) { .brand-grid { gap: 10px; } }
@media (max-width: 960px) { .brand-grid { grid-template-columns: repeat(5, minmax(0, 1fr)); } .brand-tile span { font-size: 18px; } }
@media (max-width: 600px) { .home-brands { padding-top: 28px; } h2 { font-size: 21px; margin-bottom: 16px; } .brand-grid { grid-template-columns: repeat(3, minmax(0, 1fr)); } .brand-tile { min-height: 65px; } .brand-tile span { font-size: 16px; } }
</style>
