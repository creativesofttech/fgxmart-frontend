<template>
  <div class="products-page py-12 bg-grey-lighten-4 min-h-screen">
    <v-container class="custom-container">
      <v-row>
        <!-- Sidebar Filter -->
        <v-col cols="12" md="3">
          <v-card class="rounded-xl border pa-6 sticky-sidebar" elevation="0">
            <h2 class="text-h6 font-weight-bold mb-6 text-grey-darken-4">Categories</h2>
            
            <div v-if="categoriesPending" class="d-flex justify-center py-4">
              <v-progress-circular indeterminate color="primary" size="24"></v-progress-circular>
            </div>
            
            <v-list v-else density="compact" class="py-0 category-filter-list bg-transparent">
              <v-list-item
                color="primary"
                class="rounded-lg mb-1 px-4"
                title="All Products"
                :active="!selectedCategorySlug"
                @click="filterByCategory(null)"
              >
                <template v-slot:prepend>
                  <v-icon icon="mdi-grid" size="20" class="mr-3"></v-icon>
                </template>
              </v-list-item>

              <v-list-item
                v-for="category in categories"
                :key="category.id"
                color="primary"
                class="rounded-lg mb-1 px-4"
                :title="category.name"
                :active="selectedCategorySlug === category.slug"
                @click="filterByCategory(category.slug)"
              >
                <template v-slot:prepend>
                  <v-avatar size="24" class="mr-3 rounded-0 bg-transparent">
                    <v-img :src="getCategoryImageUrl(category.image)" contain></v-img>
                  </v-avatar>
                </template>
              </v-list-item>
            </v-list>

            <v-divider class="my-8"></v-divider>

            <h2 class="text-h6 font-weight-bold mb-6 text-grey-darken-4">Price Range</h2>
            <v-range-slider
              v-model="priceRange"
              :max="1000"
              :min="0"
              :step="10"
              hide-details
              class="align-center"
              color="primary"
              @end="currentPage = 1"
            ></v-range-slider>
            <div class="d-flex justify-space-between mt-2 text-caption font-weight-bold text-grey-darken-1">
              <span>${{ priceRange[0] }}</span>
              <span>${{ priceRange[1] }}</span>
            </div>
          </v-card>
        </v-col>

        <!-- Product Grid -->
        <v-col cols="12" md="9">
          <h1 v-if="dealsOnly" class="text-h4 font-weight-bold mb-5">Hot Deals</h1>
          <!-- Top Bar -->
          <v-card class="rounded-xl border pa-4 mb-6 d-flex align-center justify-space-between px-6" elevation="0">
            <div class="text-body-1 font-weight-medium">
              <span v-if="searchQuery">
                Search results for: <span class="text-primary font-weight-bold">"{{ searchQuery }}"</span>
                <v-btn icon="mdi-close-circle" size="x-small" variant="text" color="grey" @click="clearSearch" class="ml-1"></v-btn>
              </span>
              <span v-else>
                Showing <span class="text-primary font-weight-black">{{ totalProducts }}</span> Products
              </span>
            </div>
            <div class="d-flex align-center gap-4">
              <span class="text-caption text-grey font-weight-bold text-uppercase">Sort By:</span>
              <v-select
                v-model="sortBy"
                :items="sortOptions"
                density="compact"
                variant="outlined"
                hide-details
                class="sort-select"
                rounded="lg"
                @update:model-value="currentPage = 1"
              ></v-select>
            </div>
          </v-card>

          <!-- Grid -->
          <div v-if="productsPending" class="d-flex justify-center py-16">
            <v-progress-circular indeterminate color="primary" size="64"></v-progress-circular>
          </div>

          <div v-else-if="products.length > 0">
            <v-row>
              <v-col 
                v-for="product in products" 
                :key="product.id" 
                cols="12" 
                sm="6" 
                lg="3"
              >
                <ProductCard :product="product" @quick-view="openQuickView" />
              </v-col>
            </v-row>

            <!-- Pagination -->
            <div class="mt-12 d-flex justify-center">
              <v-pagination
                v-model="currentPage"
                :length="totalPages"
                :total-visible="7"
                color="primary"
                rounded="lg"
                elevation="0"
                class="border rounded-lg bg-white"
              ></v-pagination>
            </div>
          </div>

          <v-card v-else class="text-center py-16 rounded-xl border bg-white" elevation="0">
            <v-icon icon="mdi-package-variant" size="100" color="grey-lighten-2" class="mb-4"></v-icon>
            <h2 class="text-h5 font-weight-bold mb-2">No products found</h2>
            <p class="text-body-1 text-grey">Try adjusting your filters or category choice.</p>
            <v-btn color="primary" variant="text" class="mt-4 text-none font-weight-bold" @click="resetFilters">
              Clear All Filters
            </v-btn>
          </v-card>
        </v-col>
      </v-row>
    </v-container>

    <QuickViewModal v-model="showQuickView" :product="selectedProduct" />
  </div>
</template>

<script setup>
const mediaBase = useRuntimeConfig().public.apiBase.replace(/\/api\/v1\/?$/, "")

import { ref, computed, watch, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import ProductCard from '~/components/product/ProductCard.vue'
import QuickViewModal from '~/components/product/QuickViewModal.vue'

const apiBase = useRuntimeConfig().public.apiBase
const route = useRoute()
const router = useRouter()

const showQuickView = ref(false)
const selectedProduct = ref({})
const selectedCategorySlug = ref(null)
const searchQuery = ref(route.query.search || '')
const dealsOnly = computed(() => route.query.deals === '1')
const priceRange = ref([0, 1000])
const sortBy = ref('Newest')
const sortOptions = ['Newest', 'Price: Low to High', 'Price: High to Low', 'Name: A-Z']

const currentPage = ref(1)
const perPage = ref(12)

useHead({
  title: 'Our Products - FGX Store'
})

// Fetch Categories
const { data: categoriesData, pending: categoriesPending } = await useFetch(`${apiBase}/categories?all=1`)
const categories = computed(() => categoriesData.value?.data || [])

const getCategoryBySlug = (slug) => categories.value.find(c => c.slug === slug)

// Fetch Products with Pagination
const productsUrl = computed(() => {
  const params = new URLSearchParams({
    page: currentPage.value,
    per_page: perPage.value,
  })

  if (selectedCategorySlug.value) {
    const cat = getCategoryBySlug(selectedCategorySlug.value)
    if (cat) params.append('category_id', cat.id)
  }

  if (dealsOnly.value) params.append('on_sale', '1')

  // Price range - currently backend might not support this directly, but we can pass them
  params.append('min_price', priceRange.value[0])
  params.append('max_price', priceRange.value[1])

  // Sorting
  if (sortBy.value === 'Price: Low to High') {
    params.append('sort', 'price_asc')
  } else if (sortBy.value === 'Price: High to Low') {
    params.append('sort', 'price_desc')
  } else if (sortBy.value === 'Name: A-Z') {
    params.append('sort', 'name_asc')
  }

  if (searchQuery.value) {
    params.append('search', searchQuery.value)
  }

  return `${apiBase}/products?${params.toString()}`
})

const { data: productsData, pending: productsPending, refresh } = await useFetch(productsUrl, {
  watch: [productsUrl]
})

const products = computed(() => productsData.value?.data || [])
const totalProducts = computed(() => productsData.value?.total || 0)
const totalPages = computed(() => productsData.value?.last_page || 1)

const filterByCategory = (slug) => {
  selectedCategorySlug.value = slug
  currentPage.value = 1
}

const clearSearch = () => {
  searchQuery.value = ''
  router.push({ query: { ...route.query, search: undefined } })
}

const resetFilters = () => {
  selectedCategorySlug.value = null
  priceRange.value = [0, 1000]
  sortBy.value = 'Newest'
  searchQuery.value = ''
  currentPage.value = 1
  router.push({ path: '/products', query: {} })
}

const openQuickView = (product) => {
  selectedProduct.value = product
  showQuickView.value = true
}

const getCategoryImageUrl = (imagePath) => {
  if (!imagePath) return 'https://placehold.co/24'
  if (imagePath.startsWith('http')) return imagePath
  return `${mediaBase}/storage/${imagePath}`
}

// Ensure filters are reactive and reset page
watch([selectedCategorySlug, priceRange, sortBy, searchQuery, dealsOnly], () => {
    currentPage.value = 1
})

// Sync search query from URL
watch(() => route.query.search, (newVal) => {
  searchQuery.value = newVal || ''
})

useHead({
  title: () => dealsOnly.value ? 'Hot Deals - FGXMART' : 'All Products - FGXMART',
  meta: [
    { name: 'description', content: 'Explore our full range of fresh products and daily essentials at FGXMART.' }
  ]
})
</script>

<style scoped>
.products-page {
  background-color: #f8fafc;
}

.sticky-sidebar {
  position: sticky;
  top: 100px;
}

.category-filter-list :deep(.v-list-item--active) {
  background-color: rgba(var(--v-theme-primary), 0.1) !important;
  color: rgb(var(--v-theme-primary)) !important;
}

.sort-select {
  width: 200px;
}

.gap-4 {
  gap: 16px;
}

.transition-colors {
  transition: color 0.2s ease;
}

:deep(.v-pagination__list) {
    justify-content: center;
}
</style>
