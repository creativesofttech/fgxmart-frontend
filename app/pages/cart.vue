<template>
  <div class="cart-page py-12 bg-grey-lighten-4 min-h-screen">
    <v-container class="custom-container">
      <h1 class="text-h3 font-weight-bold mb-8 text-grey-darken-4">Shopping Cart</h1>

      <v-row v-if="!cart.isEmpty">
        <!-- Cart Items List -->
        <v-col cols="12" lg="8">
          <v-card class="rounded-xl border shadow-sm overflow-hidden" elevation="0">
            <v-table class="cart-table">
              <thead>
                <tr class="bg-grey-lighten-5">
                  <th class="text-subtitle-1 font-weight-bold py-4 pl-6">Product</th>
                  <th class="text-subtitle-1 font-weight-bold py-4 text-center">Quantity</th>
                  <th class="text-subtitle-1 font-weight-bold py-4 text-right pr-6">Total</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="item in cart.items" :key="item.id || item.product_id" class="cart-row">
                  <td class="py-6 pl-6">
                    <div class="d-flex align-center">
                      <v-avatar size="100" class="rounded-lg bg-grey-lighten-5 mr-6 border">
                        <v-img :src="getImageUrl(item.product.cover_image)" cover></v-img>
                      </v-avatar>
                      <div class="product-info">
                        <NuxtLink :to="`/products/${item.product.slug}`" class="text-decoration-none">
                          <h3 class="text-h6 font-weight-bold text-grey-darken-4 mb-1 hover-primary">{{ item.product.name }}</h3>
                        </NuxtLink>
                        <div v-if="item.options" class="text-caption text-grey-darken-1 mb-2">
                          <span v-if="item.options.name">{{ item.options.name }}</span>
                        </div>
                        <div class="text-subtitle-2 font-weight-bold text-teal-darken-1">
                          ${{ Number(item.product.discount_price || item.product.base_price || 0).toFixed(2) }}
                        </div>
                        <v-btn 
                          variant="text" 
                          color="error" 
                          density="compact" 
                          class="text-none mt-2 pa-0" 
                          prepend-icon="mdi-trash-can-outline"
                          @click="cart.removeFromCart(item.id || item.product_id)"
                        >
                          Remove
                        </v-btn>
                      </div>
                    </div>
                  </td>
                  <td class="text-center">
                    <div class="d-inline-flex align-center border rounded-pill px-2 py-1 bg-white shadow-xs">
                      <v-btn icon="mdi-minus" size="x-small" variant="text" :disabled="item.quantity <= 1 || cart.updatingItems.includes(item.id || item.product_id)" @click="updateQty(item, -1)"></v-btn>
                      <div class="quantity-display d-flex align-center justify-center mx-2" style="width: 30px;">
                        <v-progress-circular v-if="cart.updatingItems.includes(item.id || item.product_id)" indeterminate size="16" width="2" color="primary"></v-progress-circular>
                        <span v-else class="font-weight-bold text-body-1">{{ item.quantity }}</span>
                      </div>
                      <v-btn icon="mdi-plus" size="x-small" variant="text" :disabled="cart.updatingItems.includes(item.id || item.product_id)" @click="updateQty(item, 1)"></v-btn>
                    </div>
                  </td>
                  <td class="text-right pr-6">
                    <span class="text-h6 font-weight-bold text-grey-darken-4">
                      ${{ (Number(item.product.discount_price || item.product.base_price || 0) * item.quantity).toFixed(2) }}
                    </span>
                  </td>
                </tr>
              </tbody>
            </v-table>
          </v-card>

          <div class="mt-6 d-flex justify-space-between align-center px-4">
            <v-btn to="/" variant="text" color="primary" prepend-icon="mdi-arrow-left" class="text-none font-weight-bold">
              Continue Shopping
            </v-btn>
            <v-btn variant="text" color="grey-darken-1" @click="clearCart" class="text-none">
              Clear Shopping Cart
            </v-btn>
          </div>
        </v-col>

        <!-- Summary Sidebar -->
        <v-col cols="12" lg="4">
          <v-card class="rounded-xl border shadow-sm pa-6 sticky-sidebar" elevation="0">
            <h2 class="text-h5 font-weight-bold mb-6">Order Summary</h2>
            
            <div class="summary-details mb-6">
              <div class="d-flex justify-space-between mb-3 text-body-1">
                <span class="text-grey-darken-1">Subtotal</span>
                <span class="font-weight-bold">${{ cart.totalPrice.toFixed(2) }}</span>
              </div>
              <div class="d-flex justify-space-between mb-3 text-body-1">
                <span class="text-grey-darken-1">Estimated Shipping</span>
                <span class="text-green font-weight-bold">FREE</span>
              </div>
              <v-divider class="my-4"></v-divider>
              <div class="d-flex justify-space-between text-h5 font-weight-black text-grey-darken-4">
                <span>Total</span>
                <span class="text-primary">${{ cart.totalPrice.toFixed(2) }}</span>
              </div>
            </div>

            <v-btn 
              color="primary" 
              height="60" 
              block 
              class="rounded-lg text-h6 font-weight-bold text-none mb-4"
              elevation="0"
              @click="handleCheckout"
            >
              Proceed to Checkout
            </v-btn>
            
            <div class="d-flex align-center justify-center gap-2 text-caption text-grey">
              <v-icon icon="mdi-shield-check" size="small" color="success"></v-icon>
              Secure Shopping Guarantee
            </div>
          </v-card>
        </v-col>
      </v-row>

      <!-- Empty State -->
      <div v-else class="text-center py-16 bg-white rounded-xl border">
        <v-icon icon="mdi-cart-outline" size="120" color="grey-lighten-2" class="mb-6"></v-icon>
        <h2 class="text-h4 font-weight-bold mb-4">Your cart is empty</h2>
        <p class="text-body-1 text-grey mb-8">Looks like you haven't added anything to your cart yet.</p>
        <v-btn color="primary" size="large" class="px-12 rounded-lg font-weight-bold text-none" to="/">
          Start Shopping
        </v-btn>
      </div>
    </v-container>
  </div>
</template>

<script setup>
import { useCartStore } from '~/stores/cart'

const cart = useCartStore()

useHead({
  title: 'Your Shopping Cart - FGX Store'
})

const getImageUrl = (path) => {
  if (!path) return 'https://placehold.co/100'
  if (path.startsWith('http')) return path
  return `http://localhost:8000/storage/${path}`
}

const { gtag } = useGtag()

const updateQty = async (item, delta) => {
  const newQty = item.quantity + delta
  if (newQty < 1) return
  await cart.updateQuantity(item.id || item.product_id, newQty)
}

const clearCart = async () => {
  if (confirm('Are you sure you want to clear your cart?')) {
    await cart.clearCart()
  }
}

const handleCheckout = () => {
  // Track begin_checkout in GA4
  gtag('event', 'begin_checkout', {
    currency: 'USD',
    value: cart.totalPrice,
    items: cart.items.map(item => ({
      item_id: item.product_id,
      item_name: item.product.name,
      price: item.product.discount_price || item.product.base_price,
      quantity: item.quantity
    }))
  })
  
  // Navigate
  navigateTo('/checkout')
}

useHead({
  title: 'Shopping Cart - FGXMART'
})
</script>

<style scoped>
.cart-page {
  background-color: #f8fafc;
}

.cart-table :deep(th) {
  background-color: #f8fafc !important;
  border-bottom: 2px solid #edf2f7 !important;
}

.cart-row {
  transition: background-color 0.2s;
}

.cart-row:hover {
  background-color: #fafafa;
}

.hover-primary:hover {
  color: rgb(var(--v-theme-primary)) !important;
}

.shadow-xs {
  box-shadow: 0 1px 2px rgba(0,0,0,0.05);
}

.sticky-sidebar {
  position: sticky;
  top: 100px;
}

.cart-table :deep(td) {
  border-bottom: 1px solid #f1f5f9 !important;
}

.cart-table :deep(tr:last-child td) {
  border-bottom: none !important;
}
</style>
