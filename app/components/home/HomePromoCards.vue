<template>
  <section class="home-promotions" aria-label="Explore more at FGX MART">
    <article class="tw:card promo-card promo-pantry">
      <div class="promo-copy">
        <p class="promo-eyebrow">Good things, every day</p>
        <h2>Everyday essentials<br />at great prices.</h2>
        <p class="promo-description">Packed food &amp; groceries</p>
        <motion.div class="promo-action" :while-hover="{ x: 3 }" :while-press="{ scale: 0.97 }">
          <NuxtLink to="/products" class="tw:btn tw:btn-secondary promo-button" aria-label="Shop everyday essentials">
            Shop now <ArrowRight :size="16" aria-hidden="true" />
          </NuxtLink>
        </motion.div>
      </div>
      <img src="/assets/images/home/card-1.webp" alt="Packed lentils, oats, pickle and moringa powder" width="1200" height="600" loading="lazy" decoding="async" />
    </article>
    <article class="tw:card promo-card promo-lifestyle">
      <div class="promo-copy">
        <p class="promo-eyebrow">A little everyday upgrade</p>
        <h2>Upgrade your<br />home &amp; lifestyle.</h2>
        <p class="promo-description">Clothing · Electronics · Kitchen</p>
        <motion.div class="promo-action" :while-hover="{ x: 3 }" :while-press="{ scale: 0.97 }">
          <NuxtLink to="/products" class="tw:btn tw:btn-secondary promo-button" aria-label="Shop home and lifestyle products">
            Shop now <ArrowRight :size="16" aria-hidden="true" />
          </NuxtLink>
        </motion.div>
      </div>
      <img src="/assets/images/home/card-2.webp" alt="Clothing, headphones, a blender and cookware" width="1200" height="600" loading="lazy" decoding="async" />
    </article>
  </section>
</template>

<script setup>
import { motion } from 'motion-v'
import { ArrowRight } from 'lucide-vue-next'
</script>

<style scoped>
.home-promotions { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 22px; padding-top: 30px; }
.promo-card { position: relative; isolation: isolate; overflow: hidden; min-height: 270px; border-radius: 17px; padding: 32px; display: flex; justify-content: center; }
.promo-pantry { background: radial-gradient(ellipse at 86% 30%, #9768bc 0%, transparent 65%), linear-gradient(115deg, #482677, #72489a); color: #fff; }
.promo-lifestyle { background: radial-gradient(ellipse at 83% 30%, #fffaf1 0%, transparent 70%), linear-gradient(115deg, #f3e0d8, #f3e8dc); color: #3c2468; }
.promo-card::after { content: ''; position: absolute; z-index: -1; right: -5%; bottom: -45px; width: 65%; height: 95px; border-radius: 50%; background: rgb(35 13 53 / 13%); filter: blur(18px); }
.promo-copy { position: relative; z-index: 1; width: 51%; }
.promo-eyebrow { font-size: 9px; letter-spacing: 1.2px; text-transform: uppercase; font-weight: 600; margin: 0 0 13px; opacity: .75; }
.promo-copy h2 { font-size: clamp(24px, 2.1vw, 31px); line-height: 1.14; font-weight: 750; letter-spacing: -.8px; margin: 0 0 12px; }
.promo-description { font-size: 12px; line-height: 1.7; margin: 0 0 21px; }
.promo-action { width: fit-content; }
.promo-button { min-height: 36px; height: 36px; padding: 0 17px; gap: 13px; border: 0; border-radius: 99px; background: #528915; color: #fff; font-size: 11px; font-weight: 650; box-shadow: 0 4px 12px rgb(30 47 6 / 10%); }
.promo-button:hover { background: #427510; }
.promo-button:focus-visible { outline: 3px solid currentColor; outline-offset: 4px; }
.promo-card img { position: absolute; z-index: 0; right: 7px; bottom: 12px; width: 58%; height: 81%; object-fit: contain; object-position: right bottom; filter: drop-shadow(0 9px 7px rgb(25 13 28 / 14%)); }
@media (max-width: 1100px) {
  .home-promotions { gap: 16px; }
  .promo-card { padding: 25px; min-height: 250px; }
  .promo-copy { width: 59%; }
  .promo-copy h2 { font-size: 25px; }
  .promo-eyebrow { font-size: 8px; letter-spacing: .8px; }
  .promo-description { font-size: 11px; max-width: 160px; }
  .promo-card img { width: 54%; height: 66%; right: 3px; }
}
@media (max-width: 760px) {
  .home-promotions { grid-template-columns: 1fr; padding-top: 24px; }
  .promo-card { min-height: 255px; padding: 28px; }
  .promo-copy { width: 50%; }
  .promo-copy h2 { font-size: 28px; }
  .promo-card img { width: 57%; height: 82%; right: 10px; }
}
@media (max-width: 420px) {
  .promo-card { min-height: 340px; padding: 24px; justify-content: flex-start; }
  .promo-copy { width: 100%; }
  .promo-copy h2 { font-size: 27px; }
  .promo-eyebrow { margin-bottom: 10px; }
  .promo-description { max-width: none; margin-bottom: 14px; }
  .promo-card img { width: 69%; height: 43%; right: 9px; bottom: 9px; }
}
</style>
