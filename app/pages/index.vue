<template>
  <div class="home-page">
    <HeroSection />
    
    <CategoryBrowser />

    <FeaturedProducts />

    <!-- Placeholder for other sections -->
  </div>
</template>

<script setup>
import HeroSection from '~/components/HeroSection.vue'
import CategoryBrowser from '~/components/home/CategoryBrowser.vue'
import FeaturedProducts from '~/components/home/FeaturedProducts.vue'

useHead({
  title: 'FGXMART - Online Grocery Store',
  meta: [
    { name: 'description', content: 'FGXMART offers fresh vegetables, fruits, and daily needs delivered to your doorstep.' }
  ]
})
</script>
