<template>
  <form ref="form" class="header-search" role="search" @submit.prevent="submitSearch" @focusin="focused = true" @focusout="onFocusOut">
    <label for="storefront-search" class="sr-only">Search products</label>
    <input id="storefront-search" ref="input" v-model="query" class="tw:input" type="search" role="combobox" aria-autocomplete="list" aria-haspopup="listbox" :aria-expanded="showDropdown" :aria-controls="showDropdown ? 'storefront-search-options' : undefined" :aria-activedescendant="activeIndex >= 0 && showDropdown ? `search-product-${suggestions[activeIndex]?.id}` : undefined" aria-describedby="storefront-search-hint" placeholder="Search products, brands and more..." autocomplete="off" minlength="3" maxlength="100" required @keydown="onKeydown" @focus="visible = true" @compositionstart="composing = true" @compositionend="composing = false" />
    <span id="storefront-search-hint" class="sr-only">Type at least 3 characters. Use the up and down arrows to choose a product, Enter to open it, and Escape to close suggestions.</span>
    <button class="tw:btn tw:btn-primary search-submit" aria-label="Search" type="submit" :disabled="!eligible"><Search :size="21" aria-hidden="true" /></button>
    <div v-if="showDropdown" class="search-suggestions" @keydown.esc.stop.prevent="dismiss">
      <div class="suggestions-heading"><span><Search :size="14" aria-hidden="true" />{{ loading ? 'Finding your next favourite' : 'Suggested products' }}</span><span v-if="!loading && !failed">{{ total }} {{ total === 1 ? 'match' : 'matches' }}</span></div>
      <div v-if="loading" class="search-loading" role="status" aria-label="Searching products"><div v-for="index in 3" :key="index" class="suggestion-skeleton"><span class="tw:skeleton skeleton-image" /><span class="tw:skeleton skeleton-text" /></div></div>
      <div v-else-if="failed" class="suggestion-empty" role="alert"><SearchX :size="25" aria-hidden="true" /><strong>Search is taking a moment</strong><p>Please try again, or open the full results page.</p><button class="tw:btn tw:btn-sm tw:btn-outline" type="button" @click="schedule(0)">Try again</button></div>
      <template v-else>
        <p v-if="hasTypoMatches && suggestions.length" class="search-close-matches"><Sparkles :size="13" aria-hidden="true" /> Including close spelling matches</p>
        <div v-if="!suggestions.length" class="suggestion-empty"><SearchX :size="29" aria-hidden="true" /><strong>No matches just yet</strong><p>Try another product name, brand or category.</p></div>
      </template>
      <ul id="storefront-search-options" role="listbox" aria-label="Product suggestions" class="suggestion-list" :aria-busy="loading">
        <li v-for="(product, index) in suggestions" v-show="!loading && !failed" :key="product.id" role="none"><NuxtLink :id="`search-product-${product.id}`" :to="`/products/${product.slug}`" role="option" :aria-selected="activeIndex === index" tabindex="-1" class="suggestion-product" :class="{'is-active': activeIndex === index}" @pointerdown.prevent @pointermove="activeIndex = index" @click="leaveSearch">
          <ProductImage :product="product" :width="56" :height="56" class="suggestion-image" />
          <span class="suggestion-copy"><span class="suggestion-category">{{ [product.brand?.name, product.category?.name].filter(Boolean).join(' · ') || 'Explore product' }}</span><span class="suggestion-name"><template v-for="(part, partIndex) in highlighted(product.name)" :key="partIndex"><mark v-if="part.match">{{ part.text }}</mark><template v-else>{{ part.text }}</template></template></span><span class="suggestion-price">{{ money(product.discount_price ?? product.base_price) }}<del v-if="product.discount_price !== null && product.discount_price !== undefined && Number(product.discount_price) < Number(product.base_price)">{{ money(product.base_price) }}</del></span></span>
          <ArrowUpRight :size="16" class="suggestion-arrow" aria-hidden="true" />
        </NuxtLink></li>
      </ul>
      <p class="sr-only" role="status" aria-live="polite">{{ !loading && !failed ? `${total} products found.` : '' }}</p>
      <NuxtLink :to="resultsRoute" class="search-view-all" @click="leaveSearch"><span>View all results for <strong>“{{ trimmedQuery }}”</strong></span><ArrowRight :size="17" aria-hidden="true" /></NuxtLink>
      <div class="suggestions-hint" aria-hidden="true"><span>↑ ↓ to browse</span><span>Enter to select</span><span>Esc to close</span></div>
    </div>
  </form>
</template>

<script setup>
import { Search, SearchX, Sparkles, ArrowUpRight, ArrowRight } from 'lucide-vue-next'
import ProductImage from '~/components/product/Image.vue'
const route = useRoute(), config = useRuntimeConfig()
const query = ref(typeof route.query.search === 'string' ? route.query.search : '')
const form = ref(null), input = ref(null), focused = ref(false), visible = ref(false), composing = ref(false)
const suggestions = ref([]), total = ref(0), loading = ref(false), failed = ref(false), hasTypoMatches = ref(false), activeIndex = ref(-1)
const trimmedQuery = computed(() => query.value.trim())
const eligible = computed(() => [...trimmedQuery.value].length >= 3)
const showDropdown = computed(() => focused.value && visible.value && eligible.value && !composing.value)
const resultsRoute = computed(() => ({ path: '/products', query: { search: trimmedQuery.value } }))
let timer, controller, requestVersion = 0
const cancel = () => { clearTimeout(timer); controller?.abort(); controller = null; requestVersion++ }
const dismiss = () => { cancel(); visible.value = false; loading.value = false; activeIndex.value = -1 }
const leaveSearch = () => { dismiss(); focused.value = false; input.value?.blur() }
const schedule = (delay = 280) => {
  cancel(); suggestions.value = []; activeIndex.value = -1; failed.value = false; total.value = 0; hasTypoMatches.value = false
  if (!focused.value || !eligible.value || composing.value) { loading.value = false; return }
  visible.value = true; loading.value = true
  const version = requestVersion, term = trimmedQuery.value
  timer = setTimeout(async () => {
    const abort = new AbortController(); controller = abort
    try {
      const response = await $fetch(`${config.public.apiBase}/search/suggestions`, { query: { q: term }, signal: abort.signal, retry: 0 })
      if (version !== requestVersion || abort.signal.aborted) return
      suggestions.value = response.data || []; total.value = response.meta?.total ?? suggestions.value.length; hasTypoMatches.value = !!response.meta?.has_typo_matches
    } catch {
      if (version === requestVersion && !abort.signal.aborted) failed.value = true
    } finally { if (version === requestVersion) loading.value = false }
  }, delay)
}
watch([query, focused, composing], () => schedule())
watch(() => route.fullPath, () => {
  // A delayed navigation must not discard a new search the shopper has already started.
  if (focused.value) return
  dismiss(); query.value = typeof route.query.search === 'string' ? route.query.search : ''
})
const onFocusOut = event => { if (!form.value?.contains(event.relatedTarget)) { focused.value = false; dismiss() } }
const outside = event => { if (!form.value?.contains(event.target)) { focused.value = false; dismiss() } }
const submitSearch = () => {
  if (!eligible.value || composing.value) return
  const destination = resultsRoute.value
  leaveSearch(); navigateTo(destination)
}
const onKeydown = async event => {
  if (event.isComposing) return
  if (event.key === 'Enter' && showDropdown.value && activeIndex.value >= 0) {
    event.preventDefault()
    const destination = `/products/${suggestions.value[activeIndex.value].slug}`
    leaveSearch(); navigateTo(destination); return
  }
  if (event.key === 'Escape') { event.preventDefault(); event.stopPropagation(); dismiss(); return }
  if (!['ArrowDown', 'ArrowUp'].includes(event.key) || !eligible.value) return
  event.preventDefault(); visible.value = true
  if (!suggestions.value.length) return
  activeIndex.value = activeIndex.value < 0 ? (event.key === 'ArrowDown' ? 0 : suggestions.value.length - 1) : (activeIndex.value + (event.key === 'ArrowDown' ? 1 : -1) + suggestions.value.length) % suggestions.value.length
  await nextTick()
  document.getElementById(`search-product-${suggestions.value[activeIndex.value]?.id}`)?.scrollIntoView({ block: 'nearest' })
}
const highlighted = name => {
  const terms = trimmedQuery.value.split(/\s+/).filter(term => term.length > 1).map(term => term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
  if (!terms.length) return [{ text: name, match: false }]
  const expression = new RegExp(`(${terms.join('|')})`, 'ig')
  return String(name).split(expression).map((text, index) => ({ text, match: index % 2 === 1 }))
}
const money = value => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(Number(value) || 0)
onMounted(() => document.addEventListener('pointerdown', outside))
onBeforeUnmount(() => { cancel(); document.removeEventListener('pointerdown', outside) })
</script>

<style scoped>
.header-search { position: relative; display: flex; height: var(--header-field-height, 44px); box-sizing: border-box; border: 1px solid #e8e2ee; border-radius: 8px; background: #faf9fc; min-width: 0; }
.header-search:focus-within { border-color: #825bb3; box-shadow: 0 0 0 3px rgb(71 37 128 / 6%); }
.header-search .tw\:input { flex: 1; width: 0; min-width: 0; height: 100%; min-height: 0; padding: 0 13px; font-size: 12px; outline: none; border: 0; border-radius: 8px 0 0 8px; background: transparent; color: #332344; box-shadow: none; }
.header-search input::placeholder { color: #918798; }
.search-submit { width: 46px; min-height: 0; height: 100%; flex-shrink: 0; border-radius: 0 7px 7px 0; padding: 0; background: #472580; color: white; border: 0; }.search-submit:disabled { opacity: .6; }
.search-suggestions { position: absolute; z-index: 70; top: calc(100% + 10px); left: 0; right: 0; background: white; border: 1px solid #e5dcee; border-radius: 14px; box-shadow: 0 16px 46px rgb(44 21 73 / 15%); color: #382544; overflow: hidden; }
.suggestions-heading { display: flex; align-items: center; justify-content: space-between; gap: 12px; padding: 15px 18px; background: #faf7fe; border-bottom: 1px solid #f0eaf7; font-size: 11px; color: #8d789c; }.suggestions-heading > span:first-child { display: flex; align-items: center; gap: 8px; color: #684483; font-weight: 600; }.suggestions-heading > span:last-child { white-space: nowrap; }
.suggestion-list { list-style: none; padding: 5px 8px; margin: 0; max-height: min(430px, 48dvh); overflow-y: auto; overscroll-behavior: contain; }
.suggestion-product { display: flex; align-items: center; gap: 14px; padding: 11px 10px; border-radius: 9px; text-decoration: none; color: inherit; border: 1px solid transparent; }.suggestion-product:hover, .suggestion-product.is-active { background: #f8f3ff; border-color: #e9ddf7; }
.suggestion-image { width: 56px; height: 56px; object-fit: contain; flex-shrink: 0; background: #faf9fc; border-radius: 8px; padding: 5px; box-sizing: border-box; }
.suggestion-copy { min-width: 0; flex: 1; display: flex; flex-direction: column; gap: 4px; }.suggestion-category { color: #9b84aa; font-size: 9px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }.suggestion-name { font-size: 12px; font-weight: 550; line-height: 1.65; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }.suggestion-name mark { color: #472580; background: #eae0f8; border-radius: 2px; font-weight: 650; }.suggestion-price { display: flex; align-items: center; flex-wrap: wrap; gap: 8px; color: #62823f; font-size: 12px; font-weight: 650; }.suggestion-price del { color: #aa9bb5; font-size: 10px; font-weight: 400; }.suggestion-arrow { flex-shrink: 0; color: #a38ab7; }
.search-close-matches { display: flex; align-items: center; gap: 7px; margin: 0; padding: 10px 18px 4px; color: #9b83ac; font-size: 10px; }
.suggestion-empty { display: flex; flex-direction: column; align-items: center; gap: 10px; padding: 28px 18px; color: #af9bbf; text-align: center; }.suggestion-empty strong { font-size: 13px; color: #6b4c80; }.suggestion-empty p { font-size: 11px; line-height: 1.7; margin: 0; }
.search-view-all { display: flex; align-items: center; justify-content: space-between; gap: 12px; padding: 15px 18px; border-top: 1px solid #f0eaf7; text-decoration: none; font-size: 11px; color: #704b90; background: #fcfaff; }.search-view-all > span { min-width: 0; overflow-wrap: anywhere; }.search-view-all:hover { background: #f4ecfd; }.search-view-all:focus-visible { outline: 2px solid #906bb4; outline-offset: -3px; }
.suggestions-hint { display: flex; justify-content: center; gap: 18px; padding: 8px; font-size: 9px; color: #af9cbb; background: #fff; }
.search-loading { padding: 8px 18px; }.suggestion-skeleton { display: flex; align-items: center; gap: 14px; margin: 12px 0; }.skeleton-image { width: 56px; height: 56px; border-radius: 8px; }.skeleton-text { flex: 1; height: 26px; border-radius: 5px; }
.sr-only { position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px; overflow: hidden; clip: rect(0, 0, 0, 0); white-space: nowrap; border: 0; }
@media(max-width:760px) { .header-search .tw\:input { font-size: 11px; }.search-suggestions { top: calc(100% + 8px); }.suggestions-heading, .search-view-all { padding: 12px; }.suggestion-product { gap: 10px; padding: 9px 5px; }.suggestion-name { font-size: 11px; }.suggestion-image { width: 47px; height: 47px; }.suggestions-hint { display: none; } }
@media(prefers-reduced-motion:reduce) { .tw\:skeleton { animation: none; } }
</style>
