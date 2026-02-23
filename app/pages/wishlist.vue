<template>
  <div class="wishlist-page py-12 bg-grey-lighten-4 min-h-screen">
    <v-container class="custom-container">
      <div class="d-flex align-center justify-space-between mb-8">
        <h1 class="text-h3 font-weight-bold text-grey-darken-4">My Wishlist</h1>
        <v-btn to="/" variant="text" color="primary" prepend-icon="mdi-arrow-left" class="text-none font-weight-bold">
          Continue Shopping
        </v-btn>
      </div>

      <v-row v-if="wishlist.productIds.length > 0">
        <v-col 
          v-for="product in wishlist.items" 
          :key="product.id" 
          cols="12" 
          sm="6" 
          md="4" 
          lg="3"
        >
          <v-card class="product-card h-100 d-flex flex-column rounded-xl border pa-4" elevation="0">
            <!-- Remove Button -->
            <v-btn
              icon="mdi-close"
              variant="flat"
              color="white"
              size="x-small"
              class="position-absolute top-0 right-0 ma-2 z-10 shadow-sm border"
              @click="wishlist.toggleWishlist(product)"
            ></v-btn>

            <NuxtLink :to="`/products/${product.slug}`" class="text-decoration-none">
              <div class="bg-grey-lighten-5 rounded-lg mb-4 pa-4 d-flex align-center justify-center" style="height: 180px;">
                <v-img :src="getImageUrl(product.cover_image)" height="140" contain></v-img>
              </div>
              <h3 class="text-subtitle-1 font-weight-bold text-grey-darken-4 text-truncate mb-1">{{ product.name }}</h3>
            </NuxtLink>
            
            <div class="text-caption text-grey mb-3">{{ product.category?.name || 'Category' }}</div>

            <div class="mt-auto">
              <div class="d-flex align-center mb-4">
                <span class="text-h6 font-weight-black text-primary mr-2">
                  ${{ (product.discount_price || product.base_price || 0) }}
                </span>
                <span v-if="product.discount_price" class="text-caption text-decoration-line-through text-grey">
                  ${{ product.base_price }}
                </span>
              </div>

              <v-btn
                block
                color="primary"
                prepend-icon="mdi-cart-outline"
                class="rounded-lg text-none font-weight-bold"
                elevation="0"
                :loading="addingToCart === product.id"
                @click="addToCart(product)"
              >
                Add to Cart
              </v-btn>
            </div>
          </v-card>
        </v-col>
      </v-row>

      <!-- Empty State -->
      <div v-else class="text-center py-16 bg-white rounded-xl border">
        <v-icon icon="mdi-heart-outline" size="120" color="grey-lighten-2" class="mb-6"></v-icon>
        <h2 class="text-h4 font-weight-bold mb-4">Your wishlist is empty</h2>
        <p class="text-body-1 text-grey mb-8">Save your favorite items here to wrap them up later!</p>
        <v-btn color="primary" size="large" class="px-12 rounded-lg font-weight-bold text-none" to="/">
          Explore Products
        </v-btn>
      </div>
    </v-container>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useWishlistStore } from '~/stores/wishlist'
import { useCartStore } from '~/stores/cart'

const wishlist = useWishlistStore()
const cart = useCartStore()
const addingToCart = ref(null)

useHead({
  title: 'My Wishlist - FGXMART'
})
凄
const getImageUrl = (path) => {
  if (!path) return 'https://placehold.co/200'
  if (path.startsWith('http')) return path
  return `http://localhost:8000/storage/${path}`
}

const addToCart = async (product) => {
  addingToCart.value = product.id
  await cart.addToCart(product, 1)
  addingToCart.value = null
}

onMounted(async () => {
    if (wishlist.items.length === 0 && wishlist.productIds.length > 0) {
        await wishlist.fetchWishlist()
    }
})
</script>

<style scoped>
.product-card {
  transition: all 0.3s ease;
  border-color: #eee !important;
}

.product-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 10px 30px rgba(0,0,0,0.08) !important;
  border-color: rgb(var(--v-theme-primary)) !important;
}

.z-10 {
  z-index: 10;
}

.shadow-sm {
  box-shadow: 0 2px 4px rgba(0,0,0,0.05) !important;
}
</style>
