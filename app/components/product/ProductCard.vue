<template>
  <v-card class="product-card h-100 d-flex flex-column position-relative pa-3" border flat rounded="lg">
    
    <!-- Top Actions -->
    <div class="d-flex justify-space-between w-100 mb-2 z-10 position-absolute px-3 mt-3">
      <v-chip v-if="product.discount_price" color="secondary" size="x-small" label class="font-weight-bold">
        {{ calculateDiscount(product.base_price, product.discount_price) }}% OFF
      </v-chip>
      <v-spacer v-else></v-spacer>
      
      <v-btn 
        icon 
        variant="text" 
        density="compact" 
        size="small" 
        color="grey-lighten-1" 
        @click.prevent="toggleWishlist"
      >
        <v-icon 
            :icon="wishlist.isInWishlist(product.id) ? 'mdi-heart' : 'mdi-heart-outline'" 
            :color="wishlist.isInWishlist(product.id) ? 'error' : ''"
        ></v-icon>
      </v-btn>
    </div>

    <!-- Image Area with Hover Overlay -->
    <div class="product-image-container mt-2 mb-3 position-relative rounded overflow-hidden bg-grey-lighten-5 d-flex align-center justify-center" style="height: 200px;">
      <NuxtLink :to="`/products/${product.slug}`" class="w-100 h-100 d-flex align-center justify-center">
        <v-img
          :src="getImageUrl(product.cover_image)"
          :alt="product.name"
          height="140"
          max-width="140"
          contain
          class="product-img"
        ></v-img>
      </NuxtLink>

      <!-- Hover Actions -->
      <div class="hover-overlay d-flex justify-center align-center">
        <v-btn icon color="white" size="small" variant="flat" elevation="2" class="action-btn" :aria-label="`Quick view ${product.name}`" @click.prevent="openQuickView">
          <v-icon icon="mdi-eye-outline" size="small" color="grey-darken-3"></v-icon>
        </v-btn>
      </div>
    </div>

    <!-- Product Details -->
    <div class="flex-grow-1 d-flex flex-column">
      <NuxtLink 
        v-if="product.category" 
        :to="`/category/${product.category.slug}`" 
        class="text-caption text-grey mb-1 text-decoration-none hover-primary d-block"
      >
        {{ product.category.name }}
      </NuxtLink>
      <div v-else class="text-caption text-grey mb-1">Groceries</div>
      
      <NuxtLink :to="`/products/${product.slug}`" class="text-decoration-none">
        <h3 class="text-subtitle-1 font-weight-bold text-truncate mb-1 product-title" :title="product.name">
          {{ product.name }}
        </h3>
      </NuxtLink>

      <div v-if="product.reviews_count > 0" class="d-flex align-center mb-2">
        <v-rating
          :model-value="Number(product.rating_average || 0)"
          color="warning"
          density="compact"
          size="x-small"
          half-increments
          readonly
        ></v-rating>
        <span class="text-caption text-grey ml-1">({{ Number(product.rating_average || 0).toFixed(1) }})</span>
      </div>

      <div class="d-flex align-center justify-space-between mt-auto">
        <div class="price-block">
          <div class="d-flex align-baseline">
            <span class="text-h6 font-weight-bold text-primary mr-2">${{ product.discount_price || product.base_price }}</span>
             <span v-if="product.discount_price" class="text-caption text-decoration-line-through text-grey font-weight-medium">${{ product.base_price }}</span>
          </div>
          <!-- Show weight/unit if available, else placeholder -->
           <div class="text-caption text-success font-weight-medium mt-n1">
             {{ product.weight || '500g' }}
           </div>
        </div>

        <v-btn
          color="primary"
          icon="mdi-cart-outline"
          variant="flat"
          size="small"
          rounded="lg"
          class="add-btn"
          elevation="0"
          :loading="cartLoading"
          @click.prevent="handleAddToCart"
        ></v-btn>
      </div>
    </div>
  </v-card>
</template>

<script setup>
const mediaBase = useRuntimeConfig().public.apiBase.replace(/\/api\/v1\/?$/, "")

const props = defineProps({
  product: {
    type: Object,
    required: true
  }
})

const cartLoading = ref(false)
const cart = useCartStore()
const wishlist = useWishlistStore()

const handleAddToCart = async () => {
  cartLoading.value = true
  await cart.addToCart(props.product, 1)
  cartLoading.value = false
}

const toggleWishlist = async () => {
  await wishlist.toggleWishlist(props.product)
}

const getImageUrl = (path) => {
  if (!path) return 'https://placehold.co/200'
  if (path.startsWith('http')) return path
  return `${mediaBase}/storage/${path}`
}

const calculateDiscount = (base, discount) => {
  if (!base || !discount) return 0;
  return Math.round(((base - discount) / base) * 100);
}

const emit = defineEmits(['quick-view'])

const openQuickView = () => {
  emit('quick-view', props.product)
}
</script>

<style scoped>
.product-card {
  transition: all 0.3s ease;
  border-color: #eee !important;
  cursor: pointer;
}

.px-3{
  padding-right: 30px !important;
}

.product-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 5px 20px rgba(0,0,0,0.08) !important;
}

.product-title {
  font-family: var(--app-font-family);
  color: #222;
  transition: color 0.2s;
}

.product-card:hover .product-title {
  color: rgb(var(--v-theme-primary));
}

.hover-primary:hover {
  color: rgb(var(--v-theme-primary)) !important;
}

.hover-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0,0,0,0.05); /* Slight tint */
  opacity: 0;
  transition: all 0.3s ease;
  gap: 10px;
}

.product-image-container:hover .hover-overlay, .hover-overlay:focus-within {
  opacity: 1;
}

.action-btn {
  transform: translateY(20px);
  transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}

.product-image-container:hover .action-btn, .hover-overlay:focus-within .action-btn {
  transform: translateY(0);
}

.product-image-container:hover .action-btn:nth-child(2) {
  transition-delay: 0.05s;
}

.add-btn:hover {
  background-color: rgb(var(--v-theme-secondary)) !important;
}

.z-10 {
  z-index: 10;
}
</style>
