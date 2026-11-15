<template>
  <section class="shopping-cta" aria-labelledby="shopping-cta-title">
    <div class="cta-container">
      <img class="cta-art" src="/assets/images/home/cta-shopping-cart.webp" alt="Shopping trolley with green and purple bags and cardboard boxes" width="640" height="640" loading="lazy" decoding="async" />
      <div class="cta-copy">
        <h2 id="shopping-cta-title">Shop more. <span>Discover more.</span></h2>
        <p>Everyday essentials and a little of everything.<br />Pick your favourites. Let’s take it from there.</p>
      </div>
      <div class="cta-action">
        <ul class="cta-benefits">
          <li><PackageCheck aria-hidden="true" /><span>Everyday<br />essentials</span></li>
          <li><FileDown aria-hidden="true" /><span>Easy PDF<br />catalogue</span></li>
          <li><MessageCircle aria-hidden="true" /><span>Personal<br />support</span></li>
        </ul>
        <motion.div :while-hover="{ y: -2 }" :while-press="{ scale: 0.98 }">
          <NuxtLink to="/products" class="tw:btn tw:btn-secondary cta-button"><ShoppingCart :size="23" aria-hidden="true" /> Start shopping now <ArrowRight :size="23" aria-hidden="true" /></NuxtLink>
        </motion.div>
      </div>
    </div>
  </section>
</template>

<script setup>
import { motion } from 'motion-v'
import { ArrowRight, FileDown, MessageCircle, PackageCheck, ShoppingCart } from 'lucide-vue-next'
</script>

<style scoped>
.shopping-cta { position: relative; isolation: isolate; overflow: hidden; background: #f8f5ff; color: #34205b; }
.shopping-cta::before, .shopping-cta::after { content: ''; position: absolute; z-index: -1; bottom: -130px; width: 380px; height: 210px; border-radius: 50%; background: linear-gradient(135deg, #d4bcfb, #eee5fd); }
.shopping-cta::before { left: -210px; transform: rotate(35deg); }
.shopping-cta::after { right: -220px; transform: rotate(-35deg); }
.cta-container { width: min(var(--storefront-container-width), 100%); margin-inline: auto; padding: 26px 40px; display: grid; grid-template-columns: 190px 1.2fr 1fr; align-items: center; gap: 30px; min-height: 230px; }
.cta-art { display: block; width: 190px; height: 190px; object-fit: contain; }
.cta-copy h2 { font-size: clamp(25px, 2.5vw, 36px); font-weight: 800; letter-spacing: -1.1px; line-height: 1.2; margin: 0 0 19px; }
.cta-copy h2 span { position: relative; white-space: nowrap; }
.cta-copy h2 span::after { content: ''; position: absolute; height: 5px; background: #82bc28; width: 75%; right: 0; bottom: -7px; border-radius: 50%; transform: rotate(-2deg); }
.cta-copy p { color: #62517d; font-size: 15px; line-height: 1.7; margin: 0; }
.cta-action { border-left: 1px solid #d9c8ee; padding-left: 30px; }
.cta-benefits { display: flex; justify-content: space-between; gap: 14px; margin: 0 0 25px; padding: 0; list-style: none; }
.cta-benefits li { display: flex; align-items: center; gap: 9px; font-size: 11px; font-weight: 650; line-height: 1.3; }
.cta-benefits svg { width: 28px; height: 28px; stroke-width: 1.6; flex-shrink: 0; }
.cta-button { display: flex; width: fit-content; max-width: 100%; margin-inline: auto; min-height: 49px; height: auto; padding: 12px 20px; gap: 14px; border: 0; border-radius: 99px; background: linear-gradient(110deg, #649e21, #337624); color: #fff; font-size: 16px; font-weight: 700; }
.cta-button:hover { background: #397b23; }
@media (max-width: 1100px) { .cta-container { padding-inline: 24px; grid-template-columns: 145px 1fr 1fr; gap: 20px; } .cta-art { width: 145px; height: 170px; } .cta-copy h2 { font-size: 27px; } .cta-copy p { font-size: 12px; } .cta-action { padding-left: 20px; } .cta-benefits { gap: 9px; } .cta-benefits li { flex-direction: column; text-align: center; font-size: 10px; } .cta-button { font-size: 13px; gap: 10px; padding-inline: 12px; } }
@media (max-width: 760px) { .cta-container { padding: 30px 16px; grid-template-columns: 120px 1fr; gap: 18px; } .cta-art { width: 120px; height: 140px; } .cta-copy h2 { font-size: 26px; } .cta-copy h2 span { white-space: normal; } .cta-copy p { font-size: 12px; } .cta-copy p br { display: none; } .cta-action { grid-column: 1 / -1; border-left: 0; padding: 20px 0 0; border-top: 1px solid #e4d9f2; } .cta-benefits { justify-content: space-around; margin-bottom: 20px; } .cta-benefits li { flex-direction: row; text-align: left; font-size: 11px; } .cta-button { font-size: 15px; } }
@media (max-width: 360px) { .cta-container { grid-template-columns: 90px 1fr; gap: 12px; } .cta-art { width: 90px; height: 125px; } .cta-copy h2 { font-size: 23px; } .cta-benefits li { gap: 6px; font-size: 9px; } .cta-benefits svg { width: 24px; } }
</style>
