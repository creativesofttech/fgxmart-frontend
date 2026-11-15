<template>
  <div class="category-page pb-16">
    <!-- Category Hero / Breadcrumb -->
    <div 
      class="category-hero bg-grey-lighten-4 d-flex align-center justify-center text-center position-relative mb-12"
      style="height: 250px;"
    >
      <v-container>
        <div class="position-relative z-10">
          <h1 class="text-h3 font-weight-black text-grey-darken-4 mb-4 text-capitalize">
            {{ category?.name || 'Category' }}
          </h1>
          <v-breadcrumbs :items="breadcrumbs" class="justify-center">
            <template v-slot:divider>
              <v-icon icon="mdi-chevron-right" size="small"></v-icon>
            </template>
          </v-breadcrumbs>
        </div>
      </v-container>
      
      <!-- Abstract Decal Background -->
      <div class="position-absolute fill-height w-100 top-0 left-0 overflow-hidden opacity-10">
        <v-icon icon="mdi-food-apple" size="300" class="position-absolute" style="top: -50px; left: -50px; transform: rotate(-15deg);"></v-icon>
        <v-icon icon="mdi-leaf" size="200" class="position-absolute" style="bottom: -30px; right: 50px; transform: rotate(20deg);"></v-icon>
      </div>
    </div>

    <!-- Products Grid -->
    <v-container class="custom-container">
      <div v-if="pending" class="d-flex justify-center align-center py-16">
        <v-progress-circular indeterminate color="primary" size="64"></v-progress-circular>
      </div>

      <div v-else-if="products.length > 0">
        <div class="d-flex justify-space-between align-center mb-8">
          <div class="text-subtitle-1 text-grey-darken-1">
            We found <span class="font-weight-bold text-grey-darken-4">{{ products.length }}</span> products for you!
          </div>
          <!-- Optional Sorting / Filtering could go here -->
        </div>

        <v-row>
          <v-col
            v-for="product in products"
            :key="product.id"
            cols="6"
            sm="4"
            md="3"
            lg="2.4"
            class="pa-3"
          >
            <ProductCard 
              :product="product" 
              @quick-view="openQuickView"
            />
          </v-col>
        </v-row>
      </div>

      <v-container v-else class="text-center py-16">
        <v-icon icon="mdi-cart-off" size="64" color="grey-lighten-1" class="mb-4"></v-icon>
        <h2 class="text-h5 text-grey-darken-1 mb-4">No products found in this category</h2>
        <v-btn to="/" color="primary" variant="flat" class="text-none px-8">Back to Shopping</v-btn>
      </v-container>
    </v-container>

    <!-- Quick View Modal -->
    <QuickViewModal v-model="showQuickView" :product="selectedProduct" />
  </div>
</template>

<script setup>
import ProductCard from '~/components/product/ProductCard.vue'
import QuickViewModal from '~/components/product/QuickViewModal.vue'

const route = useRoute()
const config = useRuntimeConfig()
const apiBase = config.public.apiBase || 'http://localhost:8000/api/v1'

// Component State
const showQuickView = ref(false)
const selectedProduct = ref({})

// Fetch Category & Products
const { data: categoryResponse } = await useFetch(`${apiBase}/categories/${route.params.slug}`)
const category = computed(() => categoryResponse.value?.data)

// Fetch Products for this Category
const { data: productsData, pending } = await useFetch(`${apiBase}/products`, {
  query: { category_id: category.value?.id }
})
const products = computed(() => productsData.value?.data || [])

const breadcrumbs = computed(() => [
  { title: 'Home', disabled: false, to: '/' },
  { title: 'Categories', disabled: true, to: '#' },
  { title: category.value?.name || 'Loading...', disabled: true, to: '#' }
])

const openQuickView = (product) => {
  selectedProduct.value = product
  showQuickView.value = true
}

useHead({
  title: `${category.value?.name || 'Category'} - FGXMART`,
  meta: [
    { name: 'description', content: `Browse our collection of ${category.value?.name || 'products'} at FGXMART.` }
  ]
})
</script>

<style scoped>
.category-hero {
  background: white;
  border-bottom: 1px solid #eee;
  z-index: 1;
}

.z-10 {
  z-index: 10;
}

.opacity-10 {
  opacity: 0.05;
}

/* Ensure 5 columns on large screens (lg="2.4" works with 12-column grid) */
@media (min-width: 1280px) {
  .v-col-lg-2\.4 {
    flex: 0 0 20%;
    max-width: 20%;
  }
}
</style>
