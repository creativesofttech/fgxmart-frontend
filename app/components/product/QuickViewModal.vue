<template>
  <dialog ref="dialog" class="tw:modal quick-dialog" data-theme="fgx" :aria-label="`Quick view: ${product.name || 'Product'}`" @cancel.prevent="close" @click="onBackdrop">
    <div class="tw:modal-box quick-view-box">
      <header class="quick-header"><span>QUICK VIEW</span><button type="button" class="quick-close" aria-label="Close quick view" autofocus @click="close"><X :size="19" /></button></header>
      <div class="quick-body">
        <div class="quick-visual"><ProductImage :product="product" width="500" height="500" /><span v-if="product.category?.name" class="quick-category">{{ product.category.name }}</span></div>
        <div class="quick-details">
          <p v-if="product.brand?.name" class="quick-brand">{{ product.brand.name }}</p>
          <h2>{{ product.name }}</h2>
          <div class="quick-price"><strong>{{ money(currentPrice) }}</strong><del v-if="discountPercent">{{ money(product.base_price) }}</del><span v-if="discountPercent">{{ discountPercent }}% off</span></div>
          <p class="quick-summary">{{ product.summary?.trim() || 'Open product details for more information.' }}</p>
          <dl class="quick-meta"><template v-if="selectedSku || product.sku"><dt>SKU</dt><dd>{{ selectedSku || product.sku }}</dd></template><template v-if="product.variation_code"><dt>Weight / Volume</dt><dd>{{ product.variation_code }}</dd></template><template v-if="product.hsn_code"><dt>HSN Code</dt><dd>{{ product.hsn_code }}</dd></template></dl>
          <AppSelect v-if="variations.length" v-model="selectedVariationId" :options="variations" label="Choose an option" placeholder="Select an option" :allow-empty="false" />
          <div class="quick-quantity-row"><div><label for="quick-quantity">Quantity</label><div class="quick-quantity"><button type="button" aria-label="Decrease quantity" :disabled="quantity <= 1 || adding" @click="quantity--"><Minus :size="15" /></button><input id="quick-quantity" v-model.number="quantity" type="number" min="1" :max="maximumQuantity" :disabled="adding || stock === 0" @change="normalizeQuantity" /><button type="button" aria-label="Increase quantity" :disabled="quantity >= maximumQuantity || adding || stock === 0" @click="quantity++"><Plus :size="15" /></button></div></div><span class="stock-pill" :class="{ unavailable: stock === 0 }"><span aria-hidden="true" />{{ stock === 0 ? 'Out of stock' : 'Available for enquiry' }}</span></div>
          <p v-if="variations.length && !selectedVariationId" class="option-hint">Choose an option before adding to your enquiry.</p>
        </div>
      </div>
      <footer class="quick-footer"><p class="quick-notice" role="status" aria-live="polite">{{ notice || 'Pick your favourites. Enquire with your list.' }}</p><div class="quick-actions"><NuxtLink :to="`/products/${product.slug}`" class="quick-secondary" @click="close">View details <ArrowUpRight :size="16" /></NuxtLink><button type="button" class="quick-primary" :disabled="adding || !product.id || stock === 0 || (variations.length && !selectedVariationId)" @click="addToEnquiry"><ShoppingCart :size="17" />{{ adding ? 'Adding...' : 'Add to enquiry' }}</button></div></footer>
    </div>
  </dialog>
</template>
<script setup>
import { ArrowUpRight, Minus, Plus, ShoppingCart, X } from 'lucide-vue-next'
import { useCartStore } from '~/stores/cart'
const props = defineProps({ modelValue: Boolean, product: { type: Object, default: () => ({}) } })
const emit = defineEmits(['update:modelValue'])
const dialog = ref(null), quantity = ref(1), selectedVariationId = ref(null), adding = ref(false), notice = ref('')
const cart = useCartStore()
let previousFocus
const close = () => emit('update:modelValue', false)
const onBackdrop = event => { if (event.target === dialog.value) close() }
const money = value => new Intl.NumberFormat('en-US', {style:'currency',currency:'USD'}).format(Number(value || 0))
const variations = computed(() => (props.product.attribute_values || []).map(value => ({
  id: value.id,
  name: `${value.attribute?.name || 'Option'}: ${value.value}`,
  price: value.pivot?.price != null ? Number(value.pivot.price) : Number(props.product.base_price || 0) + Number(value.pivot?.price_adjustment || 0),
  stock: Number(value.pivot?.stock || 0), sku: value.pivot?.sku,
  description: Number(value.pivot?.stock || 0) > 0 ? 'Available' : 'Out of stock',
  disabled: Number(value.pivot?.stock || 0) <= 0,
})))
const selectedVariation = computed(() => variations.value.find(value => value.id === selectedVariationId.value))
const currentPrice = computed(() => selectedVariation.value?.price ?? props.product.discount_price ?? props.product.base_price ?? 0)
const selectedSku = computed(() => selectedVariation.value?.sku)
const discountPercent = computed(() => !selectedVariation.value && Number(props.product.base_price) > Number(currentPrice.value) ? Math.round((Number(props.product.base_price) - Number(currentPrice.value)) / Number(props.product.base_price) * 100) : 0)
const stock = computed(() => selectedVariation.value ? selectedVariation.value.stock : props.product.stock_quantity == null ? null : Number(props.product.stock_quantity))
const maximumQuantity = computed(() => stock.value == null ? 999 : Math.max(1, stock.value))
const normalizeQuantity = () => { quantity.value = Math.min(maximumQuantity.value, Math.max(1, Math.floor(Number(quantity.value) || 1))) }
watch(selectedVariationId, () => { quantity.value = 1; notice.value = '' })
const reset = () => { quantity.value = 1; selectedVariationId.value = null; notice.value = '' }
watch(() => props.product.id, reset)
watchEffect(() => {
  if (!dialog.value) return
  if (props.modelValue && !dialog.value.open) { previousFocus = document.activeElement; reset(); dialog.value.showModal() }
  else if (!props.modelValue && dialog.value.open) { dialog.value.close(); previousFocus?.focus?.() }
})
const route = useRoute()
watch(() => route.fullPath, close)
const { gtag } = useGtag()
watch(() => props.modelValue, opened => {
  if (opened && props.product.id) gtag('event', 'view_item', {currency:'USD',value:Number(currentPrice.value),items:[{item_id:props.product.id,item_name:props.product.name,item_category:props.product.category?.name,price:Number(currentPrice.value),quantity:1}]})
})
const addToEnquiry = async () => {
  if (adding.value || !props.product.id || stock.value === 0 || (variations.value.length && !selectedVariation.value)) return
  normalizeQuantity(); adding.value = true; notice.value = ''
  const options = selectedVariation.value ? {variation_id:selectedVariation.value.id,name:selectedVariation.value.name} : null
  const inCart = () => cart.items.filter(item => item.product_id === props.product.id && (item.options?.variation_id || null) === (options?.variation_id || null)).reduce((sum,item) => sum + item.quantity,0)
  const before = inCart()
  try {
    await cart.addToCart(props.product, quantity.value, options)
    if (inCart() < before + quantity.value) throw new Error('Unable to add product')
    notice.value = `${quantity.value} ${quantity.value === 1 ? 'item' : 'items'} added to your enquiry.`
  } catch { notice.value = 'Unable to add this product. Please try again.' }
  finally { adding.value = false }
}
</script>
<style scoped>
.quick-dialog { width: 100vw; max-width: none; height: 100dvh; max-height: none; inset: 0; margin: 0; padding: 16px; border: 0; background: #21133385; backdrop-filter: blur(4px); color: #312042; }
.quick-dialog[open] { display: grid; place-items: center; }
.quick-dialog::backdrop { background: transparent; }
.quick-view-box { display: flex; flex-direction: column; width: min(960px, 100%); max-width: 960px; max-height: calc(100dvh - 32px); margin: 0; padding: 0; border: 1px solid #ece5f3; border-radius: 16px; background: white; overflow: hidden; box-shadow: 0 24px 80px #21133330; }
.quick-header { display: flex; justify-content: space-between; align-items: center; flex-shrink: 0; padding: 14px 20px; border-bottom: 1px solid #f0eaf5; }
.quick-header > span { color: #9886a8; font-size: 10px; font-weight: 650; letter-spacing: 1.8px; }
.quick-close { display: grid; place-items: center; width: 32px; height: 32px; border: 0; border-radius: 50%; background: #f4eff9; color: #69438e; cursor: pointer; }
.quick-close:hover { background: #e9dff4; }
.quick-body { display: grid; grid-template-columns: .95fr 1.05fr; min-height: 0; overflow-y: auto; }
.quick-visual { position: relative; display: flex; align-items: center; justify-content: center; padding: 32px; background: linear-gradient(145deg,#fbfafc,#f4f0f9); min-width: 0; }
.quick-visual img { display: block; width: 100%; height: 340px; max-height: 45vh; object-fit: contain; }
.quick-category { position: absolute; top: 18px; left: 18px; padding: 5px 10px; background: #ffffffd9; color: #806294; border: 1px solid #e8dff0; border-radius: 7px; font-size: 10px; }
.quick-details { min-width: 0; padding: 26px 28px; }
.quick-brand { margin: 0 0 8px; font-size: 11px; color: #8a719e; font-weight: 600; }
.quick-details h2 { margin: 0 0 14px; font-size: 24px; line-height: 1.35; font-weight: 700; letter-spacing: -.5px; overflow-wrap: anywhere; }
.quick-price { display: flex; align-items: center; flex-wrap: wrap; gap: 10px; margin-bottom: 17px; }
.quick-price strong { font-size: 25px; color: #523080; font-weight: 750; }
.quick-price del { font-size: 13px; color: #aaa0b1; }
.quick-price > span { border-radius: 5px; background: #edf6e7; color: #5f8534; padding: 4px 7px; font-size: 10px; font-weight: 650; }
.quick-summary { color: #85738f; font-size: 13px; line-height: 1.75; margin: 0 0 18px; white-space: pre-line; display: -webkit-box; -webkit-line-clamp: 4; -webkit-box-orient: vertical; overflow: hidden; }
.quick-meta { display: grid; grid-template-columns: auto 1fr; gap: 7px 16px; margin: 0 0 20px; font-size: 11px; }
.quick-meta dt { color: #ab9bb7; }
.quick-meta dd { margin: 0; color: #6c557e; overflow-wrap: anywhere; }
.quick-quantity-row { display: flex; align-items: end; justify-content: space-between; flex-wrap: wrap; gap: 12px; margin-top: 20px; }
.quick-quantity-row label { display: block; font-size: 11px; color: #9a87a8; margin-bottom: 7px; }
.quick-quantity { display: flex; align-items: center; height: 37px; border: 1px solid #e4d9ef; border-radius: 8px; overflow: hidden; }
.quick-quantity button { display: grid; place-items: center; width: 32px; height: 100%; padding: 0; border: 0; color: #76568f; background: #faf7fd; cursor: pointer; }
.quick-quantity input { width: 38px; min-width: 0; padding: 0; border: 0; background: white; text-align: center; color: #63447d; font-size: 12px; appearance: textfield; }
.quick-quantity input::-webkit-inner-spin-button, .quick-quantity input::-webkit-outer-spin-button { appearance: none; margin: 0; }
.quick-quantity button:disabled { opacity: .4; cursor: not-allowed; }
.stock-pill { display: flex; align-items: center; gap: 5px; color: #709248; font-size: 10px; padding-bottom: 11px; }
.stock-pill > span { width: 5px; height: 5px; border-radius: 50%; background: currentColor; }
.stock-pill.unavailable { color: #b37587; }
.option-hint { font-size: 10px; color: #a28eb1; margin: 10px 0 0; }
.quick-footer { display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; flex-shrink: 0; gap: 12px; padding: 17px 22px; border-top: 1px solid #eee6f5; }
.quick-notice { color: #9c8aa9; font-size: 10px; line-height: 1.6; margin: 0; max-width: 220px; }
.quick-actions { display: flex; gap: 10px; }
.quick-primary, .quick-secondary { display: inline-flex; align-items: center; justify-content: center; gap: 8px; min-height: 40px; padding: 10px 15px; border-radius: 8px; font-size: 12px; font-weight: 600; line-height: 1.5; cursor: pointer; text-decoration: none; }
.quick-primary { border: 1px solid #523080; color: white; background: #523080; }
.quick-primary:hover { background: #65408e; }
.quick-primary:disabled { opacity: .45; cursor: not-allowed; }
.quick-secondary { border: 1px solid #e6dcef; color: #846596; background: white; }
@media(max-width:650px) { .quick-dialog { padding: 12px; } .quick-view-box { max-height: calc(100dvh - 24px); border-radius: 12px; } .quick-header { padding: 10px 14px; } .quick-body { grid-template-columns: 1fr; } .quick-visual { padding: 28px; } .quick-visual img { height: 185px; max-height: none; } .quick-details { padding: 21px; } .quick-details h2 { font-size: 21px; } .quick-footer { padding: 13px 16px; gap: 9px; } .quick-notice { max-width: none; width: 100%; } .quick-actions { width: 100%; } .quick-actions > * { flex: 1; font-size: 11px; padding-inline: 8px; } }
</style>
