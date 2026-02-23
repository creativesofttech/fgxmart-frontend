<template>
  <v-dialog v-model="internalDialog" max-width="900" scrollable>
    <v-card class="rounded-lg overflow-hidden">
      <!-- Close Button -->
      <v-btn
        icon="mdi-close"
        size="small"
        color="primary"
        variant="flat"
        class="position-absolute top-0 right-0 ma-2 z-10"
        @click="internalDialog = false"
      ></v-btn>

      <v-container class="pa-0">
        <v-row no-gutters>
          <!-- Left Column: Image -->
          <v-col cols="12" md="6" class="position-relative bg-grey-lighten-5 d-flex align-center justify-center pa-4">
             <v-img
               :src="getImageUrl(product.cover_image)"
               :alt="product.name"
               max-height="400"
               contain
               class="product-image"
             ></v-img>
          </v-col>

          <!-- Right Column: Details -->
          <v-col cols="12" md="6" class="pa-6 d-flex flex-column">
             <h2 class="text-h5 font-weight-bold text-uppercase mb-1" style="line-height: 1.3;">
                {{ product.name }}
             </h2>
             
             <div class="d-flex align-baseline mb-2">
                <span class="text-h5 font-weight-bold text-primary mr-2">${{ currentPrice }}</span>
                <span v-if="product.discount_price && !selectedVariationId" class="text-body-1 text-grey text-decoration-line-through">${{ product.base_price }}</span>
             </div>

             <div class="d-flex align-center mb-4">
               <v-rating
                 :model-value="4.5" 
                 color="warning"
                 density="compact"
                 size="small"
                 half-increments
                 readonly
               ></v-rating>
               <span class="text-caption text-grey ml-2">8 Reviews <span class="text-red-lighten-1 ml-1"></span></span>
             </div>

             <v-divider class="mb-4 border-dashed"></v-divider>

             <div class="mb-4">
               <h4 class="text-subtitle-1 font-weight-bold mb-2">Product Details :</h4>
               <p class="text-body-2 text-grey-darken-1" style="line-height: 1.6;">
                  {{ product.description || 'No description available.' }}
               </p>
             </div>
             
             <div class="product-meta mb-4">
                <div class="d-flex mb-1" v-if="product.brand">
                   <span class="text-body-2 text-grey w-120">Brand Name:</span>
                   <span class="text-body-2 font-weight-medium">{{ product.brand.name }}</span>
                </div>
                <div class="d-flex mb-1">
                   <span class="text-body-2 text-grey w-120">Product Code:</span>
                   <span class="text-body-2 font-weight-medium">{{ selectedSku || product.sku || 'N/A' }}</span>
                </div>
                <div class="d-flex mb-1" v-if="product.category">
                   <span class="text-body-2 text-grey w-120">Product Type:</span>
                   <span class="text-body-2 font-weight-medium">{{ product.category.name }}</span>
                </div>
             </div>

             <v-divider class="mb-4 border-dashed"></v-divider>

             <!-- Variations -->
             <div v-if="hasVariations" class="d-flex align-center mb-6">
                <span class="text-body-2 font-weight-bold mr-4">Size / Option :</span>
                <v-select
                  v-model="selectedVariationId"
                  :items="variations"
                  item-title="name"
                  item-value="id"
                  label="Select Option"
                  clearable
                  density="compact"
                  variant="outlined"
                  hide-details
                  bg-color="white"
                  style="max-width: 200px;"
                >
                  <template v-slot:selection="{ item }">
                     {{ item.raw.name }}
                     <!-- ({{ item.raw.price > 0 ? '$'+item.raw.price : '' }}) -->
                  </template>
                  <template v-slot:item="{ props, item }">
                    <v-list-item v-bind="props" :title="item.raw.name" :subtitle="`Stock: ${item.raw.stock}`"></v-list-item>
                  </template>
                </v-select>
             </div>

             <div class="d-flex gap-4 mt-auto">
                <v-btn
                  color="grey-darken-4"
                  size="large"
                  class="text-none px-6 font-weight-bold flex-grow-1"
                  rounded="lg"
                  prepend-icon="mdi-cart-plus"
                >
                  Add To Cart
                </v-btn>

                <v-btn
                  color="primary"
                  size="large"
                  class="text-none px-6 font-weight-bold flex-grow-1"
                  rounded="lg"
                  :to="`/products/${product.slug}`"
                >
                  View More Details
                </v-btn>
             </div>

          </v-col>
        </v-row>
      </v-container>
    </v-card>
  </v-dialog>
</template>

<script setup>
const props = defineProps({
  modelValue: Boolean,
  product: {
    type: Object,
    required: true,
    default: () => ({})
  }
})

const emit = defineEmits(['update:modelValue'])

const internalDialog = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val)
})

const getImageUrl = (path) => {
  if (!path) return 'https://placehold.co/400'
  if (path.startsWith('http')) return path
  return `http://localhost:8000/storage/${path}`
}

// Variation Logic
const selectedVariationId = ref(null)

const variations = computed(() => {
    if (!props.product || !props.product.attribute_values) return []
    return props.product.attribute_values.map(av => ({
        id: av.id,
        name: `${av.attribute.name}: ${av.value}`,
        price: Number(props.product.base_price) + Number(av.pivot.price_adjustment),
        stock: av.pivot.stock,
        sku: av.pivot.sku,
        raw: av
    }))
})

const hasVariations = computed(() => variations.value.length > 0)

const currentPrice = computed(() => {
    if (selectedVariationId.value) {
        const v = variations.value.find(v => v.id === selectedVariationId.value)
        return v ? v.price : props.product.base_price
    }
    return props.product.discount_price || props.product.base_price
})

const selectedSku = computed(() => {
    if (selectedVariationId.value) {
        const v = variations.value.find(v => v.id === selectedVariationId.value)
        return v ? v.sku : null
    }
    return null
})

const { gtag } = useGtag()

// Reset variation when product changes
watch(() => props.product, (newProd) => {
    selectedVariationId.value = null
    
    // Track view_item in GA4
    if (newProd && internalDialog.value) {
      gtag('event', 'view_item', {
        currency: 'USD',
        value: newProd.discount_price || newProd.base_price,
        items: [
          {
            item_id: newProd.id,
            item_name: newProd.name,
            item_category: newProd.category?.name,
            price: newProd.discount_price || newProd.base_price,
            quantity: 1
          }
        ]
      })
    }
}, { immediate: true })

// Track when dialog opens if product is already set
watch(internalDialog, (isOpen) => {
  if (isOpen && props.product.id) {
    gtag('event', 'view_item', {
      currency: 'USD',
      value: props.product.discount_price || props.product.base_price,
      items: [
        {
          item_id: props.product.id,
          item_name: props.product.name,
          item_category: props.product.category?.name,
          price: props.product.discount_price || props.product.base_price,
          quantity: 1
        }
      ]
    })
  }
})
</script>

<style scoped>
.z-10 {
  z-index: 10;
}
.w-120 {
  width: 120px;
  min-width: 120px;
}
.gap-4 {
  gap: 16px;
}
.border-dashed {
  border-style: dashed !important;
}
</style>
