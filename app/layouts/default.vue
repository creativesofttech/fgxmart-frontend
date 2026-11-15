<template>
  <MotionConfig reduced-motion="user" :transition="{ duration: 0.25 }">
    <v-app class="storefront-shell" data-theme="fgx">
      <a class="skip-to-content" href="#storefront-main">Skip to content</a>
      <StorefrontHeader />
      <v-main id="storefront-main" tabindex="-1">
        <slot />
      </v-main>
      <Footer />
    </v-app>
  </MotionConfig>
</template>

<script setup>
import StorefrontHeader from '~/components/layout/StorefrontHeader.vue'
</script>

<style lang="scss">
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: var(--app-font-family);
  color: #4a5568;
  line-height: 1.5;
  background-color: #f9f9f9; // Light bg for whole site
}

a { text-decoration: none; color: inherit; }
ul { list-style: none; padding: 0; margin: 0; }
button { font-family: inherit; }
.storefront-shell { background: #fff; }
.skip-to-content { position: fixed; top: -60px; left: 16px; z-index: 2000; padding: 12px 20px; background: #472580; color: white; border-radius: 8px; }
.skip-to-content:focus { top: 8px; }
</style>
