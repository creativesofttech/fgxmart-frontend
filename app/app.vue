<template>
  <NuxtLayout>
    <NuxtPage />
  </NuxtLayout>
</template>

<script setup>
import { useAuthStore } from '~/stores/auth'
import { useCartStore } from '~/stores/cart'
import { useWishlistStore } from '~/stores/wishlist'

const auth = useAuthStore()
const cart = useCartStore()
const wishlist = useWishlistStore()

onMounted(async () => {
  auth.init()
  cart.initCart()
  wishlist.initWishlist()
  
  if (auth.isLoggedIn) {
    // Sync cart items if any exist from guest session
    if (cart.items.length > 0) {
      await cart.syncCart()
    }
    await cart.fetchCart()

    // Sync wishlist if any exist from guest session
    if (wishlist.productIds.length > 0) {
      await wishlist.syncWishlist()
    }
    await wishlist.fetchWishlist()
  }
})
</script>
