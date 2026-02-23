<template>
  <v-container class="custom-container py-12">
    <div class="d-flex justify-space-between align-center mb-6">
      <h3 class="text-h4 font-weight-bold section-title">FGX Featured Products</h3>
      <v-btn variant="text" color="primary" class="d-none d-sm-flex text-none" to="/products">
         See All <v-icon icon="mdi-arrow-right" size="small" class="ml-1"></v-icon>
      </v-btn>
    </div>

    <!-- Products Grid -->
    <v-row v-if="!pending && products.length > 0">
      <v-col
        v-for="product in products"
        :key="product.id"
        cols="6"
        sm="4"
        md="3"
        lg="2"
      >
        <ProductCard :product="product" @add-to-cart="handleAddToCart" @quick-view="openQuickView" />
      </v-col>
    </v-row>

    <div v-else-if="pending" class="d-flex justify-center py-12">
      <v-progress-circular indeterminate color="primary"></v-progress-circular>
    </div>

    <div v-else class="text-center py-12 text-grey">
      No featured products found.
    </div>

    <div class="d-flex justify-center mt-8 d-sm-none">
       <v-btn to="/products" color="primary" variant="outlined" rounded="pill" class="px-8 text-none">View All Products</v-btn>
    </div>

    <QuickViewModal v-model="showQuickView" :product="selectedProduct" />
  </v-container>
</template>

<script setup>
import ProductCard from '~/components/product/ProductCard.vue'
import QuickViewModal from '~/components/product/QuickViewModal.vue'

// Quick View State
const showQuickView = ref(false)
const selectedProduct = ref({})

// Fetch featured products (limit 12)
const { data: productsData, pending } = await useFetch('http://localhost:8000/api/v1/products?per_page=12')

const products = computed(() => {
  return productsData.value?.data || []
})

const handleAddToCart = (item) => {
  console.log('Added to cart:', item)
  // Implement cart logic here
}

const openQuickView = (product) => {
  selectedProduct.value = product
  showQuickView.value = true
}
</script>

<style scoped>
.section-title {
  font-family: "Trebuchet MS", sans-serif;
  color: #2b2b2b;
  position: relative;
  padding-bottom: 10px;
}

.section-title::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 0;
  width: 60px;
  height: 3px;
  background-color: rgb(var(--v-theme-primary));
  border-radius: 2px;
}
</style>
