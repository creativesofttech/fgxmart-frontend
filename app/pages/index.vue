<template>
  <div class="home-page">
    <HomeHero />
    <div class="home-content">
      <HomeCategories />
      <HomeFeaturedProducts />
      <HomePromoCards />
      <HomeProductCollection kind="new-arrivals" title="New Arrivals" />
      <HomeProductCollection kind="best-sellers" title="Best Sellers" />
      <HomeBrands />
    </div>
    <HomeShoppingCta />
  </div>
</template>

<script setup>
import HomeHero from '~/components/home/HomeHero.vue'
import HomeCategories from '~/components/home/HomeCategories.vue'
import HomeFeaturedProducts from '~/components/home/HomeFeaturedProducts.vue'
import HomePromoCards from '~/components/home/HomePromoCards.vue'
import HomeProductCollection from '~/components/home/HomeProductCollection.vue'
import HomeBrands from '~/components/home/HomeBrands.vue'
import HomeShoppingCta from '~/components/home/HomeShoppingCta.vue'

useHead({
  title: 'FGX MART — Your everyday shopping destination',
  meta: [
    { name: 'description', content: 'Explore packed food, clothing, electronics and kitchen essentials at FGX MART. Select your products, download your list and send an enquiry.' }
  ]
})
</script>

<style scoped>
.home-page { width: 100%; }
.home-content { width: min(1440px, 100%); padding-inline: 40px; margin-inline: auto; padding-bottom: 52px; }
@media (max-width: 1100px) { .home-content { padding-inline: 24px; } }
@media (max-width: 760px) { .home-content { padding-inline: 16px; } }
@media (max-width: 1100px) { .home-content { padding-bottom: 40px; } }
@media (max-width: 600px) { .home-content { padding-bottom: 32px; } }
</style>
