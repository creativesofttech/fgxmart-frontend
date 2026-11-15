<template>
  <motion.article class="tw:card catalogue-card" :class="{ 'is-preview': !product }" :while-hover="{ y: -4 }">
    <div class="product-visual">
      <span v-if="discountPercent" class="tw:badge discount-label">{{ discountPercent }}% OFF</span>
      <span v-else-if="!product" class="tw:badge preview-label">Coming soon</span>
      <span v-else class="tw:badge featured-label">{{ product.is_featured ? 'Featured' : 'Discover' }}</span>
      <button v-if="product" class="tw:btn tw:btn-circle tw:btn-ghost wishlist-button" type="button" :aria-label="`${isWished ? 'Remove' : 'Save'} ${product.name} ${isWished ? 'from' : 'to'} wishlist`" :aria-pressed="isWished" :disabled="wishlistLoading" @click="toggleWishlist">
        <Heart :size="19" :fill="isWished ? 'currentColor' : 'none'" aria-hidden="true" />
      </button>
      <NuxtLink v-if="product" :to="productLink" class="product-image-link" :aria-label="`View ${product.name}`">
        <img src="/assets/images/home/product-placeholder.webp" :alt="`${product.name} — product image coming soon`" width="960" height="533" loading="lazy" decoding="async" />
      </NuxtLink>
      <div v-else class="product-image-link"><img src="/assets/images/home/product-placeholder.webp" alt="Product image coming soon" width="960" height="533" loading="lazy" decoding="async" /></div>
    </div>
    <div class="product-copy">
      <p class="product-category">{{ product?.category?.name || preview.category }}</p>
      <h3><NuxtLink v-if="product" :to="productLink">{{ product.name }}</NuxtLink><span v-else>{{ preview.name }}</span></h3>
      <div v-if="product" class="product-price">
        <strong>{{ money(price) }}</strong><del v-if="discountPercent">{{ money(product.base_price) }}</del><span v-if="discountPercent" class="saving-label">{{ discountPercent }}% off</span>
      </div>
      <p v-else class="preview-description">New everyday favourites are on their way.</p>
      <NuxtLink v-if="hasVariations" :to="productLink" class="tw:btn tw:btn-primary enquiry-button"><ShoppingCart :size="16" aria-hidden="true" /> Choose options</NuxtLink>
      <button v-else class="tw:btn tw:btn-primary enquiry-button" type="button" :disabled="!product || adding" @click="addToEnquiry">
        <Check v-if="added" :size="16" aria-hidden="true" /><ShoppingCart v-else-if="product" :size="16" aria-hidden="true" /><Clock3 v-else :size="15" aria-hidden="true" />
        {{ !product ? 'Coming soon' : adding ? 'Adding…' : added ? 'Added to enquiry' : 'Add to Enquiry' }}
      </button>
    </div>
  </motion.article>
</template>

<script setup>
import { motion } from 'motion-v'
import { Check, Clock3, Heart, ShoppingCart } from 'lucide-vue-next'
import { useCartStore } from '~/stores/cart'
import { useWishlistStore } from '~/stores/wishlist'

const props = defineProps({ product: { type: Object, default: null }, preview: { type: Object, default: () => ({ category: 'Everyday essentials', name: 'Something good is coming' }) } })
const emit = defineEmits(['notice'])
const cart = useCartStore()
const wishlist = useWishlistStore()
const adding = ref(false)
const added = ref(false)
const wishlistLoading = ref(false)
let feedbackTimer
const productLink = computed(() => `/products/${props.product?.slug}`)
const price = computed(() => Number(props.product?.discount_price ?? props.product?.base_price ?? 0))
const discountPercent = computed(() => {
  const base = Number(props.product?.base_price || 0)
  return base > price.value && price.value >= 0 ? Math.round((base - price.value) / base * 100) : 0
})
const hasVariations = computed(() => Boolean(props.product?.attribute_values?.length))
const isWished = computed(() => props.product ? wishlist.isInWishlist(props.product.id) : false)
const money = value => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 2 }).format(Number(value))
const quantityInCart = () => cart.items.filter(item => item.product_id === props.product.id).reduce((sum, item) => sum + item.quantity, 0)

const addToEnquiry = async () => {
  if (!props.product || adding.value) return
  adding.value = true
  const before = quantityInCart()
  try {
    await cart.addToCart(props.product, 1)
    if (quantityInCart() <= before) throw new Error('Unable to update enquiry')
    added.value = true
    emit('notice', `${props.product.name} added to your enquiry.`)
    clearTimeout(feedbackTimer)
    feedbackTimer = setTimeout(() => { added.value = false }, 2500)
  } catch { emit('notice', 'We couldn’t add that product. Please try again.') }
  finally { adding.value = false }
}
const toggleWishlist = async () => {
  if (wishlistLoading.value) return
  wishlistLoading.value = true
  const before = isWished.value
  try {
    await wishlist.toggleWishlist(props.product)
    emit('notice', isWished.value !== before ? `${props.product.name} ${isWished.value ? 'saved to' : 'removed from'} your wishlist.` : 'We couldn’t update your wishlist. Please try again.')
  } catch { emit('notice', 'We couldn’t update your wishlist. Please try again.') }
  finally { wishlistLoading.value = false }
}
onUnmounted(() => clearTimeout(feedbackTimer))
</script>

<style scoped>
.catalogue-card { display: flex; flex-direction: column; min-width: 0; overflow: hidden; border: 1px solid #ece8f1; border-radius: 14px; background: white; box-shadow: 0 3px 10px rgb(40 22 68 / 2%); }
.product-visual { position: relative; padding: 35px 15px 10px; }
.product-image-link { display: flex; align-items: center; justify-content: center; width: 100%; aspect-ratio: 1.65; overflow: hidden; border-radius: 8px; background: #f7f5fb; }
.product-image-link img { width: 100%; height: 100%; display: block; object-fit: contain; }
.discount-label, .featured-label, .preview-label { position: absolute; left: 15px; top: 14px; padding: 4px 7px; min-height: 0; height: auto; border: 0; border-radius: 5px; font-size: 9px; font-weight: 700; line-height: 1.3; }
.discount-label { background: #538e11; color: white; }
.featured-label { background: #fff1bd; color: #775200; }
.preview-label { background: #f0eaf8; color: #7d6398; }
.wishlist-button { position: absolute; top: 8px; right: 10px; width: 31px; height: 31px; min-height: 31px; padding: 0; border: 0; background: transparent; color: #968a9c; }
.wishlist-button[aria-pressed="true"] { color: #6a3c98; }
.product-copy { display: flex; flex-direction: column; flex: 1; padding: 13px 16px 16px; }
.product-category { font-size: 9px; letter-spacing: .7px; text-transform: uppercase; color: #918299; margin-bottom: 7px; }
h3 { font-size: 14px; color: #2c1c40; font-weight: 650; line-height: 1.55; min-height: 43px; margin: 0 0 9px; }
h3 a { display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
h3 a:hover { color: #67409b; }
.product-price { display: flex; align-items: center; flex-wrap: wrap; gap: 8px; margin-bottom: 17px; min-height: 22px; }
.product-price strong { color: #2b1b3e; font-size: 17px; font-weight: 750; letter-spacing: -.4px; }
.product-price del { color: #a29aa9; font-size: 11px; }
.saving-label { font-size: 9px; font-weight: 650; color: #4d8112; background: #f0f8e5; padding: 2px 5px; border-radius: 4px; }
.enquiry-button { width: 100%; display: flex; align-items: center; justify-content: center; gap: 9px; min-height: 37px; height: 37px; margin-top: auto; border: 0; border-radius: 7px; padding: 0 10px; background: linear-gradient(110deg, #50308a, #3f2175); color: white; font-size: 11px; font-weight: 600; }
.enquiry-button:hover { background: #351762; }
.enquiry-button:disabled { background: #f0edf5; color: #998aa8; cursor: default; opacity: 1; }
.preview-description { color: #a095aa; font-size: 11px; line-height: 1.6; margin-bottom: 17px; }
.is-preview h3 { min-height: auto; }
@media (max-width: 600px) { .product-visual { padding: 36px 10px 5px; } .product-copy { padding: 12px 11px; } h3 { font-size: 12px; min-height: 37px; } .product-category { font-size: 8px; letter-spacing: .3px; } .product-price { gap: 5px; margin-bottom: 13px; } .product-price strong { font-size: 15px; } .product-price del { font-size: 10px; } .discount-label, .featured-label, .preview-label { left: 11px; top: 12px; font-size: 8px; } .enquiry-button { font-size: 10px; gap: 6px; min-height: 35px; height: auto; padding: 8px 5px; } .preview-description { font-size: 10px; } }
</style>
