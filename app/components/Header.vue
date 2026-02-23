<template>
  <header class="header-container">
    <TopBar />
    
    <!-- Placeholder to exist only when header is fixed to prevent layout shift -->
    <div v-if="isFixed" :style="{ height: headerHeight + 'px' }"></div>

    <v-sheet
      ref="stickyHeader"
      class="sticky-wrapper w-100"
      :class="{ 'fixed-header': isFixed, 'hidden-header': isHidden }"
      :elevation="isFixed ? 3 : 0"
      color="white"
    >
      <MiddleHeader />
      <Navbar />
    </v-sheet>
  </header>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import TopBar from '~/components/header/TopBar.vue'
import MiddleHeader from '~/components/header/MiddleHeader.vue'
import Navbar from '~/components/header/NavBar.vue'

const isFixed = ref(false)
const isHidden = ref(false)
const headerHeight = ref(0)
const stickyHeader = ref(null)

let lastScrollY = 0

const handleScroll = () => {
    const currentScrollY = window.scrollY
    const threshold = 150 // Wait until we've scrolled past the header roughly

    if (currentScrollY > threshold) {
        // If transitioning to fixed for the first time, capture height
        if (!isFixed.value) {
            headerHeight.value = stickyHeader.value?.$el?.offsetHeight || 0
            isFixed.value = true
        }

        // Check direction
        if (currentScrollY > lastScrollY) {
            // Scrolling DOWN
            isHidden.value = true
        } else {
            // Scrolling UP
            isHidden.value = false
        }
    } else {
        // Back at top
        isFixed.value = false
        isHidden.value = false
    }
    
    lastScrollY = currentScrollY
}

onMounted(() => {
    window.addEventListener('scroll', handleScroll, { passive: true })
})

onUnmounted(() => {
    window.removeEventListener('scroll', handleScroll)
})
</script>

<style scoped>
.sticky-wrapper {
  z-index: 1000;
  transition: transform 0.3s ease-in-out, box-shadow 0.3s ease;
}

.fixed-header {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
}

.hidden-header {
  transform: translateY(-100%);
}
</style>
