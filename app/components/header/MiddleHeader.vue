<template>
  <v-sheet class="py-6 border-b" color="white">
    <v-container class="custom-container d-flex align-center justify-space-between py-0 px-4">
      <!-- Logo & Location -->
      <div class="d-flex align-center mr-8">
        <NuxtLink to="/" class="text-decoration-none d-flex align-center">
          <img src="~/assets/images/brand/fgx-logo.svg" alt="FGXMART" height="45" class="logo-image" />
        </NuxtLink>

        <!-- Location Dropdown -->
        <div 
          class="location-selector d-none d-lg-flex align-center ml-8 px-2 py-1 bg-grey-lighten-5 border rounded cursor-pointer"
          @click="showLocationModal = true"
        >
          <div class="location-icon-box d-flex align-center justify-center rounded bg-white border">
            <v-icon icon="mdi-map-marker-outline" color="grey-darken-1" size="20" />
          </div>
          <span class="text-subtitle-2 text-secondary font-weight-bold text-truncate ml-2" style="max-width: 100px;">
            {{ selectedLocation?.name || 'Your Location' }}
          </span>
          <v-icon icon="mdi-chevron-down" size="28" color="grey-darken-1" />
        </div>
      </div>

      <!-- Search Bar -->
      <div class="search-wrapper d-none d-md-flex align-center flex-grow-1 mx-4" style="max-width: 600px; position: relative;">
        <v-menu
          v-model="searchMenu"
          :close-on-content-click="true"
          offset="5"
          max-height="400"
          width="400"
          min-width="activator"
          location="bottom start"
          transition="slide-y-transition"
          no-click-animation
          persistent
        >
          <template v-slot:activator="{ props }">
            <v-text-field
              v-model="searchQuery"
              v-bind="props"
              density="compact"
              variant="outlined"
              hide-details
              placeholder="I'm searching for..."
              class="search-input"
              bg-color="transparent"
              single-line
              color="primary"
              @keyup.enter="handleSearch"
              @focus="searchQuery.length > 1 && searchSuggestions.length > 0 && (searchMenu = true)"
            >
              <template v-slot:append-inner>
                <v-progress-circular
                  v-if="isSearching"
                  indeterminate
                  size="20"
                  width="2"
                  color="primary"
                  class="mr-2"
                ></v-progress-circular>
                <v-btn
                  color="accent" 
                  height="100%"
                  width="60"
                  elevation="0"
                  class="search-btn rounded-s-0 rounded-e-lg"
                  @click="handleSearch"
                >
                  <v-icon icon="mdi-magnify" color="white" size="28" />
                </v-btn>
              </template>
            </v-text-field>
          </template>

          <v-list class="search-suggestions-list py-2" elevation="10" border rounded="lg">
            <v-list-item
              v-for="product in searchSuggestions"
              :key="product.id"
              class="px-4 py-2"
              @click="selectSuggestion(product)"
            >
              <template v-slot:prepend>
                <v-avatar rounded="lg" size="48" class="mr-4 border">
                  <v-img :src="getSuggestionImageUrl(product.cover_image)" cover></v-img>
                </v-avatar>
              </template>
              
              <v-list-item-title class="text-subtitle-1 font-weight-bold text-grey-darken-4">
                {{ product.name }}
              </v-list-item-title>
              
              <v-list-item-subtitle class="text-caption text-primary font-weight-bold">
                ${{ product.discount_price || product.base_price }}
                <span v-if="product.discount_price" class="text-grey text-decoration-line-through ml-2">
                  ${{ product.base_price }}
                </span>
              </v-list-item-subtitle>
            </v-list-item>
            
            <v-divider v-if="searchSuggestions.length > 0" class="my-1"></v-divider>
            
            <v-list-item class="text-center" @click="handleSearch">
              <v-list-item-title class="text-primary font-weight-bold">
                View All Results
              </v-list-item-title>
            </v-list-item>
          </v-list>
        </v-menu>
      </div>

      <!-- Right Actions -->
      <div class="d-flex align-center ml-auto">
        <!-- Contact -->
        <div class="d-none d-xl-flex align-center mr-6 pr-6 border-e">
           <v-icon icon="mdi-phone-outline" size="28" color="grey-darken-1" class="mr-3" />
           <div class="d-flex flex-column text-left">
             <span class="text-caption text-grey">24/7 Delivery</span>
             <span class="text-subtitle-2 font-weight-bold text-grey-darken-3">+91 888 104 2340</span>
           </div>
        </div>

        <!-- Icons -->
        <v-btn icon variant="text" color="grey-darken-3" class="mx-1" to="/wishlist">
          <v-badge :content="wishlist.totalItems" color="error" offset-x="3" offset-y="3" v-if="wishlist.totalItems > 0">
            <v-icon icon="mdi-heart-outline" size="26" />
          </v-badge>
          <v-icon v-else icon="mdi-heart-outline" size="26" />
        </v-btn>

        <v-btn icon variant="text" color="grey-darken-3" class="mx-1 mr-4" to="/cart">
          <v-badge 
            :content="cart.totalItems" 
            color="secondary" 
            offset-x="3" 
            offset-y="3" 
            v-if="cart.totalItems > 0"
          >
            <v-icon icon="mdi-cart-outline" size="26" />
          </v-badge>
          <v-icon v-else icon="mdi-cart-outline" size="26" />
        </v-btn>
        
        <!-- Auth Section -->
        <v-divider vertical class="mx-2 d-none d-sm-flex" style="height: 30px;"></v-divider>

        <v-menu location="bottom end" offset="10">
          <template v-slot:activator="{ props }">
            <div v-if="auth.isLoggedIn" class="d-flex align-center pl-4 cursor-pointer" v-bind="props">
               <v-avatar color="grey-lighten-4" size="40" class="mr-3">
                 <v-icon icon="mdi-account-outline" color="grey-darken-3" />
               </v-avatar>
               <div class="d-flex flex-column">
                 <span class="text-caption text-grey lh-1">Hello,</span>
                 <span class="text-subtitle-2 font-weight-bold text-grey-darken-3 lh-1">{{ auth.user?.name?.split(' ')[0] || 'My Account' }}</span>
               </div>
            </div>
          </template>
          <v-list density="compact" width="150">
            <v-list-item prepend-icon="mdi-account-circle-outline" title="Profile" to="/my-account?tab=profile" />
            <v-list-item prepend-icon="mdi-history" title="Orders" to="/my-account?tab=order" />
            <v-divider class="my-1"></v-divider>
            <v-list-item prepend-icon="mdi-logout" title="Logout" @click="auth.logout()" color="error" />
          </v-list>
        </v-menu>

        <div v-if="!auth.isLoggedIn" class="pl-4">
          <v-btn
            color="secondary"
            class="text-none font-weight-bold px-8"
            rounded="lg"
            elevation="1"
            to="/login"
            height="44"
          >
            LOGIN
          </v-btn>
        </div>
      </div>
      <LocationModal v-model="showLocationModal" @select="updateLocation" />
    </v-container>
  </v-sheet>
</template>

<script setup>
import { ref } from 'vue'
import { useAuthStore } from '~/stores/auth'
import { useCartStore } from '~/stores/cart'
import { useWishlistStore } from '~/stores/wishlist'
import LocationModal from '~/components/header/LocationModal.vue'

const auth = useAuthStore()
const cart = useCartStore()
const wishlist = useWishlistStore()
const { gtag } = useGtag()
const showLocationModal = ref(false)
const selectedLocation = ref({ name: 'Your Location' })

const searchQuery = ref('')
const searchSuggestions = ref([])
const isSearching = ref(false)
const searchMenu = ref(false)
let searchTimeout = null

const config = useRuntimeConfig()

const fetchSuggestions = async (query) => {
  if (query.length < 2) {
    searchSuggestions.value = []
    searchMenu.value = false
    return
  }

  isSearching.value = true
  try {
    const data = await $fetch(`${config.public.apiBase}/products`, {
      params: {
        search: query,
        per_page: 5
      }
    })
    searchSuggestions.value = data.data || []
    searchMenu.value = searchSuggestions.value.length > 0
  } catch (err) {
    console.error('Fetch suggestions error:', err)
  } finally {
    isSearching.value = false
  }
}

watch(searchQuery, (newQuery) => {
  if (searchTimeout) clearTimeout(searchTimeout)
  
  if (!newQuery) {
    searchSuggestions.value = []
    searchMenu.value = false
    return
  }

  searchTimeout = setTimeout(() => {
    fetchSuggestions(newQuery)
  }, 300)
})

const getSuggestionImageUrl = (path) => {
  if (!path) return 'https://placehold.co/40'
  if (path.startsWith('http')) return path
  return `${config.public.apiBase.replace('/api/v1', '')}/storage/${path}`
}

const selectSuggestion = (product) => {
  searchMenu.value = false
  navigateTo(`/products/${product.slug}`)
}

const handleSearch = () => {
  if (!searchQuery.value.trim()) return
  
  // Track search in GA4
  gtag('event', 'search', {
    search_term: searchQuery.value
  })

  // Navigate to products with search query
  navigateTo({
    path: '/products',
    query: { search: searchQuery.value }
  })
}

const updateLocation = (loc) => {
  selectedLocation.value = loc
  showLocationModal.value = false
}
</script>

<style scoped>
.location-selector {
  transition: all 0.2s;
  height: 50px;
}
.location-selector:hover {
  border-color: rgb(var(--v-theme-primary)) !important;
}
.location-icon-box {
  width: 34px;
  height: 34px;
}

.search-wrapper {
  background-color: #f3f3f3;
  border-radius: 8px;
  border: 1px solid #e0e0e0;
}

.search-input :deep(.v-field) {
  border: none !important;
  box-shadow: none !important;
}

.search-input :deep(.v-field__outline) {
  display: none !important;
}

.search-btn {
  position: absolute;
  right: -1px;
  top: -1px;
  height: calc(100% + 2px) !important;
  border-radius: 0 8px 8px 0 !important;
}

.lh-1 {
  line-height: 1.2;
}

.border-e {
  border-right: 1px solid #eee !important;
}
.border-s {
  border-left: 1px solid #eee !important;
}

:deep(.v-list-item) {
  padding-inline-start: 12px !important;
}

:deep(.v-list-item__prepend) {
  min-width: unset !important;
  margin-inline-end: 6px !important;
}

:deep(.v-list-item__content) {
  padding-inline-start: 0px !important;
}

:deep(.v-list-item__spacer) {
  display: none !important;
}

:deep(.v-list-item-title) {
  font-size: 0.95rem !important;
  font-weight: 500 !important;
}

.search-suggestions-list :deep(.v-list-item) {
  cursor: pointer;
  transition: background-color 0.2s;
}

.search-suggestions-list :deep(.v-list-item:hover) {
  background-color: #f5f5f5;
}
</style>
