<template>
  <div class="product-detail-page pb-16 custom-container">
    <v-container class="product-breadcrumb-container">
      <nav aria-label="Product breadcrumb" class="product-breadcrumb">
        <ol>
          <li><NuxtLink to="/"><House :size="15" aria-hidden="true" /><span>Home</span></NuxtLink></li>
          <li v-for="category in breadcrumbCategories" :key="category.id"><ChevronRight :size="14" aria-hidden="true" /><NuxtLink :to="`/category/${category.slug}`">{{ category.name }}</NuxtLink></li>
          <li v-if="product.name" class="breadcrumb-current"><ChevronRight :size="14" aria-hidden="true" /><span aria-current="page">{{ product.name }}</span></li>
        </ol>
      </nav>
    </v-container>

    <v-container v-if="pending" class="d-flex justify-center align-center py-16">
        <v-progress-circular indeterminate color="primary" size="64"></v-progress-circular>
    </v-container>

    <v-container v-else-if="error" class="text-center py-16">
        <h2 class="text-h5 text-error">Product not found</h2>
        <v-btn to="/" color="primary" class="mt-4">Go Home</v-btn>
    </v-container>

    <v-container v-else>
      <v-row>
        <!-- Gallery Section -->
        <v-col cols="12" md="6" lg="5">
           <div class="d-flex gap-4 gallery-container">
             <!-- Vertical Thumbnails -->
             <div class="thumbnails-column d-none d-sm-flex flex-column gap-2">
                <div 
                  v-for="(img, idx) in allImages" 
                  :key="idx"
                  class="thumbnail-item cursor-pointer rounded-lg overflow-hidden border"
                  :class="{ 'border-primary': activeImageIndex === idx }"
                  @click="activeImageIndex = idx"
                >
                   <v-img :src="img.thumb" cover aspect-ratio="1" width="80" height="80"></v-img>
                </div>
             </div>

             <!-- Main Image -->
             <div class="main-image-container flex-grow-1 bg-white rounded-xl pa-4 d-flex align-center justify-center border position-relative overflow-hidden">
                 <v-img 
                   :src="allImages[activeImageIndex]?.full" 
                   :alt="product.name"
                   max-height="500"
                   contain
                   class="main-product-image transition-swing"
                 ></v-img>
                 
                 <!-- Badges could go here -->
                 <div v-if="product.is_featured" class="position-absolute top-0 left-0 ma-4">
                     <v-chip color="secondary" size="small" label class="font-weight-bold text-uppercase">Featured</v-chip>
                 </div>
             </div>
           </div>
        </v-col>

        <!-- Product Details Section -->
        <v-col cols="12" md="6" lg="7" class="pl-md-8">
            <!-- Category Badge (Requested: Show category instead of 30% off) -->
            <div class="mb-2">
                <v-chip 
                  v-if="product.category" 
                  color="blue-lighten-2" 
                  class="text-blue font-weight-bold px-3" 
                  label 
                  size="small"
                >
                    {{ product.category.name }}
                </v-chip>
            </div>

            <h1 class="text-h4 font-weight-bold mb-2 text-grey-darken-4">{{ product.name }}</h1>

            <!-- Price -->
            <div class="d-flex align-baseline mb-4">
                <span class="text-h4 font-weight-bold text-teal-darken-1 mr-3">${{ currentPrice }}</span>
                <span v-if="product.discount_price && !selectedVariationId" class="text-h6 text-grey text-decoration-line-through mr-3">${{ product.base_price }}</span>
                <span v-if="product.discount_price && !selectedVariationId" class="text-body-1 text-green font-weight-medium">
                    ({{ Math.round(((product.base_price - product.discount_price) / product.base_price) * 100) }}% off)
                </span>
            </div>
             
            <!-- Reviews -->
            <a href="#customer-reviews" class="product-review-link">{{ reviewSummary.count ? `${Number(reviewSummary.average).toFixed(1)} / 5 · ${reviewSummary.count} customer ${reviewSummary.count === 1 ? 'review' : 'reviews'}` : 'No reviews yet · Share your experience' }}</a>

            <!-- Description -->
            <ProductRichDescription :html="product.description || product.summary" class="text-body-1 text-grey-darken-1 mb-6" style="max-width: 600px;" />

            <v-divider class="mb-6"></v-divider>

            <!-- Variations -->
            <div v-if="variations && variations.length > 0" class="mb-6">
                <div class="text-subtitle-1 font-weight-bold mb-2">Weight / Option</div>
                <div class="d-flex flex-wrap gap-2">
                    <button 
                        v-for="variation in variations" 
                        :key="variation.id"
                        class="variation-pill px-4 py-2 rounded border text-body-2 font-weight-medium transition-colors"
                        :class="selectedVariationId === variation.id ? 'bg-teal-darken-1 text-white border-teal-darken-1' : 'bg-white text-grey-darken-3 border-grey-lighten-1 hover:border-grey-darken-1'"
                        @click="selectVariation(variation)"
                    >
                        {{ variation.name }}
                    </button>
                    <!-- Clear selection button -->
                    <button 
                        v-if="selectedVariationId"
                        class="variation-pill px-3 py-2 rounded border bg-grey-lighten-4 text-grey-darken-1 border-transparent hover:bg-grey-lighten-3 ml-2"
                        @click="selectedVariationId = null"
                        title="Clear selection"
                    >
                        <v-icon icon="mdi-close" size="small"></v-icon>
                    </button>
                </div>
            </div>

            <!-- Quantity & Actions -->
            <div class="d-flex align-center flex-wrap gap-4 mb-8">
                <div class="quantity-selector d-flex align-center border rounded overflow-hidden" style="height: 48px;">
                    <button 
                        class="px-3 h-100 hover:bg-grey-lighten-5 text-xl" 
                        @click="quantity > 1 ? quantity-- : null"
                        :disabled="quantity <= 1"
                    >-</button>
                    <input 
                        type="number" 
                        v-model.number="quantity"
                        class="text-center font-weight-bold outline-none" 
                        style="width: 50px;"
                        min="1"
                    >
                    <button 
                        class="px-3 h-100 hover:bg-grey-lighten-5 text-xl" 
                        @click="quantity++"
                    >+</button>
                </div>

                <v-btn 
                    color="grey-darken-4" 
                    height="48" 
                    class="px-8 text-none text-subtitle-1 font-weight-bold rounded"
                    prepend-icon="mdi-cart"
                    :loading="cartLoading"
                    @click="handleAddToCart"
                >
                    Add To Cart
                </v-btn>
            </div>
            
            <div class="d-flex gap-4 mb-8">
                <button 
                    class="d-flex align-center gap-2 text-body-2 transition-colors"
                    :class="wishlist.isInWishlist(product.id) ? 'text-error font-weight-bold' : 'text-grey-darken-1 hover:text-primary'"
                    @click="toggleWishlist"
                >
                    <v-icon :icon="wishlist.isInWishlist(product.id) ? 'mdi-heart' : 'mdi-heart-outline'"></v-icon>
                    {{ wishlist.isInWishlist(product.id) ? 'In Wishlist' : 'Add To Wishlist' }}
                </button>
            </div>

            <v-divider class="mb-6"></v-divider>

            <div class="additional-info">
               <h3 class="text-subtitle-1 font-weight-bold mb-2">Additional Information</h3>
               <div class="info-grid">
                   <div class="d-flex py-1" v-if="product.brand">
                       <span class="text-grey w-120">Brand:</span>
                       <span class="font-weight-medium">{{ product.brand.name }}</span>
                   </div>
                   <div class="d-flex py-1">
                       <span class="text-grey w-120">SKU:</span>
                       <span class="font-weight-medium">{{ selectedSku || product.sku || 'N/A' }}</span>
                   </div>
                   <div class="d-flex py-1" v-if="product.category">
                       <span class="text-grey w-120">Type:</span>
                       <span class="font-weight-medium">{{ product.category.name }}</span>
                   </div>
                   <div class="d-flex py-1">
                       <span class="text-grey w-120">Stock:</span>
                       <span class="font-weight-medium text-green">{{ currentStock > 0 ? 'In Stock' : 'Out of Stock' }}</span>
                   </div>
               </div>
            </div>

        </v-col>
      </v-row>

      <!-- Description & Reviews Section -->
      <v-row class="mt-8">
         <!-- Product description and customer feedback -->
         <v-col cols="12">
             
             <!-- Description -->
             <v-card class="mb-6 rounded-lg" elevation="0" border>
                 <v-card-title class="font-weight-bold text-h6 px-6 pt-6">Description</v-card-title>
                 <v-card-text class="px-6 pb-6 text-body-1 text-grey-darken-1" style="line-height: 1.8;">
                     <ProductRichDescription :html="product.description || product.summary" />
                 </v-card-text>
             </v-card>

             <ProductReviews v-if="product.id" :key="product.id" :product-id="product.id" @summary="reviewSummary = $event" />
         </v-col>

      </v-row>
    </v-container>


  </div>
</template>

<script setup>
const mediaBase = useRuntimeConfig().public.apiBase.replace(/\/api\/v1\/?$/, "")

import { ref, computed } from 'vue'
import { ChevronRight, House } from 'lucide-vue-next'
import { useCartStore } from '~/stores/cart'
import { useWishlistStore } from '~/stores/wishlist'

const route = useRoute()
const config = useRuntimeConfig()
const apiBase = config.public.apiBase || 'http://localhost:8000/api/v1'

const cart = useCartStore()
const wishlist = useWishlistStore()
const cartLoading = ref(false)

const quantity = ref(1)
const activeImageIndex = ref(0)
const selectedVariationId = ref(null)

const handleAddToCart = async () => {
    cartLoading.value = true
    const selectedVar = variations.value.find(v => v.id === selectedVariationId.value)
    await cart.addToCart(product.value, quantity.value, selectedVar ? { variation_id: selectedVar.id, name: selectedVar.name } : null)
    cartLoading.value = false
}

const toggleWishlist = async () => {
    await wishlist.toggleWishlist(product.value)
}

// Fetch Product Data
const { data: response, pending, error } = await useFetch(`${apiBase}/products/${route.params.slug}`)
const product = computed(() => response.value?.data || {})

const breadcrumbCategories = computed(() => {
    const category = product.value.category
    if (!category) return []
    return category.parent ? [category.parent, category] : [category]
})

// Images
const getImageUrl = (path) => {
  if (!path) return 'https://placehold.co/400'
  if (path.startsWith('http')) return path
  return `${mediaBase}/storage/${path}`
}

const allImages = computed(() => {
    const list = []
    
    // Add cover image first
    if (product.value.cover_image) {
        list.push({
            thumb: product.value.cover_thumbnail_url || getImageUrl(product.value.cover_image), // Fallback if url helper fails
            full: product.value.cover_image_url || getImageUrl(product.value.cover_image)
        })
    }
    
    // Add gallery images
    if (product.value.media && product.value.media.length) {
        product.value.media.forEach(m => {
            list.push({
                thumb: m.file_thumbnail_url || getImageUrl(m.file_path),
                full: m.file_url || getImageUrl(m.file_path)
            })
        })
    }
    
    // fallback if empty
    if(list.length === 0) {
        list.push({
            thumb: 'https://placehold.co/80',
            full: 'https://placehold.co/500'
        })
    }

    return list
})

const reviewSummary = ref({ count: 0, average: null })

// Variations Logic
const variations = computed(() => {
    if (!product.value || !product.value.attribute_values) return []
    // Group logic could go here, but for now flat list as per quick view logic
    // Showing only the value part "1kg" not "Weight: 1kg" might be cleaner if we group by attr name?
    // Screenshot shows "1/2 KG", "1 KG". That's the value.
    // Assuming backend returns helpful values.
    return product.value.attribute_values.map(av => ({
        id: av.id,
        // If attribute name is generic like 'Size' or 'Weight', maybe just show value
        name: av.value, 
        fullName: `${av.attribute.name}: ${av.value}`,
        price: Number(product.value.base_price) + Number(av.pivot.price_adjustment),
        stock: av.pivot.stock,
        sku: av.pivot.sku,
        raw: av
    }))
})

const selectVariation = (v) => {
    if (selectedVariationId.value === v.id) {
        selectedVariationId.value = null // Toggle off
    } else {
        selectedVariationId.value = v.id
    }
}

// Pricing & SKU
const currentPrice = computed(() => {
    if (selectedVariationId.value) {
        const v = variations.value.find(v => v.id === selectedVariationId.value)
        return v ? v.price : product.value.base_price
    }
    return product.value.discount_price || product.value.base_price
})

const selectedSku = computed(() => {
    if (selectedVariationId.value) {
        const v = variations.value.find(v => v.id === selectedVariationId.value)
        return v ? v.sku : null
    }
    return null
})

</script>

<style scoped>
.product-detail-page { width: 100%; padding-inline: 40px; box-sizing: border-box; }
.product-detail-page > .v-container { width: 100%; max-width: none; padding-inline: 0; }
@media(max-width:1100px) { .product-detail-page { padding-inline: 24px; } }
@media(max-width:760px) { .product-detail-page { padding-inline: 16px; } }
.product-breadcrumb-container { padding-top: 20px; padding-bottom: 24px; }
.product-breadcrumb ol { display: flex; align-items: center; flex-wrap: wrap; gap: 9px 0; padding: 0; margin: 0; list-style: none; font-size: 12px; line-height: 1.7; }
.product-breadcrumb li { display: flex; align-items: center; gap: 10px; min-width: 0; margin-right: 10px; }
.product-breadcrumb a { display: inline-flex; align-items: center; gap: 6px; color: #78608e; text-decoration: none; }
.product-breadcrumb a:hover { color: #503080; text-decoration: underline; }
.product-breadcrumb svg { flex-shrink: 0; color: #a18bb1; }
.product-breadcrumb .breadcrumb-current { flex: 0 1 auto; color: #544060; margin-right: 0; }
.breadcrumb-current span { overflow-wrap: anywhere; }
@media(max-width:600px) { .product-breadcrumb-container { padding-top: 16px; padding-bottom: 20px; }.product-breadcrumb ol { font-size: 11px; }.product-breadcrumb li { gap: 6px; margin-right: 6px; } }

.product-review-link { display: inline-block; color: #866098; font-size: 12px; margin-bottom: 24px; text-decoration: none; }
.product-review-link:hover { text-decoration: underline; }
.gap-4 { gap: 1rem; }
.gap-2 { gap: 0.5rem; }
.w-120 { width: 120px; min-width: 120px; }
.border-b { border-bottom: 1px solid #e0e0e0; }
.text-error { color: #d32f2f; }
.transition-colors { transition: all 0.2s ease; }
.transition-swing { transition: all 0.3s cubic-bezier(0.25, 0.8, 0.5, 1); }

.thumbnails-column {
    width: 80px;
}
.thumbnail-item {
    transition: border-color 0.2s;
}
.thumbnail-item:hover {
    border-color: #aaa;
}
.quantity-selector button {
    transition: background-color 0.2s;
}
.quantity-selector input::-webkit-outer-spin-button,
.quantity-selector input::-webkit-inner-spin-button {
  -webkit-appearance: none;
  margin: 0;
}
</style>
