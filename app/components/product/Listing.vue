<template>
  <div class="products-page py-12 bg-grey-lighten-4 min-h-screen">
    <div class="listing-container">
      <v-row>
        <!-- Sidebar Filter -->
        <v-col cols="12" md="3" class="category-sidebar-col">
          <v-card class="border pa-6 sticky-sidebar" elevation="0">
            <h2 class="text-h6 font-weight-bold mb-6 text-grey-darken-4">Categories</h2>

            <div v-if="categoriesPending" class="d-flex justify-center py-4">
              <v-progress-circular indeterminate color="primary" size="24"></v-progress-circular>
            </div>

            <ProductCategoryFilters v-else v-model="selectedCategoryIds" :categories="categories" />

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
        <v-col cols="12" md="9" class="product-results-col">
          <h1 class="text-h4 font-weight-bold mb-5">{{ pageTitle }}</h1>
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
              <AppSelect v-model="sortBy" :options="sortOptions" aria-label="Sort products" :allow-empty="false" :searchable="false" class="sort-select" @change="currentPage = 1" />
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
    </div>

    <QuickViewModal v-model="showQuickView" :product="selectedProduct" />
  </div>
</template>

<script setup>
const props = defineProps({ collection: { type: String, default: '' } })


import { ref, computed, watch, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import ProductCard from '~/components/product/ProductCard.vue'
import QuickViewModal from '~/components/product/QuickViewModal.vue'

const apiBase = useRuntimeConfig().public.apiBase
const route = useRoute()
const router = useRouter()

const showQuickView = ref(false)
const selectedProduct = ref({})
const selectedCategoryIds = ref([])
const searchQuery = ref(route.query.search || '')
const dealsOnly = computed(() => !props.collection && route.query.deals === '1')
const collectionName = computed(() => props.collection || String(route.query.collection || ''))
const collectionFilter = computed(() => ({ 'new-arrivals': 'is_new_arrival', 'best-sellers': 'is_best_seller' })[collectionName.value])
const pageTitle = computed(() => dealsOnly.value ? 'Hot Deals' : ({ 'new-arrivals': 'New Arrivals', 'best-sellers': 'Best Sellers' })[collectionName.value] || 'All Products')
const priceRange = ref([0, 1000])
const sortBy = ref('Newest')
const sortOptions = ['Newest', 'Price: Low to High', 'Price: High to Low', 'Name: A-Z']

const currentPage = ref(1)
const perPage = ref(12)

useHead({
  title: 'Our Products - FGX Store'
})

// Fetch Categories
const { data: categoriesData, pending: categoriesPending } = await useFetch(`${apiBase}/categories?all=1&roots=1`)
const categories = computed(() => categoriesData.value?.data || [])


// Fetch Products with Pagination
const productsUrl = computed(() => {
  const params = new URLSearchParams({
    page: currentPage.value,
    per_page: perPage.value,
  })

  selectedCategoryIds.value.forEach((id, index) => params.append(`category_ids[${index}]`, id))

  if (dealsOnly.value) params.append('is_hot_deal', '1')
  if (collectionFilter.value) params.append(collectionFilter.value, '1')

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


const clearSearch = () => {
  searchQuery.value = ''
  router.push({ query: { ...route.query, search: undefined } })
}

const resetFilters = () => {
  selectedCategoryIds.value = []
  priceRange.value = [0, 1000]
  sortBy.value = 'Newest'
  searchQuery.value = ''
  currentPage.value = 1
  router.push({ path: props.collection ? route.path : '/products', query: {} })
}

const openQuickView = (product) => {
  selectedProduct.value = product
  showQuickView.value = true
}


// Ensure filters are reactive and reset page
watch([selectedCategoryIds, priceRange, sortBy, searchQuery, dealsOnly, collectionFilter], () => {
    currentPage.value = 1
})

// Sync search query from URL
watch(() => route.query.search, (newVal) => {
  searchQuery.value = newVal || ''
})

useHead({
  title: () => `${pageTitle.value} - FGXMART`,
  meta: [
    { name: 'description', content: 'Explore our full range of fresh products and daily essentials at FGXMART.' }
  ]
})
</script>

<style scoped>
.products-page {
  background-color: #f8fafc;
}
.listing-container { width: 100%; max-width: var(--storefront-container-width); margin-inline: auto; padding: 16px 40px; box-sizing: border-box; }
@media(max-width:1100px) { .listing-container { padding-inline: 24px; } }
@media(max-width:760px) { .listing-container { padding-inline: 16px; } }

.sticky-sidebar {
  border-radius: 12px;
  position: sticky;
  top: 100px;
}
@media(min-width:960px) {
  .category-sidebar-col { flex: 0 0 calc(25% - 20px); max-width: calc(25% - 20px); }
  .product-results-col { flex: 0 0 calc(75% + 20px); max-width: calc(75% + 20px); }
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
