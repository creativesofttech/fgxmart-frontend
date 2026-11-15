<template><img ref="image" :src="source" :alt="product?.name || 'Product image unavailable'" :width="width" :height="height" loading="lazy" decoding="async" @error="onError" /></template>
<script setup>
import { productImageCandidates } from '~/utils/productImages'
const props = defineProps({ product: { type: Object, default: null }, width: { type: [String, Number], default: 960 }, height: { type: [String, Number], default: 533 } })
const config = useRuntimeConfig()
const candidates = computed(() => productImageCandidates(props.product, config.public.apiBase))
const failed = ref(0)
const image = ref(null)
const source = computed(() => candidates.value[failed.value] || '/assets/images/home/product-placeholder.webp')
watch(() => candidates.value.join('|'), () => { failed.value = 0 })
const onError = () => { if (failed.value < candidates.value.length) failed.value++ }
onMounted(() => { if (image.value?.complete && !image.value.naturalWidth) onError() })
</script>
