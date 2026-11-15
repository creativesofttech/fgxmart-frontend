<template>
  <div class="product-detail-page pb-16 custom-container">
    <!-- Breadcrumb / Header -->
    <div class="bg-white py-6 mb-8 border-b">
        <v-container>
            <div class="d-flex justify-space-between align-center">
                <h1 class="text-h4 font-weight-bold text-grey-darken-3">{{ product?.name || 'Loading...' }}</h1>
                <v-breadcrumbs :items="breadcrumbs" class="pa-0">
                    <template v-slot:divider>
                        <v-icon icon="mdi-chevron-right"></v-icon>
                    </template>
                </v-breadcrumbs>
            </div>
        </v-container>
    </div>

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
            <div class="d-flex align-center mb-6">
                <v-rating
                  :model-value="4.5"
                  color="warning" 
                  half-increments
                  density="compact"
                  size="small"
                  readonly
                ></v-rating>
                <div class="text-body-2 text-grey ml-2">(23 Customer Reviews)</div>
            </div>

            <!-- Description -->
            <p class="text-body-1 text-grey-darken-1 mb-6" style="line-height: 1.6; max-width: 600px;">
                {{ product.description || product.summary || 'No description available for this product.' }}
            </p>

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
         <!-- Right Content (70%) -->
         <v-col cols="12" md="8" lg="9">
             
             <!-- Description -->
             <v-card class="mb-6 rounded-lg" elevation="0" border>
                 <v-card-title class="font-weight-bold text-h6 px-6 pt-6">Description</v-card-title>
                 <v-card-text class="px-6 pb-6 text-body-1 text-grey-darken-1" style="line-height: 1.8;">
                     {{ product.description || product.summary || 'No description available.' }}
                     <br><br>
                     <p>
                        Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.
                     </p>
                 </v-card-text>
             </v-card>

             <!-- Reviews UI -->
             <v-card class="rounded-lg" elevation="0" border>
                 <v-card-text class="pa-6">
                     <v-row>
                         <!-- Rating Summary (Left) -->
                         <v-col cols="12" md="4" class="border-e-md">
                             <div class="d-flex align-center mb-4">
                                 <span class="text-h3 font-weight-bold mr-2">3.40</span>
                                 <v-icon color="warning" icon="mdi-star" size="32"></v-icon>
                                 <span class="text-body-2 text-grey ml-2">5 Overall Rating</span>
                             </div>

                             <div class="rating-bars mb-6">
                                 <div v-for="i in 5" :key="i" class="d-flex align-center mb-1">
                                     <span class="font-weight-bold mr-2 text-no-wrap" style="width: 30px">{{ 6-i }} ★</span>
                                     <v-progress-linear 
                                        :model-value="getRatingPercent(6-i)" 
                                        :color="getRatingColor(6-i)" 
                                        height="6" 
                                        class="rounded-pill mr-2"
                                     ></v-progress-linear>
                                     <span class="text-caption text-grey" style="width: 20px">{{ getRatingCount(6-i) }}</span>
                                 </div>
                             </div>

                             <div class="text-subtitle-1 font-weight-bold mb-1">Review this product</div>
                             <p class="text-caption text-grey mb-4">Let other customers know what you think</p>
                             <v-btn block variant="outlined" color="primary" class="text-none" @click="showReviewDialog = true">Write a review</v-btn>
                         </v-col>

                         <!-- Review List (Right) -->
                         <v-col cols="12" md="8">
                             <div class="reviews-list">
                                 <div v-for="(review, index) in reviews" :key="index" class="review-item mb-4 pb-4 border-b-sm last-no-border">
                                     <div class="d-flex justify-space-between align-start mb-2">
                                         <div class="d-flex">
                                             <v-avatar size="40" class="mr-3">
                                                 <v-img :src="review.avatar" :alt="review.name"></v-img>
                                             </v-avatar>
                                             <div>
                                                 <div class="d-flex align-center">
                                                     <span class="font-weight-bold text-body-2 mr-2">{{ review.name }}</span>
                                                     <span class="text-caption text-grey">{{ review.date }}</span>
                                                 </div>
                                                 <v-rating 
                                                    :model-value="review.rating" 
                                                    color="warning" 
                                                    density="compact" 
                                                    size="x-small" 
                                                    readonly
                                                 ></v-rating>
                                             </div>
                                         </div>
                                     </div>
                                     <p class="text-body-2 text-grey-darken-2 pl-13">{{ review.comment }}</p>
                                 </div>
                             </div>
                         </v-col>
                     </v-row>
                 </v-card-text>
             </v-card>
         </v-col>
         <!-- Left Sidebar (30%) - Empty Card -->
         <v-col cols="12" md="4" lg="3">
             <v-card class="h-100 rounded-lg" elevation="0" border>
                 <v-card-text class="d-flex align-center justify-center text-grey-lighten-1" style="min-height: 300px;">
                     Sidebar Item
                 </v-card-text>
             </v-card>
         </v-col>
      </v-row>
    </v-container>

    <!-- Write Review Modal -->
    <v-dialog v-model="showReviewDialog" max-width="500">
      <v-card class="rounded-lg">
        <v-card-title class="d-flex justify-space-between align-center pa-4 border-b">
          <span class="text-h6 font-weight-bold">Write a Review</span>
          <v-btn icon="mdi-close" variant="text" size="small" @click="showReviewDialog = false"></v-btn>
        </v-card-title>

        <v-card-text class="pa-4">
          <v-form @submit.prevent="submitReview">
            <div class="mb-4 text-center">
              <div class="text-subtitle-1 mb-2">Your Rating</div>
              <v-rating
                v-model="reviewForm.rating"
                color="warning"
                hover
                half-increments
                density="comfortable"
                size="large"
              ></v-rating>
            </div>

            <v-textarea
              v-model="reviewForm.comment"
              label="Your Review"
              placeholder="What did you like or dislike?"
              variant="outlined"
              rows="4"
              color="primary"
              class="mb-2"
            ></v-textarea>

            <v-file-input
              v-model="reviewForm.image"
              label="Upload Image (Optional)"
              accept="image/*"
              variant="outlined"
              prepend-icon="mdi-camera"
              density="compact"
              show-size
              color="primary"
            ></v-file-input>
          </v-form>
        </v-card-text>

        <v-divider></v-divider>

        <v-card-actions class="pa-4">
          <v-spacer></v-spacer>
          <v-btn
            variant="text"
            color="grey-darken-1"
            class="text-none"
            @click="showReviewDialog = false"
          >
            Cancel
          </v-btn>
          <v-btn
            color="primary"
            class="text-none px-6"
            variant="flat"
            :loading="isSubmittingReview"
            @click="submitReview"
            :disabled="!reviewForm.rating"
          >
            Submit Review
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script setup>
const mediaBase = useRuntimeConfig().public.apiBase.replace(/\/api\/v1\/?$/, "")

import { ref, computed } from 'vue'
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

// Breadcrumbs
const breadcrumbs = computed(() => [
    { title: 'Home', disabled: false, href: '/' },
    { title: product.value?.name || 'Product', disabled: true, href: '#' }
])

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

// Static Reviews
const reviews = ref([
    {
        name: 'Jack Doe',
        avatar: 'https://placehold.co/100',
        date: '29 Sep 2023 06:40:PM',
        rating: 4.5,
        comment: 'Avoid this product. The quality is terrible, and it started falling apart almost immediately. I wish I had read more reviews before buying. Lesson learned.'
    },
    {
        name: 'Jessica Miller',
        avatar: 'https://placehold.co/100',
        date: '29 Sep 2023 06:40:PM',
        rating: 5,
        comment: 'Honestly, I regret buying this item. The quality is subpar, and it feels like a waste of money. I wouldn\'t recommend it to anyone.'
    },
    {
        name: 'Rome Doe',
        avatar: 'https://placehold.co/100',
        date: '29 Sep 2023 06:40:PM',
        rating: 5,
        comment: 'I am extremely satisfied with this purchase. The item arrived promptly, and the quality is exceptional. It\'s evident that the makers paid attention to detail. Overall, a fantastic buy!'
    }
])

const getRatingPercent = (star) => {
    const map = { 5: 80, 4: 40, 3: 0, 2: 30, 1: 20 }
    return map[star] || 0
}

const getRatingCount = (star) => {
    const map = { 5: 2, 4: 1, 3: 0, 2: 1, 1: 1 }
    return map[star] || 0
}

const getRatingColor = (star) => {
    if (star >= 4) return 'green'
    if (star === 3) return 'orange'
    if (star <= 2) return 'red'
    return 'grey'
}

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

// Review Modal
const showReviewDialog = ref(false)
const isSubmittingReview = ref(false)
const reviewForm = ref({
    rating: 0,
    comment: '',
    image: null
})

const submitReview = () => {
    isSubmittingReview.value = true
    // TODO: Implement backend submission later
    console.log('Submitting review:', reviewForm.value)
    
    // Simulate process
    setTimeout(() => {
        isSubmittingReview.value = false
        showReviewDialog.value = false
        // Reset form
        reviewForm.value = { rating: 0, comment: '', image: null }
        alert('Review submitted successfully!')
    }, 1500)
}
</script>

<style scoped>
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
